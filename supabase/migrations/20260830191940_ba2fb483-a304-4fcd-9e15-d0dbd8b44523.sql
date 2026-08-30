CREATE OR REPLACE FUNCTION public.get_invitation_preview(_invite_code text)
RETURNS TABLE (
  is_valid boolean,
  patient_email text,
  dietitian_first_name text,
  dietitian_last_name text,
  dietitian_title text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT true,
         i.patient_email,
         d.first_name,
         d.last_name,
         d.title
  FROM public.patient_invitations i
  LEFT JOIN public.dietitian_profiles d ON d.user_id = i.dietitian_id
  WHERE i.invite_code = _invite_code
    AND (i.patient_email IS NULL OR i.status = 'pending')
  ORDER BY i.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_preview(text) TO anon, authenticated;