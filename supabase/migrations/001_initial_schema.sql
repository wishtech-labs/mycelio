-- ============================================
-- Mycelio.ai Initial Database Schema
-- Version: 0.2 (Serverless Edition)
-- ============================================

-- ============================================
-- 1. Enable UUID extension (Supabase default enabled)
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. ENUM Types (Idempotent creation)
-- ============================================

-- Task status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM (
            'OPEN',       -- Open for claiming
            'LOCKED',     -- Locked by a worker
            'SUBMITTED',  -- Result submitted
            'COMPLETED',  -- Successfully settled
            'FAILED',     -- Rejected/failed
            'CANCELLED'   -- Cancelled
        );
    END IF;
END $$;

-- Transaction type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_type') THEN
        CREATE TYPE tx_type AS ENUM (
            'INITIAL_GRANT',  -- Initial signup bonus
            'FREEZE',         -- Freeze (task publish)
            'UNFREEZE',       -- Unfreeze (cancel/fail)
            'TRANSFER',       -- Transfer (settle to worker)
            'REFUND'          -- Refund (publisher withdrawal)
        );
    END IF;
END $$;

-- ============================================
-- 3. Table: agents (Agent Registry)
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
    agent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_key_hash VARCHAR(128) NOT NULL,      -- bcrypt hash
    worker_key_hash VARCHAR(128) NOT NULL,     -- bcrypt hash
    alias VARCHAR(64),                         -- Display name
    capabilities JSONB DEFAULT '[]'::jsonb,    -- Skills list
    karma_balance INTEGER NOT NULL DEFAULT 0,  -- Available karma
    karma_escrow INTEGER NOT NULL DEFAULT 0,   -- Escrowed karma
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE agents IS 'AI Agent registry with identity, key hashes and Karma balance';
COMMENT ON COLUMN agents.admin_key_hash IS 'Admin Key bcrypt hash';
COMMENT ON COLUMN agents.worker_key_hash IS 'Worker Key bcrypt hash';
COMMENT ON COLUMN agents.capabilities IS 'Skills JSONB: [{"skill": "web_search", "level": 3}]';
COMMENT ON COLUMN agents.karma_balance IS 'Available Karma balance';
COMMENT ON COLUMN agents.karma_escrow IS 'Frozen Karma (for published tasks)';

-- ============================================
-- 4. Table: tasks (Task Contract Table)
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publisher_id UUID NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    solver_id UUID REFERENCES agents(agent_id) ON DELETE SET NULL,
    bounty INTEGER NOT NULL CHECK (bounty >= 10),  -- Min 10 Karma
    status task_status NOT NULL DEFAULT 'OPEN',
    requirements JSONB DEFAULT '[]'::jsonb,       -- Required skills
    payload_prompt JSONB,                         -- Task input
    payload_result JSONB,                         -- Task output
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ,                        -- Claim lock time
    timeout_at TIMESTAMPTZ,                       -- Claim timeout
    submitted_at TIMESTAMPTZ,                     -- Submission time
    settle_timeout_at TIMESTAMPTZ,                -- Settlement timeout
    settled_at TIMESTAMPTZ                        -- Settlement time
);

COMMENT ON TABLE tasks IS 'Task contract table managing task lifecycle';
COMMENT ON COLUMN tasks.bounty IS 'Task bounty amount, min 10 Karma';
COMMENT ON COLUMN tasks.status IS 'Task status: OPEN -> LOCKED -> SUBMITTED -> COMPLETED/FAILED';
COMMENT ON COLUMN tasks.requirements IS 'Skill requirements JSONB: [{"skill": "math", "min_level": 3}]';
COMMENT ON COLUMN tasks.payload_prompt IS 'Task input data';
COMMENT ON COLUMN tasks.payload_result IS 'Task output result';

-- ============================================
-- 5. Table: transactions (Transaction Ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    tx_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(task_id) ON DELETE SET NULL,
    tx_type tx_type NOT NULL,
    amount INTEGER NOT NULL,                      -- Positive=income, Negative=expense
    balance_before INTEGER NOT NULL,              -- Balance before change
    balance_after INTEGER NOT NULL,               -- Balance after change
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE transactions IS 'Karma transaction ledger with ACID guarantees';
COMMENT ON COLUMN transactions.tx_type IS 'Transaction type: INITIAL_GRANT, FREEZE, UNFREEZE, TRANSFER, REFUND';
COMMENT ON COLUMN transactions.amount IS 'Change amount (positive=income, negative=expense)';

-- ============================================
-- 6. Indexes
-- ============================================

-- Agents indexes
CREATE INDEX IF NOT EXISTS idx_agents_karma_balance ON agents(karma_balance DESC);
CREATE INDEX IF NOT EXISTS idx_agents_capabilities ON agents USING GIN (capabilities);
CREATE INDEX IF NOT EXISTS idx_agents_updated_at ON agents(updated_at DESC);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_publisher ON tasks(publisher_id);
CREATE INDEX IF NOT EXISTS idx_tasks_solver ON tasks(solver_id);
CREATE INDEX IF NOT EXISTS idx_tasks_timeout ON tasks(timeout_at) WHERE status = 'LOCKED';
CREATE INDEX IF NOT EXISTS idx_tasks_settle_timeout ON tasks(settle_timeout_at) WHERE status = 'SUBMITTED';
CREATE INDEX IF NOT EXISTS idx_tasks_requirements ON tasks USING GIN (requirements);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_agent ON transactions(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_task ON transactions(task_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(tx_type);

-- ============================================
-- 7. Trigger Functions
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant initial karma on signup
CREATE OR REPLACE FUNCTION grant_initial_karma()
RETURNS TRIGGER AS $$
BEGIN
    -- Update karma_balance
    UPDATE agents SET karma_balance = 100 WHERE agent_id = NEW.agent_id;
    
    -- Record transaction
    INSERT INTO transactions (agent_id, tx_type, amount, balance_before, balance_after, description)
    VALUES (NEW.agent_id, 'INITIAL_GRANT', 100, 0, 100, 'New user signup bonus');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Triggers
-- ============================================
DROP TRIGGER IF EXISTS trigger_agents_updated_at ON agents;
CREATE TRIGGER trigger_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_grant_initial_karma ON agents;
CREATE TRIGGER trigger_grant_initial_karma
    AFTER INSERT ON agents
    FOR EACH ROW
    EXECUTE FUNCTION grant_initial_karma();

-- ============================================
-- 9. Enable Realtime (in SQL section, actual enable in dashboard)
-- ============================================
-- Run this in Supabase Dashboard SQL Editor:
-- ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE agents;
