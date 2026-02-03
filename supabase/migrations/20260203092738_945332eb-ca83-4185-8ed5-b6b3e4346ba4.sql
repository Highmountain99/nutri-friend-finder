-- Add new columns to intake_profiles for unified flow
ALTER TABLE intake_profiles ADD COLUMN IF NOT EXISTS 
  wants_dietist BOOLEAN DEFAULT NULL;

ALTER TABLE intake_profiles ADD COLUMN IF NOT EXISTS 
  unified_concern_category TEXT DEFAULT NULL;