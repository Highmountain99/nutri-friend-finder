
-- Notifications table for goal change alerts
CREATE TABLE public.dietitian_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dietitian_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  notification_type text NOT NULL DEFAULT 'goal_override',
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dietitian_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can view own notifications"
  ON public.dietitian_notifications FOR SELECT
  USING (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can update own notifications"
  ON public.dietitian_notifications FOR UPDATE
  USING (dietitian_id = auth.uid());

CREATE POLICY "Users can insert notifications for assigned dietitians"
  ON public.dietitian_notifications FOR INSERT
  WITH CHECK (true);
