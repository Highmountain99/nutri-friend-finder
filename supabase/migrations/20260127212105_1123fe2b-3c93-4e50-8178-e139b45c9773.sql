-- Create enum types for intake profile
CREATE TYPE public.care_seeker_type AS ENUM ('self', 'other');
CREATE TYPE public.relationship_type AS ENUM ('guardian', 'trustee', 'relative');
CREATE TYPE public.primary_concern_category AS ENUM (
  'weight_loss',
  'diabetes',
  'gut_health',
  'general_health',
  'womens_health',
  'emotional_eating',
  'eating_disorder',
  'heart_health',
  'other'
);
CREATE TYPE public.motivation_level AS ENUM ('excited', 'curious', 'hesitant', 'not_ready');

-- Create intake_profiles table
CREATE TABLE public.intake_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  care_seeker_type public.care_seeker_type,
  relationship_if_other public.relationship_type,
  primary_concern_category public.primary_concern_category,
  primary_concern_subcategory TEXT,
  concern_tags TEXT[] DEFAULT '{}',
  activity_level public.activity_level,
  motivation_level public.motivation_level,
  support_areas TEXT[] DEFAULT '{}',
  ai_free_text TEXT,
  ai_parsed_fields JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.intake_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own intake profile"
ON public.intake_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intake profile"
ON public.intake_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intake profile"
ON public.intake_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Dietists can view assigned patient profiles
CREATE POLICY "Dietists can view assigned patient intake profiles"
ON public.intake_profiles
FOR SELECT
USING (is_assigned_dietist(user_id));

-- Trigger for updated_at
CREATE TRIGGER update_intake_profiles_updated_at
BEFORE UPDATE ON public.intake_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();