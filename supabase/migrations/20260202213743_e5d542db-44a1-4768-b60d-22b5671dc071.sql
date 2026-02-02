-- Add triage columns to intake_profiles for dietist vs coach routing

-- Pregnancy status enum-like column
ALTER TABLE public.intake_profiles ADD COLUMN IF NOT EXISTS 
  pregnancy_status TEXT DEFAULT NULL;

-- Pregnancy triage reason
ALTER TABLE public.intake_profiles ADD COLUMN IF NOT EXISTS 
  pregnancy_triage_reason TEXT DEFAULT NULL;

-- Whether care provider referred user
ALTER TABLE public.intake_profiles ADD COLUMN IF NOT EXISTS 
  pregnancy_referred_by_care BOOLEAN DEFAULT NULL;

-- Red flag symptoms array
ALTER TABLE public.intake_profiles ADD COLUMN IF NOT EXISTS 
  red_flag_symptoms TEXT[] DEFAULT '{}';

-- Triage result: 'dietist', 'coach', or 'pending'
ALTER TABLE public.intake_profiles ADD COLUMN IF NOT EXISTS 
  triage_result TEXT DEFAULT 'pending';

-- Reason code for the triage decision
ALTER TABLE public.intake_profiles ADD COLUMN IF NOT EXISTS 
  triage_reason_code TEXT DEFAULT NULL;

-- Provider category: 'medical' or 'wellness'
ALTER TABLE public.intake_profiles ADD COLUMN IF NOT EXISTS 
  provider_category TEXT DEFAULT NULL;

-- Coach-specific concern category (different from dietist categories)
ALTER TABLE public.intake_profiles ADD COLUMN IF NOT EXISTS 
  coach_concern_category TEXT DEFAULT NULL;

-- Coach-specific subcategory
ALTER TABLE public.intake_profiles ADD COLUMN IF NOT EXISTS 
  coach_concern_subcategory TEXT DEFAULT NULL;

-- User preference tags (multi-select from TagsStep)
ALTER TABLE public.intake_profiles ADD COLUMN IF NOT EXISTS 
  preference_tags TEXT[] DEFAULT '{}';