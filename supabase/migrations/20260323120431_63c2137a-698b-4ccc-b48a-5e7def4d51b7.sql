REVOKE SELECT (calendar_token) ON public.dietitian_profiles FROM anon, authenticated;
GRANT SELECT (calendar_token) ON public.dietitian_profiles TO authenticated;