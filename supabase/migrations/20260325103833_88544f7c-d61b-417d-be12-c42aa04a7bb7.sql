ALTER TABLE public.patient_progress_config
ADD COLUMN IF NOT EXISTS patient_conditions text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS patient_goals text[] DEFAULT '{}'::text[];