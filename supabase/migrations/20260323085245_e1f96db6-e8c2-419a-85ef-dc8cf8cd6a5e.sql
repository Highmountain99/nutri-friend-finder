
-- Block templates table
CREATE TABLE public.block_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dietitian_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'Square',
  block_type text NOT NULL DEFAULT 'action',
  category text NOT NULL DEFAULT 'general',
  data_source text NOT NULL DEFAULT 'none',
  data_config jsonb DEFAULT '{}'::jsonb,
  display_config jsonb DEFAULT '{}'::jsonb,
  is_shared boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.block_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can view own and shared blocks"
  ON public.block_templates FOR SELECT TO authenticated
  USING (dietitian_id = auth.uid() OR is_shared = true);

CREATE POLICY "Dietitians can insert own blocks"
  ON public.block_templates FOR INSERT TO authenticated
  WITH CHECK (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can update own blocks"
  ON public.block_templates FOR UPDATE TO authenticated
  USING (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can delete own blocks"
  ON public.block_templates FOR DELETE TO authenticated
  USING (dietitian_id = auth.uid());

-- Patient blocks table
CREATE TABLE public.patient_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  block_template_id uuid NOT NULL REFERENCES public.block_templates(id) ON DELETE CASCADE,
  dietitian_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  override_title text,
  manual_content text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can manage patient blocks for assigned patients"
  ON public.patient_blocks FOR ALL TO authenticated
  USING (is_assigned_dietist(patient_id) AND dietitian_id = auth.uid())
  WITH CHECK (is_assigned_dietist(patient_id) AND dietitian_id = auth.uid());

CREATE POLICY "Patients can view own active blocks"
  ON public.patient_blocks FOR SELECT TO authenticated
  USING (patient_id = auth.uid() AND is_active = true);
