
-- Add new columns to recipes table
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS prep_time_minutes integer;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS fiber_per_serving numeric;

-- Create recipe-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can view recipe images
CREATE POLICY "Anyone can view recipe images" ON storage.objects FOR SELECT USING (bucket_id = 'recipe-images');

-- Storage RLS: dietitians can upload recipe images
CREATE POLICY "Dietitians can upload recipe images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'recipe-images' AND
  EXISTS (SELECT 1 FROM public.dietitian_profiles WHERE user_id = auth.uid())
);

-- Storage RLS: dietitians can update own recipe images
CREATE POLICY "Dietitians can update recipe images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'recipe-images' AND
  EXISTS (SELECT 1 FROM public.dietitian_profiles WHERE user_id = auth.uid())
);

-- Storage RLS: dietitians can delete own recipe images
CREATE POLICY "Dietitians can delete recipe images" ON storage.objects FOR DELETE USING (
  bucket_id = 'recipe-images' AND
  EXISTS (SELECT 1 FROM public.dietitian_profiles WHERE user_id = auth.uid())
);

-- Create recipe_suggestions table
CREATE TABLE public.recipe_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  dietitian_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'suggested',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recipe_suggestions ENABLE ROW LEVEL SECURITY;

-- Dietitians can manage suggestions for their assigned patients
CREATE POLICY "Dietitians can insert suggestions for assigned patients"
ON public.recipe_suggestions FOR INSERT
TO authenticated
WITH CHECK (
  dietitian_id = auth.uid() AND
  public.is_assigned_dietist(patient_id)
);

CREATE POLICY "Dietitians can view suggestions for assigned patients"
ON public.recipe_suggestions FOR SELECT
TO authenticated
USING (
  dietitian_id = auth.uid() OR patient_id = auth.uid()
);

CREATE POLICY "Dietitians can update suggestions for assigned patients"
ON public.recipe_suggestions FOR UPDATE
TO authenticated
USING (
  dietitian_id = auth.uid() AND public.is_assigned_dietist(patient_id)
);

CREATE POLICY "Dietitians can delete suggestions for assigned patients"
ON public.recipe_suggestions FOR DELETE
TO authenticated
USING (
  dietitian_id = auth.uid() AND public.is_assigned_dietist(patient_id)
);

-- Patients can update status of their own suggestions
CREATE POLICY "Patients can update own suggestion status"
ON public.recipe_suggestions FOR UPDATE
TO authenticated
USING (patient_id = auth.uid())
WITH CHECK (patient_id = auth.uid());
