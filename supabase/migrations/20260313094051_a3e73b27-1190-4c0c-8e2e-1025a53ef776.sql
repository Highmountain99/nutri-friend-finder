
CREATE OR REPLACE FUNCTION public.generate_calendar_token()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT encode(extensions.gen_random_bytes(32), 'hex')
$$;
