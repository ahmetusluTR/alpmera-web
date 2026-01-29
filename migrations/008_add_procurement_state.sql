-- Migration: Add PROCUREMENT state to campaign state machine
-- Date: 2025-01-28
-- Purpose: Align implementation with documented state machine (SUCCESS → PROCUREMENT → FULFILLMENT)
-- Authority: Fixes state machine mismatch identified in code review

-- Add PROCUREMENT to the campaign_state enum
-- Note: PostgreSQL doesn't allow modifying enums directly, so we need to:
-- 1. Add the new value to the enum
-- 2. Ensure proper ordering in the state machine

-- Add PROCUREMENT to campaign_state enum (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'PROCUREMENT'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'campaign_state')
  ) THEN
    ALTER TYPE campaign_state ADD VALUE 'PROCUREMENT' AFTER 'FAILED';
  END IF;
END$$;

-- Note: No data migration needed as no campaigns should be in a transitional state during deployment
-- If there are campaigns in SUCCESS state, they will remain there until manually transitioned to PROCUREMENT
-- via the new START_PROCUREMENT admin action

-- State machine now enforces:
-- AGGREGATION → SUCCESS → PROCUREMENT → FULFILLMENT → RELEASED
--            ↓         ↓         ↓            ↓
--          FAILED    FAILED    FAILED       FAILED
