-- Migration: 003_escrow_ledger_append_only
-- Description: Enforce append-only behavior on escrow_ledger at database level
-- Date: 2026-01-08
--
-- RATIONALE: The escrow_ledger is a financial audit trail that must be immutable.
-- Once a ledger entry is created (LOCK, REFUND, RELEASE), it must never be modified
-- or deleted. This ensures:
--   1. Complete auditability of all fund movements
--   2. Ability to derive accurate balances at any point in time
--   3. Compliance with financial record-keeping requirements
--   4. Protection against accidental or malicious data manipulation
--
-- This trigger prevents UPDATE and DELETE operations at the database level,
-- ensuring immutability regardless of application-layer bugs or compromises.

-- Create the trigger function that blocks modifications
CREATE OR REPLACE FUNCTION prevent_escrow_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'escrow_ledger is append-only: % operations are not permitted', TG_OP
    USING HINT = 'Escrow ledger entries cannot be modified or deleted for audit compliance';
END;
$$ LANGUAGE plpgsql;

-- Attach BEFORE UPDATE trigger
DROP TRIGGER IF EXISTS escrow_ledger_no_update ON escrow_ledger;
CREATE TRIGGER escrow_ledger_no_update
  BEFORE UPDATE ON escrow_ledger
  FOR EACH ROW
  EXECUTE FUNCTION prevent_escrow_ledger_modification();

-- Attach BEFORE DELETE trigger
DROP TRIGGER IF EXISTS escrow_ledger_no_delete ON escrow_ledger;
CREATE TRIGGER escrow_ledger_no_delete
  BEFORE DELETE ON escrow_ledger
  FOR EACH ROW
  EXECUTE FUNCTION prevent_escrow_ledger_modification();

-- Verification queries (run manually after migration):
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'escrow_ledger'::regclass;
-- Expected: escrow_ledger_no_update, escrow_ledger_no_delete
