-- Migration: Campaign Lifecycle Completion
-- Date: 2026-01-28
-- Purpose: Add PROCUREMENT and COMPLETED states, minThresholdUnits field, and refund alerts table

-- 1. Add new states to campaign_state enum
ALTER TYPE campaign_state ADD VALUE IF NOT EXISTS 'PROCUREMENT';
ALTER TYPE campaign_state ADD VALUE IF NOT EXISTS 'COMPLETED';

-- 2. Add minThresholdUnits column (admin-only breakeven threshold)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS min_threshold_units integer;

COMMENT ON COLUMN campaigns.min_threshold_units IS 'Admin-only: Campaign succeeds if this threshold is met by deadline. If null, uses target_units.';

-- 3. Add processing_lock column for background job coordination
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS processing_lock timestamp;

COMMENT ON COLUMN campaigns.processing_lock IS 'Row-level lock for preventing duplicate processing by background jobs.';

-- 4. Migrate existing RELEASED campaigns to COMPLETED
UPDATE campaigns
SET state = 'COMPLETED'
WHERE state = 'RELEASED';

-- Note: Cannot remove 'RELEASED' from enum due to PostgreSQL limitation
-- Validation in code will prevent new uses

-- 5. Create refund_alerts table for tracking failed refund processing
CREATE TABLE IF NOT EXISTS refund_alerts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id varchar NOT NULL REFERENCES campaigns(id),
  commitment_id varchar NOT NULL REFERENCES commitments(id),
  error_message text NOT NULL,
  requires_manual_intervention boolean DEFAULT true,
  resolved_at timestamp,
  resolved_by text,
  created_at timestamp DEFAULT NOW() NOT NULL
);

-- 6. Create index for unresolved alerts (admin dashboard query)
CREATE INDEX IF NOT EXISTS refund_alerts_unresolved_idx
ON refund_alerts(requires_manual_intervention, created_at)
WHERE resolved_at IS NULL;

-- 7. Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'Campaigns migrated from RELEASED to COMPLETED: %', (SELECT COUNT(*) FROM campaigns WHERE state = 'COMPLETED');
  RAISE NOTICE 'New states available: PROCUREMENT, COMPLETED';
END $$;
