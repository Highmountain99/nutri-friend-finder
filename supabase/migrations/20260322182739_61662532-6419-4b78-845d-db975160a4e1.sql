ALTER TABLE public.dietitian_journal_entries 
ADD COLUMN IF NOT EXISTS form_data jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS area_type text DEFAULT NULL;