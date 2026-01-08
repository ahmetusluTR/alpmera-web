-- Migration: 001_escrow_ledger_derived_balances
-- Description: Remove stored balances (now derived), add actor and reason columns
-- Date: 2026-01-08
-- 
-- Alpmera uses an append-only ledger where balances are DERIVED from summing
-- entries, not stored. This migration removes the redundant balance columns
-- and adds actor/reason for better auditability.

-- Step 1: Add new columns with defaults for existing data
ALTER TABLE escrow_ledger ADD COLUMN IF NOT EXISTS actor TEXT;
ALTER TABLE escrow_ledger ADD COLUMN IF NOT EXISTS reason TEXT;

-- Step 2: Backfill existing rows with reasonable defaults
UPDATE escrow_ledger 
SET actor = 'system_migration', reason = 'Pre-migration entry'
WHERE actor IS NULL;

-- Step 3: Make actor NOT NULL after backfill
ALTER TABLE escrow_ledger ALTER COLUMN actor SET NOT NULL;

-- Step 4: Drop the redundant balance columns
ALTER TABLE escrow_ledger DROP COLUMN IF EXISTS balance_before;
ALTER TABLE escrow_ledger DROP COLUMN IF EXISTS balance_after;

-- Verification: The escrow_ledger table should now have:
-- id, commitment_id, campaign_id, entry_type, amount, actor, reason, created_at
