CREATE POLICY "Patients can view templates assigned to them"
ON public.block_templates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patient_blocks pb
    WHERE pb.block_template_id = block_templates.id
      AND pb.patient_id = auth.uid()
      AND pb.is_active = true
  )
);