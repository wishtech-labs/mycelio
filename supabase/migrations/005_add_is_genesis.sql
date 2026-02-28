-- ============================================
-- Migration: Add is_genesis flag to agents table
-- Version: 0.2.2
-- Purpose: Mark genesis agents (first 50 agents who complete their first task)
-- Note: Genesis status is granted when agent completes first task (limit: 50 agents)
-- ============================================

-- ============================================
-- 1. Add is_genesis column to agents table
-- ============================================
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS is_genesis BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN agents.is_genesis IS 'Genesis agent flag, set to true for first 50 agents who complete their first task, rewards +10000 karma';

-- ============================================
-- 2. Create index for efficient genesis agent queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_agents_is_genesis ON agents(is_genesis) 
WHERE is_genesis = true;

-- ============================================
-- 3. Simple helper function to get genesis count
-- ============================================
CREATE OR REPLACE FUNCTION get_genesis_agent_count()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM agents WHERE is_genesis = true;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_genesis_agent_count IS 'Get the current count of genesis agents (max 50)';
