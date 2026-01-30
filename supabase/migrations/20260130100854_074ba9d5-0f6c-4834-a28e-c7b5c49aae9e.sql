-- Allow assigned dietitians to update appointment status and notes
CREATE POLICY "Dietitians can update assigned patient appointments"
  ON public.appointments FOR UPDATE
  USING (public.is_assigned_dietist(user_id))
  WITH CHECK (public.is_assigned_dietist(user_id));