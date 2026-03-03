
-- Fas 1: Behandlingsplaner + schemaändringar

CREATE TABLE public.treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  dietitian_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE public.treatment_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'not_started',
  sort_order int NOT NULL DEFAULT 0,
  planned_start date,
  planned_end date,
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.treatment_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.treatment_goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.chat_messages ADD COLUMN read_at timestamptz;
ALTER TABLE public.nutrition_entries ADD COLUMN fiber numeric DEFAULT 0;

-- RLS
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dietitians can manage treatment plans for assigned patients"
  ON public.treatment_plans FOR ALL TO authenticated
  USING (is_assigned_dietist(patient_id) AND dietitian_id = auth.uid())
  WITH CHECK (is_assigned_dietist(patient_id) AND dietitian_id = auth.uid());
CREATE POLICY "Patients can view own treatment plans"
  ON public.treatment_plans FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

ALTER TABLE public.treatment_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dietitians can manage goals for assigned patients"
  ON public.treatment_goals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.treatment_plans tp WHERE tp.id = plan_id AND is_assigned_dietist(tp.patient_id) AND tp.dietitian_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.treatment_plans tp WHERE tp.id = plan_id AND is_assigned_dietist(tp.patient_id) AND tp.dietitian_id = auth.uid()));
CREATE POLICY "Patients can view own goals"
  ON public.treatment_goals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.treatment_plans tp WHERE tp.id = plan_id AND tp.patient_id = auth.uid()));

ALTER TABLE public.treatment_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dietitians can manage milestones for assigned patients"
  ON public.treatment_milestones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.treatment_goals tg JOIN public.treatment_plans tp ON tp.id = tg.plan_id WHERE tg.id = goal_id AND is_assigned_dietist(tp.patient_id) AND tp.dietitian_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.treatment_goals tg JOIN public.treatment_plans tp ON tp.id = tg.plan_id WHERE tg.id = goal_id AND is_assigned_dietist(tp.patient_id) AND tp.dietitian_id = auth.uid()));
CREATE POLICY "Patients can view own milestones"
  ON public.treatment_milestones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.treatment_goals tg JOIN public.treatment_plans tp ON tp.id = tg.plan_id WHERE tg.id = goal_id AND tp.patient_id = auth.uid()));

CREATE POLICY "Dietists can update read_at on assigned patient messages"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (is_assigned_dietist(user_id))
  WITH CHECK (is_assigned_dietist(user_id));

CREATE TRIGGER update_treatment_plans_updated_at
  BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
