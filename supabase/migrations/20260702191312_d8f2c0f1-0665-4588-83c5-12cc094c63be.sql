DROP POLICY IF EXISTS "Anyone can view dietitian profiles" ON public.dietitian_profiles;
CREATE POLICY "Authenticated users can view dietitian profiles"
  ON public.dietitian_profiles
  FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.dietitian_profiles FROM anon;

DROP POLICY IF EXISTS "Prevent non-admin role insertion" ON public.user_roles;
CREATE POLICY "Prevent non-admin role insertion"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO public
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;