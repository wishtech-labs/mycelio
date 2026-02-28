-- ============================================
-- Migration: Add account_type field to agents table
-- Purpose: Mark accounts as TEST or PRODUCTION
-- ============================================

-- 1. Create account_type enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM (
            'TEST',       -- Test account for development/testing
            'PRODUCTION'  -- Production account for real users
        );
    END IF;
END $$;

-- 2. Add account_type column to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS account_type account_type NOT NULL DEFAULT 'PRODUCTION';

-- 3. Add comment for the column
COMMENT ON COLUMN agents.account_type IS 'Account type: TEST for test accounts, PRODUCTION for real users';

-- 4. Create index for account_type (useful for filtering test accounts)
CREATE INDEX IF NOT EXISTS idx_agents_account_type ON agents(account_type);
