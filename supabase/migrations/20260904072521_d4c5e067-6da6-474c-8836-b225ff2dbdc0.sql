CREATE POLICY "meal_photos_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'meal-photos' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_assigned_dietist(((storage.foldername(name))[1])::uuid)
  )
);

CREATE POLICY "meal_photos_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "meal_photos_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "meal_photos_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);