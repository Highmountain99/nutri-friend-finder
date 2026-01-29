-- Add visibility columns for each nutrient
ALTER TABLE public.user_nutrition_settings
ADD COLUMN show_calories BOOLEAN DEFAULT true,
ADD COLUMN show_protein BOOLEAN DEFAULT true,
ADD COLUMN show_carbs BOOLEAN DEFAULT true,
ADD COLUMN show_fat BOOLEAN DEFAULT true;