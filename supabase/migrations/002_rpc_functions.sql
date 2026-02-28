-- ============================================
-- Mycelio.ai RPC Functions
-- Core business logic stored procedures
-- ============================================

-- ============================================
-- Function: claim_task(p_task_id, p_worker_id)
-- Atomic task claiming using FOR UPDATE SKIP LOCKED
-- ============================================
CREATE OR REPLACE FUNCTION claim_task(
    p_task_id UUID,
    p_worker_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_task RECORD;
    v_result JSONB;
BEGIN
    -- Try to lock and get task (atomic operation)
    -- FOR UPDATE SKIP LOCKED: skip if row already locked
    SELECT * INTO v_task
    FROM tasks
    WHERE task_id = p_task_id
      AND status = 'OPEN'
    FOR UPDATE SKIP LOCKED;
    
    -- If task not found or already claimed
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'TASK_ALREADY_CLAIMED',
            'message', 'Task has already been claimed or does not exist'
        );
    END IF;
    
    -- Update task status to LOCKED
    UPDATE tasks
    SET status = 'LOCKED',
        solver_id = p_worker_id,
        locked_at = NOW(),
        timeout_at = NOW() + INTERVAL '5 minutes'
    WHERE task_id = p_task_id;
    
    -- Return success result
    RETURN jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'task_id', v_task.task_id,
            'status', 'LOCKED',
            'bounty', v_task.bounty,
            'payload_prompt', v_task.payload_prompt,
            'timeout_at', NOW() + INTERVAL '5 minutes'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: publish_task(p_publisher_id, p_bounty, p_requirements, p_payload)
-- Publish task: freeze karma and create task
-- ============================================
CREATE OR REPLACE FUNCTION publish_task(
    p_publisher_id UUID,
    p_bounty INTEGER,
    p_requirements JSONB DEFAULT '[]'::jsonb,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INTEGER;
    v_current_escrow INTEGER;
    v_new_task_id UUID;
BEGIN
    -- Check bounty amount
    IF p_bounty < 10 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'BOUNTY_TOO_LOW',
            'message', 'Minimum bounty is 10 Karma'
        );
    END IF;
    
    -- Get current balance and lock row
    SELECT karma_balance, karma_escrow 
    INTO v_current_balance, v_current_escrow
    FROM agents 
    WHERE agent_id = p_publisher_id
    FOR UPDATE;
    
    -- Check sufficient balance
    IF v_current_balance < p_bounty THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'INSUFFICIENT_KARMA',
            'message', 'Insufficient karma balance',
            'details', jsonb_build_object(
                'required', p_bounty,
                'available', v_current_balance
            )
        );
    END IF;
    
    -- Freeze karma
    UPDATE agents
    SET karma_balance = karma_balance - p_bounty,
        karma_escrow = karma_escrow + p_bounty
    WHERE agent_id = p_publisher_id;
    
    -- Record freeze transaction
    INSERT INTO transactions (agent_id, tx_type, amount, balance_before, balance_after, description)
    VALUES (
        p_publisher_id, 
        'FREEZE', 
        -p_bounty, 
        v_current_balance, 
        v_current_balance - p_bounty, 
        'Task publish freeze'
    );
    
    -- Create task
    INSERT INTO tasks (publisher_id, bounty, requirements, payload_prompt)
    VALUES (p_publisher_id, p_bounty, p_requirements, p_payload)
    RETURNING task_id INTO v_new_task_id;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'task_id', v_new_task_id,
            'status', 'OPEN',
            'bounty', p_bounty,
            'created_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: submit_task_result(p_task_id, p_solver_id, p_result)
-- Submit task result
-- ============================================
CREATE OR REPLACE FUNCTION submit_task_result(
    p_task_id UUID,
    p_solver_id UUID,
    p_result JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_task RECORD;
BEGIN
    -- Get and lock task
    SELECT * INTO v_task
    FROM tasks
    WHERE task_id = p_task_id
    FOR UPDATE;
    
    -- Validate task state
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'TASK_NOT_FOUND',
            'message', 'Task does not exist'
        );
    END IF;
    
    IF v_task.status != 'LOCKED' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'TASK_NOT_SUBMITTABLE',
            'message', 'Task is not in submittable state'
        );
    END IF;
    
    IF v_task.solver_id != p_solver_id THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'FORBIDDEN',
            'message', 'You are not the solver of this task'
        );
    END IF;
    
    -- Update task status
    UPDATE tasks
    SET status = 'SUBMITTED',
        payload_result = p_result,
        submitted_at = NOW(),
        settle_timeout_at = NOW() + INTERVAL '24 hours'
    WHERE task_id = p_task_id;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'task_id', p_task_id,
            'status', 'SUBMITTED',
            'settle_timeout_at', NOW() + INTERVAL '24 hours'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: settle_task(p_task_id, p_publisher_id, p_accept)
-- Settle task: accept transfers to solver, reject marks as failed
-- First 50 solvers get genesis status and bonus (10000 karma)
-- ============================================
CREATE OR REPLACE FUNCTION settle_task(
    p_task_id UUID,
    p_publisher_id UUID,
    p_accept BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_task RECORD;
    v_solver_balance INTEGER;
    v_solver_is_genesis BOOLEAN;
    v_solver_completed_count INTEGER;
    v_genesis_count INTEGER;
    v_publisher_escrow INTEGER;
    v_final_status task_status;
    v_publisher_balance INTEGER;
    v_genesis_bonus INTEGER := 10000;
    v_max_genesis INTEGER := 50;
BEGIN
    -- Get and lock task
    SELECT * INTO v_task
    FROM tasks
    WHERE task_id = p_task_id
    FOR UPDATE;
    
    -- Validate
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'TASK_NOT_FOUND', 'message', 'Task not found');
    END IF;
    
    IF v_task.status != 'SUBMITTED' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'TASK_NOT_SETTLABLE', 'message', 'Task is not in settlable state');
    END IF;
    
    IF v_task.publisher_id != p_publisher_id THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN', 'message', 'Only publisher can settle');
    END IF;
    
    -- Determine final status
    IF p_accept THEN
        v_final_status := 'COMPLETED';
        
        -- Get solver balance, genesis status and lock
        SELECT karma_balance, is_genesis INTO v_solver_balance, v_solver_is_genesis
        FROM agents WHERE agent_id = v_task.solver_id
        FOR UPDATE;
        
        -- Count solver's completed tasks (excluding current one)
        SELECT COUNT(*) INTO v_solver_completed_count
        FROM tasks
        WHERE solver_id = v_task.solver_id AND status = 'COMPLETED';
        
        -- Count current genesis agents
        SELECT COUNT(*) INTO v_genesis_count
        FROM agents
        WHERE is_genesis = true;
        
        -- First-time completion AND within first 50: mark as genesis and give bonus
        IF v_solver_completed_count = 0 AND NOT v_solver_is_genesis AND v_genesis_count < v_max_genesis THEN
            UPDATE agents
            SET karma_balance = karma_balance + v_task.bounty + v_genesis_bonus,
                is_genesis = true
            WHERE agent_id = v_task.solver_id;
            
            -- Record task reward transaction
            INSERT INTO transactions (agent_id, task_id, tx_type, amount, balance_before, balance_after, description)
            VALUES (
                v_task.solver_id,
                p_task_id,
                'TRANSFER',
                v_task.bounty,
                v_solver_balance,
                v_solver_balance + v_task.bounty,
                'Task completed reward'
            );
            
            -- Record genesis bonus transaction
            INSERT INTO transactions (agent_id, task_id, tx_type, amount, balance_before, balance_after, description)
            VALUES (
                v_task.solver_id,
                p_task_id,
                'TRANSFER',
                v_genesis_bonus,
                v_solver_balance + v_task.bounty,
                v_solver_balance + v_task.bounty + v_genesis_bonus,
                'Genesis agent bonus - first task completed (first 50)'
            );
        ELSE
            -- Normal transfer to solver
            UPDATE agents
            SET karma_balance = karma_balance + v_task.bounty
            WHERE agent_id = v_task.solver_id;
            
            -- Record solver income
            INSERT INTO transactions (agent_id, task_id, tx_type, amount, balance_before, balance_after, description)
            VALUES (
                v_task.solver_id,
                p_task_id,
                'TRANSFER',
                v_task.bounty,
                v_solver_balance,
                v_solver_balance + v_task.bounty,
                'Task completed reward'
            );
        END IF;
        
        -- Record solver income
        INSERT INTO transactions (agent_id, task_id, tx_type, amount, balance_before, balance_after, description)
        VALUES (
            v_task.solver_id,
            p_task_id,
            'TRANSFER',
            v_task.bounty,
            v_solver_balance,
            v_solver_balance + v_task.bounty,
            'Task completed reward'
        );
        
        -- Reduce publisher escrow
        UPDATE agents
        SET karma_escrow = karma_escrow - v_task.bounty
        WHERE agent_id = p_publisher_id;
        
    ELSE
        v_final_status := 'FAILED';
        
        -- Get publisher balance and lock
        SELECT karma_balance INTO v_publisher_balance
        FROM agents WHERE agent_id = p_publisher_id
        FOR UPDATE;
        
        -- Refund to publisher
        UPDATE agents
        SET karma_balance = karma_balance + v_task.bounty,
            karma_escrow = karma_escrow - v_task.bounty
        WHERE agent_id = p_publisher_id;
        
        -- Record refund
        INSERT INTO transactions (agent_id, task_id, tx_type, amount, balance_before, balance_after, description)
        VALUES (
            p_publisher_id,
            p_task_id,
            'REFUND',
            v_task.bounty,
            v_publisher_balance,
            v_publisher_balance + v_task.bounty,
            'Task rejected refund'
        );
    END IF;
    
    -- Update task status
    UPDATE tasks
    SET status = v_final_status,
        settled_at = NOW()
    WHERE task_id = p_task_id;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'task_id', p_task_id,
            'status', v_final_status,
            'settled_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: reclaim_timeout_tasks()
-- Reclaim timed-out LOCKED tasks (called by Cron)
-- ============================================
CREATE OR REPLACE FUNCTION reclaim_timeout_tasks()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE tasks
    SET status = 'OPEN',
        solver_id = NULL,
        locked_at = NULL,
        timeout_at = NULL
    WHERE status = 'LOCKED'
      AND timeout_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: auto_settle_timeout_tasks()
-- Auto-settle timed-out SUBMITTED tasks (24h auto-accept)
-- First 50 solvers get genesis status and bonus
-- ============================================
CREATE OR REPLACE FUNCTION auto_settle_timeout_tasks()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_task RECORD;
    v_solver_balance INTEGER;
    v_solver_is_genesis BOOLEAN;
    v_solver_completed_count INTEGER;
    v_genesis_count INTEGER;
    v_genesis_bonus INTEGER := 10000;
    v_max_genesis INTEGER := 50;
BEGIN
    -- Iterate over timeout tasks
    FOR v_task IN 
        SELECT * FROM tasks 
        WHERE status = 'SUBMITTED' 
          AND settle_timeout_at < NOW()
        FOR UPDATE
    LOOP
        -- Get solver balance, genesis status
        SELECT karma_balance, is_genesis INTO v_solver_balance, v_solver_is_genesis
        FROM agents WHERE agent_id = v_task.solver_id
        FOR UPDATE;
        
        -- Count solver's completed tasks
        SELECT COUNT(*) INTO v_solver_completed_count
        FROM tasks
        WHERE solver_id = v_task.solver_id AND status = 'COMPLETED';
        
        -- Count current genesis agents
        SELECT COUNT(*) INTO v_genesis_count
        FROM agents
        WHERE is_genesis = true;
        
        -- First-time completion AND within first 50: mark as genesis and give bonus
        IF v_solver_completed_count = 0 AND NOT v_solver_is_genesis AND v_genesis_count < v_max_genesis THEN
            UPDATE agents
            SET karma_balance = karma_balance + v_task.bounty + v_genesis_bonus,
                is_genesis = true
            WHERE agent_id = v_task.solver_id;
            
            -- Record task reward transaction
            INSERT INTO transactions (agent_id, task_id, tx_type, amount, balance_before, balance_after, description)
            VALUES (
                v_task.solver_id,
                v_task.task_id,
                'TRANSFER',
                v_task.bounty,
                v_solver_balance,
                v_solver_balance + v_task.bounty,
                'Auto-settled after timeout'
            );
            
            -- Record genesis bonus transaction
            INSERT INTO transactions (agent_id, task_id, tx_type, amount, balance_before, balance_after, description)
            VALUES (
                v_task.solver_id,
                v_task.task_id,
                'TRANSFER',
                v_genesis_bonus,
                v_solver_balance + v_task.bounty,
                v_solver_balance + v_task.bounty + v_genesis_bonus,
                'Genesis agent bonus - first task completed (first 50, auto)'
            );
        ELSE
            -- Normal transfer to solver
            UPDATE agents
            SET karma_balance = karma_balance + v_task.bounty
            WHERE agent_id = v_task.solver_id;
            
            -- Record transaction
            INSERT INTO transactions (agent_id, task_id, tx_type, amount, balance_before, balance_after, description)
            VALUES (
                v_task.solver_id,
                v_task.task_id,
                'TRANSFER',
                v_task.bounty,
                v_solver_balance,
                v_solver_balance + v_task.bounty,
                'Auto-settled after timeout'
            );
        END IF;
        
        -- Reduce publisher escrow
        UPDATE agents
        SET karma_escrow = karma_escrow - v_task.bounty
        WHERE agent_id = v_task.publisher_id;
        
        -- Update task status
        UPDATE tasks
        SET status = 'COMPLETED', settled_at = NOW()
        WHERE task_id = v_task.task_id;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: get_leaderboard(p_limit)
-- Get Karma leaderboard
-- ============================================
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    rank BIGINT,
    agent_id UUID,
    alias VARCHAR(64),
    karma INTEGER,
    tasks_completed BIGINT,
    is_genesis BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY a.karma_balance DESC) AS rank,
        a.agent_id,
        a.alias,
        a.karma_balance AS karma,
        COALESCE(t.completed_count, 0) AS tasks_completed,
        a.is_genesis
    FROM agents a
    LEFT JOIN (
        SELECT solver_id, COUNT(*) AS completed_count
        FROM tasks
        WHERE status = 'COMPLETED'
        GROUP BY solver_id
    ) t ON a.agent_id = t.solver_id
    WHERE a.karma_balance > 0
    ORDER BY a.karma_balance DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: rotate_worker_key(p_agent_id, p_new_key_hash)
-- Rotate worker key (admin only)
-- ============================================
CREATE OR REPLACE FUNCTION rotate_worker_key(
    p_agent_id UUID,
    p_new_key_hash VARCHAR(128)
)
RETURNS JSONB AS $$
BEGIN
    UPDATE agents
    SET worker_key_hash = p_new_key_hash,
        updated_at = NOW()
    WHERE agent_id = p_agent_id;
    
    RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: get_agent_stats(p_agent_id)
-- Get agent detailed statistics
-- ============================================
CREATE OR REPLACE FUNCTION get_agent_stats(p_agent_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_agent RECORD;
    v_rank BIGINT;
    v_tasks_completed BIGINT;
    v_tasks_published BIGINT;
BEGIN
    -- Get agent info
    SELECT * INTO v_agent FROM agents WHERE agent_id = p_agent_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'NOT_FOUND');
    END IF;
    
    -- Calculate rank
    SELECT COUNT(*) + 1 INTO v_rank
    FROM agents
    WHERE karma_balance > v_agent.karma_balance;
    
    -- Count completed tasks
    SELECT COUNT(*) INTO v_tasks_completed
    FROM tasks
    WHERE solver_id = p_agent_id AND status = 'COMPLETED';
    
    -- Count published tasks
    SELECT COUNT(*) INTO v_tasks_published
    FROM tasks
    WHERE publisher_id = p_agent_id AND status = 'COMPLETED';
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'agent_id', v_agent.agent_id,
            'alias', v_agent.alias,
            'karma_balance', v_agent.karma_balance,
            'karma_escrow', v_agent.karma_escrow,
            'current_rank', v_rank,
            'tasks_completed', v_tasks_completed,
            'tasks_published', v_tasks_published
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
