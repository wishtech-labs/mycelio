-- 修复缺失的RPC函数
-- 请在 Supabase Dashboard > SQL Editor 中执行

-- 1. submit_task_result - 提交任务结果
CREATE OR REPLACE FUNCTION submit_task_result(
    p_task_id UUID,
    p_solver_id UUID,
    p_result JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_task RECORD;
BEGIN
    SELECT * INTO v_task
    FROM tasks
    WHERE task_id = p_task_id
    FOR UPDATE;
    
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

-- 2. settle_task - 结算任务
CREATE OR REPLACE FUNCTION settle_task(
    p_task_id UUID,
    p_publisher_id UUID,
    p_accept BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_task RECORD;
    v_solver_balance INTEGER;
    v_publisher_escrow INTEGER;
    v_final_status TEXT;
    v_publisher_balance INTEGER;
BEGIN
    SELECT * INTO v_task
    FROM tasks
    WHERE task_id = p_task_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'TASK_NOT_FOUND', 'message', 'Task not found');
    END IF;
    
    IF v_task.status != 'SUBMITTED' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'TASK_NOT_SETTLABLE', 'message', 'Task is not in settlable state');
    END IF;
    
    IF v_task.publisher_id != p_publisher_id THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN', 'message', 'Only publisher can settle');
    END IF;
    
    IF p_accept THEN
        v_final_status := 'COMPLETED';
        
        SELECT karma_balance INTO v_solver_balance
        FROM agents WHERE agent_id = v_task.solver_id
        FOR UPDATE;
        
        UPDATE agents
        SET karma_balance = karma_balance + v_task.bounty
        WHERE agent_id = v_task.solver_id;
        
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
        
        UPDATE agents
        SET karma_escrow = karma_escrow - v_task.bounty
        WHERE agent_id = p_publisher_id;
        
    ELSE
        v_final_status := 'FAILED';
        
        SELECT karma_balance INTO v_publisher_balance
        FROM agents WHERE agent_id = p_publisher_id
        FOR UPDATE;
        
        UPDATE agents
        SET karma_balance = karma_balance + v_task.bounty,
            karma_escrow = karma_escrow - v_task.bounty
        WHERE agent_id = p_publisher_id;
        
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

-- 3. get_leaderboard - 排行榜
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    rank BIGINT,
    agent_id UUID,
    alias VARCHAR(64),
    karma INTEGER,
    tasks_completed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY a.karma_balance DESC) AS rank,
        a.agent_id,
        a.alias,
        a.karma_balance AS karma,
        COALESCE(t.completed_count, 0) AS tasks_completed
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

-- 4. reclaim_timeout_tasks - 回收超时任务
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

-- 5. auto_settle_timeout_tasks - 自动结算超时任务
CREATE OR REPLACE FUNCTION auto_settle_timeout_tasks()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_task RECORD;
    v_solver_balance INTEGER;
BEGIN
    FOR v_task IN 
        SELECT * FROM tasks 
        WHERE status = 'SUBMITTED' 
          AND settle_timeout_at < NOW()
        FOR UPDATE
    LOOP
        SELECT karma_balance INTO v_solver_balance
        FROM agents WHERE agent_id = v_task.solver_id
        FOR UPDATE;
        
        UPDATE agents
        SET karma_balance = karma_balance + v_task.bounty
        WHERE agent_id = v_task.solver_id;
        
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
        
        UPDATE agents
        SET karma_escrow = karma_escrow - v_task.bounty
        WHERE agent_id = v_task.publisher_id;
        
        UPDATE tasks
        SET status = 'COMPLETED', settled_at = NOW()
        WHERE task_id = v_task.task_id;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 验证创建成功
SELECT 'RPC函数创建完成' as status;
