
CREATE TABLE public.patient_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dietitian_id uuid NOT NULL,
  invite_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  patient_email text,
  status text NOT NULL DEFAULT 'pending',
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

ALTER TABLE public.patient_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can view own invitations"
  ON public.patient_invitations FOR SELECT TO authenticated
  USING (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can insert own invitations"
  ON public.patient_invitations FOR INSERT TO authenticated
  WITH CHECK (dietitian_id = auth.uid() AND EXISTS (
    SELECT 1 FROM dietitian_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Dietitians can update own invitations"
  ON public.patient_invitations FOR UPDATE TO authenticated
  USING (dietitian_id = auth.uid());

CREATE POLICY "Anyone can read invitation by code"
  ON public.patient_invitations FOR SELECT TO anon, authenticated
  USING (status = 'pending');
