CREATE TABLE public.weekly_report_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dietitian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, week_start)
);

CREATE INDEX idx_weekly_report_comments_patient ON public.weekly_report_comments (patient_id, week_start DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_report_comments TO authenticated;
GRANT ALL ON public.weekly_report_comments TO service_role;

ALTER TABLE public.weekly_report_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage comments for their clients"
ON public.weekly_report_comments FOR ALL TO authenticated
USING (public.is_assigned_dietist(patient_id))
WITH CHECK (dietitian_id = (select auth.uid()) AND public.is_assigned_dietist(patient_id));

CREATE POLICY "Clients read published comments"
ON public.weekly_report_comments FOR SELECT TO authenticated
USING (patient_id = (select auth.uid()) AND (week_start + INTERVAL '7 days') <= now());

CREATE TRIGGER update_weekly_report_comments_updated_at
BEFORE UPDATE ON public.weekly_report_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();