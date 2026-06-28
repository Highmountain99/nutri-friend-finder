
-- Tighten patient_progress_config policy
DROP POLICY IF EXISTS "Dietitians can manage assigned patient config" ON public.patient_progress_config;

CREATE POLICY "Dietitians can manage their own patient config"
ON public.patient_progress_config
FOR ALL
TO authenticated
USING (dietitian_id = auth.uid() AND public.is_assigned_dietist(patient_id))
WITH CHECK (dietitian_id = auth.uid() AND public.is_assigned_dietist(patient_id));

-- Tighten recipe-images storage policies to enforce owner folder
DROP POLICY IF EXISTS "Dietitians can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Dietitians can update recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Dietitians can delete recipe images" ON storage.objects;

CREATE POLICY "Dietitians can upload own recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.dietitian_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Dietitians can update own recipe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.dietitian_profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Dietitians can delete own recipe images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.dietitian_profiles WHERE user_id = auth.uid())
);
