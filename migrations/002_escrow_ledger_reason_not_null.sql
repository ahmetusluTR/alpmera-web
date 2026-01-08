-- Migration: 002_escrow_ledger_reason_not_null
-- Description: Make reason NOT NULL for Phase 1 auditability, add index for balance queries
-- Date: 2026-01-08
--
-- Every escrow ledger entry must have both actor and reason for full auditability.

-- Step 1: Backfill any NULL values (safety measure)
UPDATE escrow_ledger SET reason = 'legacy_migration' WHERE reason IS NULL;
UPDATE escrow_ledger SET actor = 'system_migration' WHERE actor IS NULL;

-- Step 2: Alter reason to NOT NULL
ALTER TABLE escrow_ledger ALTER COLUMN reason SET NOT NULL;

-- Step 3: entry_type is already a PostgreSQL ENUM (escrow_entry_type) with values
-- ('LOCK', 'REFUND', 'RELEASE'), so no CHECK constraint needed.
-- Verify with: SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'escrow_entry_type';

-- Step 4: Add index to support derived balance queries
-- This improves performance of: SELECT SUM(...) FROM escrow_ledger WHERE campaign_id = ? ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_escrow_ledger_campaign_created 
ON escrow_ledger(campaign_id, created_at);

-- Also add index for commitment-based lookups
CREATE INDEX IF NOT EXISTS idx_escrow_ledger_commitment_created 
ON escrow_ledger(commitment_id, created_at);

-- Verification: After running, confirm no NULLs exist
-- SELECT COUNT(*) FROM escrow_ledger WHERE reason IS NULL OR actor IS NULL;
-- Expected: 0
