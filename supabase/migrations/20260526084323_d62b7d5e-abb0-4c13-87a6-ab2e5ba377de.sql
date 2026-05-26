
-- 1. Move dietitian calendar tokens out of the publicly-readable dietitian_profiles table
CREATE TABLE IF NOT EXISTS public.dietitian_calendar_tokens (
  dietitian_user_id uuid PRIMARY KEY,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dietitian_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Only the owning dietitian can read/manage their own token; nobody else.
CREATE POLICY "Dietitians can view own calendar token"
  ON public.dietitian_calendar_tokens FOR SELECT
  TO authenticated
  USING (dietitian_user_id = auth.uid());

-- Backfill from existing column
INSERT INTO public.dietitian_calendar_tokens (dietitian_user_id, token)
SELECT user_id, calendar_token
FROM public.dietitian_profiles
WHERE calendar_token IS NOT NULL
ON CONFLICT (dietitian_user_id) DO NOTHING;

-- Drop the leaky column
ALTER TABLE public.dietitian_profiles DROP COLUMN IF EXISTS calendar_token;

-- 2. Helper RPCs for dietitians to get / rotate their own token securely
CREATE OR REPLACE FUNCTION public.get_or_create_my_calendar_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _token text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Must be an actual dietitian
  IF NOT EXISTS (SELECT 1 FROM public.dietitian_profiles WHERE user_id = _uid) THEN
    RAISE EXCEPTION 'Not a dietitian';
  END IF;

  INSERT INTO public.dietitian_calendar_tokens (dietitian_user_id)
  VALUES (_uid)
  ON CONFLICT (dietitian_user_id) DO NOTHING;

  SELECT token INTO _token
  FROM public.dietitian_calendar_tokens
  WHERE dietitian_user_id = _uid;

  RETURN _token;
END;
$$;

CREATE OR REPLACE FUNCTION public.rotate_my_calendar_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _token text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.dietitian_profiles WHERE user_id = _uid) THEN
    RAISE EXCEPTION 'Not a dietitian';
  END IF;

  INSERT INTO public.dietitian_calendar_tokens (dietitian_user_id, token, updated_at)
  VALUES (_uid, encode(extensions.gen_random_bytes(32), 'hex'), now())
  ON CONFLICT (dietitian_user_id) DO UPDATE
    SET token = excluded.token,
        updated_at = now();

  SELECT token INTO _token
  FROM public.dietitian_calendar_tokens
  WHERE dietitian_user_id = _uid;

  RETURN _token;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_my_calendar_token() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rotate_my_calendar_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_my_calendar_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_my_calendar_token() TO authenticated;

-- 3. Drop the old generator (no longer used by clients)
DROP FUNCTION IF EXISTS public.generate_calendar_token();

-- 4. Lock down SECURITY DEFINER helpers that should NEVER be called directly
--    via the REST/RPC surface (they exist only to back triggers or RLS).
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_recipe_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_assign_patient_on_booking() FROM PUBLIC, anon, authenticated;

-- has_role and is_assigned_dietist are referenced from RLS; PostgREST exposes
-- them as RPCs which is unnecessary. Revoke from anon, keep authenticated
-- since calling them yourself just returns a boolean about your own session.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_assigned_dietist(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_assigned_dietist(uuid) TO authenticated;

-- accept_invitation_and_assign + mark_chat_message_read + mark_all_chat_messages_read
-- need to be callable by signed-in users. Restrict from anon.
REVOKE ALL ON FUNCTION public.accept_invitation_and_assign(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_invitation_and_assign(text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.mark_chat_message_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_chat_message_read(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.mark_all_chat_messages_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_all_chat_messages_read() TO authenticated;

-- 5. Public bucket listing — drop broad SELECT policies. Files in public buckets
--    remain accessible via their public CDN URL; only directory listing is closed.
DROP POLICY IF EXISTS "Anyone can view recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
