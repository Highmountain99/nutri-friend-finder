CREATE TABLE public.client_training_days (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  dietitian_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, weekday)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_training_days TO authenticated;
GRANT ALL ON public.client_training_days TO service_role;

ALTER TABLE public.client_training_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own training days"
ON public.client_training_days FOR SELECT TO authenticated
USING (patient_id = auth.uid());

CREATE POLICY "Coaches can view assigned clients training days"
ON public.client_training_days FOR SELECT TO authenticated
USING (public.is_assigned_dietist(patient_id));

CREATE POLICY "Coaches can insert training days"
ON public.client_training_days FOR INSERT TO authenticated
WITH CHECK (dietitian_id = auth.uid() AND public.is_assigned_dietist(patient_id));

CREATE POLICY "Coaches can update training days"
ON public.client_training_days FOR UPDATE TO authenticated
USING (public.is_assigned_dietist(patient_id))
WITH CHECK (public.is_assigned_dietist(patient_id));

CREATE POLICY "Coaches can delete training days"
ON public.client_training_days FOR DELETE TO authenticated
USING (public.is_assigned_dietist(patient_id));

CREATE TRIGGER update_client_training_days_updated_at
BEFORE UPDATE ON public.client_training_days
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();