-- ============================================
-- Migration: Fix A2A cancel task race condition
-- Version: 0.2.2
-- Purpose: Move cancel task logic to atomic RPC function
-- ============================================

-- ============================================
-- Function: cancel_task_atomic(p_task_a2a_id, p_publisher_id)
-- Atomically cancel an OPEN task with proper locking
-- Returns Karma to publisher's balance
-- ============================================
CREATE OR REPLACE FUNCTION cancel_task_atomic(
    p_task_a2a_id TEXT,
    p_publisher_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_task RECORD;
    v_agent RECORD;
    v_task_id UUID;
BEGIN
    -- Find task by A2A task ID in payload_prompt
    -- Use FOR UPDATE to lock the row
    SELECT t.* INTO v_task
    FROM tasks t
    WHERE t.payload_prompt->>'a2a_task_id' = p_task_a2a_id
      AND t.publisher_id = p_publisher_id
    FOR UPDATE;
    
    -- Task not found
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'TASK_NOT_FOUND',
            'message', 'Task not found or you are not the publisher'
        );
    END IF;
    
    -- Store task_id for later use
    v_task_id := v_task.task_id;
    
    -- Only OPEN tasks can be cancelled
    IF v_task.status != 'OPEN' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'TASK_NOT_CANCELABLE',
            'message', 'Task cannot be cancelled - already claimed or completed',
            'details', jsonb_build_object('current_status', v_task.status)
        );
    END IF;
    
    -- Get and lock publisher's agent row
    SELECT * INTO v_agent
    FROM agents
    WHERE agent_id = p_publisher_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'PUBLISHER_NOT_FOUND',
            'message', 'Publisher agent not found'
        );
    END IF;
    
    -- Refund the bounty (unfreeze karma)
    UPDATE agents
    SET karma_balance = karma_balance + v_task.bounty,
        karma_escrow = karma_escrow - v_task.bounty,
        updated_at = NOW()
    WHERE agent_id = p_publisher_id;
    
    -- Record unfreeze transaction
    INSERT INTO transactions (
        agent_id, 
        task_id, 
        tx_type, 
        amount, 
        balance_before, 
        balance_after, 
        description
    ) VALUES (
        p_publisher_id,
        v_task_id,
        'UNFREEZE',
        v_task.bounty,
        v_agent.karma_balance,
        v_agent.karma_balance + v_task.bounty,
        'Task cancelled - bounty refunded (A2A)'
    );
    
    -- Delete the task
    DELETE FROM tasks WHERE task_id = v_task_id;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'task_id', p_task_a2a_id,
            'status', 'CANCELLED',
            'refunded_bounty', v_task.bounty,
            'cancelled_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION cancel_task_atomic IS 'Atomically cancel an OPEN A2A task, refunding bounty to publisher';
