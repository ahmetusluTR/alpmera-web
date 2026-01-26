-- Migration: 005_consolidation_point_contacts
-- Description: Add contact fields to consolidation_points table
-- Date: 2026-01-15
--
-- RATIONALE: Consolidation points need contact information for logistics coordination.
-- These fields match the pattern already used in the suppliers table.

ALTER TABLE consolidation_points
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Verification:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'consolidation_points' AND column_name LIKE 'contact%';
-- Expected: contact_name, contact_email, contact_phone
