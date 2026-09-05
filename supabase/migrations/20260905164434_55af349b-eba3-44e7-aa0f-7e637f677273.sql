ALTER TABLE public.nutrition_entries
ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT NULL;