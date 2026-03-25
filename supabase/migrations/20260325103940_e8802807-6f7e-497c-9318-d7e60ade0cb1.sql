CREATE POLICY "Dietists can view assigned patient nutrition settings"
ON public.user_nutrition_settings
FOR SELECT
TO authenticated
USING (is_assigned_dietist(user_id));