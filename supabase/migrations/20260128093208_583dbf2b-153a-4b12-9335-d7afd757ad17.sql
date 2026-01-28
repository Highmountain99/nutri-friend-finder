-- Add meal_type column to nutrition_entries table
ALTER TABLE public.nutrition_entries ADD COLUMN IF NOT EXISTS meal_type text;