-- ============================================
-- Migration: Add key prefix indexes for performance
-- Version: 0.2.1
-- Purpose: Optimize API key verification from O(n) to O(1)
-- ============================================

-- ============================================
-- 1. Add prefix columns for indexed lookup
-- ============================================
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS admin_key_prefix VARCHAR(8),
ADD COLUMN IF NOT EXISTS worker_key_prefix VARCHAR(8);

-- ============================================
-- 2. Create indexes on prefix columns
-- ============================================
CREATE INDEX IF NOT EXISTS idx_agents_admin_prefix ON agents(admin_key_prefix);
CREATE INDEX IF NOT EXISTS idx_agents_worker_prefix ON agents(worker_key_prefix);

-- ============================================
-- 3. Function to extract prefix from key hash
-- ============================================
CREATE OR REPLACE FUNCTION extract_key_prefix(key_text TEXT)
RETURNS VARCHAR(8) AS $$
DECLARE
    prefix VARCHAR(8);
BEGIN
    -- Extract chars after prefix (admin-myc_ or sk-myc_)
    IF key_text LIKE 'admin-myc_%' THEN
        prefix := SUBSTRING(key_text FROM 11 FOR 8);  -- After 'admin-myc_'
    ELSIF key_text LIKE 'sk-myc_%' THEN
        prefix := SUBSTRING(key_text FROM 8 FOR 8);   -- After 'sk-myc_'
    ELSE
        prefix := NULL;
    END IF;
    RETURN prefix;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 4. Backfill existing data (if any)
-- ============================================
-- Note: Cannot extract prefixes from existing hashes
-- Existing agents will need to rotate keys to populate prefixes
-- or manual update if plaintext keys are available

-- ============================================
-- 5. Update trigger for auto-populating prefixes
-- ============================================
CREATE OR REPLACE FUNCTION populate_key_prefixes()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract prefixes from plaintext keys (only available during insert/update)
    -- Note: These are populated by the application layer during key generation
    -- This trigger serves as a fallback if not set by app
    IF NEW.admin_key_prefix IS NULL AND TG_OP = 'INSERT' THEN
        -- Mark for key rotation
        NEW.admin_key_prefix := 'ROTATION';
    END IF;
    IF NEW.worker_key_prefix IS NULL AND TG_OP = 'INSERT' THEN
        NEW.worker_key_prefix := 'ROTATION';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_populate_key_prefixes ON agents;
CREATE TRIGGER trigger_populate_key_prefixes
    BEFORE INSERT OR UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION populate_key_prefixes();

-- ============================================
-- 6. Update existing registration to include prefixes
-- ============================================
CREATE OR REPLACE FUNCTION register_agent_with_prefixes(
    p_admin_key_hash VARCHAR(128),
    p_worker_key_hash VARCHAR(128),
    p_admin_key_prefix VARCHAR(8),
    p_worker_key_prefix VARCHAR(8),
    p_alias VARCHAR(64) DEFAULT NULL,
    p_capabilities JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_agent_id UUID;
BEGIN
    INSERT INTO agents (
        admin_key_hash, 
        worker_key_hash, 
        admin_key_prefix,
        worker_key_prefix,
        alias, 
        capabilities
    ) VALUES (
        p_admin_key_hash,
        p_worker_key_hash,
        p_admin_key_prefix,
        p_worker_key_prefix,
        p_alias,
        p_capabilities
    )
    RETURNING agent_id INTO v_agent_id;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'agent_id', v_agent_id,
            'karma_balance', 100
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Update rotate key function to handle prefixes
-- ============================================
CREATE OR REPLACE FUNCTION rotate_worker_key_with_prefix(
    p_agent_id UUID,
    p_new_key_hash VARCHAR(128),
    p_new_key_prefix VARCHAR(8)
)
RETURNS JSONB AS $$
BEGIN
    UPDATE agents
    SET worker_key_hash = p_new_key_hash,
        worker_key_prefix = p_new_key_prefix,
        updated_at = NOW()
    WHERE agent_id = p_agent_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'AGENT_NOT_FOUND');
    END IF;
    
    RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE agents IS 'AI Agent registry with identity, key hashes, and prefix indexes for O(1) lookup';
