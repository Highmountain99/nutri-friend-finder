CREATE TABLE public.client_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dietitian_id uuid NOT NULL,
  name text NOT NULL,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_groups TO authenticated;
GRANT ALL ON public.client_groups TO service_role;

ALTER TABLE public.client_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage their own groups"
ON public.client_groups FOR ALL TO authenticated
USING (dietitian_id = (select auth.uid()))
WITH CHECK (dietitian_id = (select auth.uid()));

CREATE TRIGGER update_client_groups_updated_at
BEFORE UPDATE ON public.client_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.client_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.client_groups(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, patient_id)
);

CREATE INDEX idx_client_group_members_group ON public.client_group_members(group_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_group_members TO authenticated;
GRANT ALL ON public.client_group_members TO service_role;

ALTER TABLE public.client_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage members of their own groups"
ON public.client_group_members FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.client_groups g
  WHERE g.id = client_group_members.group_id
    AND g.dietitian_id = (select auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.client_groups g
  WHERE g.id = client_group_members.group_id
    AND g.dietitian_id = (select auth.uid())
));