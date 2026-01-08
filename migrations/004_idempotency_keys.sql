-- Migration: 004_idempotency_keys
-- Description: Add idempotency protection for money-affecting operations
-- Date: 2026-01-08
--
-- RATIONALE: Financial operations (commitment LOCK, refund, release) must be idempotent
-- to prevent duplicate ledger entries from retried or double-submitted requests.
-- This table stores processed idempotency keys with their responses, allowing:
--   1. Safe retry of failed network requests
--   2. Protection against double-submission
--   3. Audit trail of all operation attempts
--   4. Cached response return on duplicate requests
--
-- Keys are scoped (key + scope unique) so clients can reuse the same key format
-- across different operation types without collision.
-- Keys are retained indefinitely for auditability (no TTL expiration).

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  scope TEXT NOT NULL,
  request_hash TEXT,
  response JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  
  -- Uniqueness enforced on (key, scope) to allow key reuse across different operations
  CONSTRAINT idempotency_keys_key_scope_unique UNIQUE (key, scope)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key_scope 
ON idempotency_keys(key, scope);

-- Index for cleanup queries if needed in future
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at 
ON idempotency_keys(created_at);

-- Verification:
-- SELECT COUNT(*) FROM idempotency_keys;
-- Expected: 0 (empty table)
