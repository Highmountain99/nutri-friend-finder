
-- Table for admin-issued dietitian invite codes
CREATE TABLE public.dietitian_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(8), 'hex'),
  created_by uuid NOT NULL,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.dietitian_invite_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can create/view invite codes
CREATE POLICY "Admins can manage invite codes"
ON public.dietitian_invite_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
