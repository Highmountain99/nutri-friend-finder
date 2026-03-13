
-- Drop the overly permissive storage policies
DROP POLICY IF EXISTS "Dietitians can view patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Dietitians can upload patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Dietitians can delete patient documents" ON storage.objects;

-- Recreate with proper scoping

-- Dietitians can only view documents for their assigned patients
CREATE POLICY "Dietitians can view patient documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND is_assigned_dietist((storage.foldername(name))[1]::uuid)
);

-- Patients can view their own documents
CREATE POLICY "Patients can view own documents in storage"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Dietitians can upload documents for assigned patients
CREATE POLICY "Dietitians can upload patient documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'patient-documents'
  AND is_assigned_dietist((storage.foldername(name))[1]::uuid)
);

-- Dietitians can delete documents for assigned patients
CREATE POLICY "Dietitians can delete patient documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND is_assigned_dietist((storage.foldername(name))[1]::uuid)
);
