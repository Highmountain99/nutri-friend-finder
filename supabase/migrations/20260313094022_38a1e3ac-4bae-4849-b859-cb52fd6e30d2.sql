
-- Add calendar_token column to dietitian_profiles for secure calendar feed access
ALTER TABLE public.dietitian_profiles 
ADD COLUMN IF NOT EXISTS calendar_token text UNIQUE;

-- Create a function to generate calendar tokens
CREATE OR REPLACE FUNCTION public.generate_calendar_token()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT encode(extensions.gen_random_bytes(32), 'hex')
$$;
