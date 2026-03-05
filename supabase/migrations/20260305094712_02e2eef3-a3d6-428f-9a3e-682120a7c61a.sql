
DROP POLICY "Users can insert notifications for assigned dietitians" ON public.dietitian_notifications;

CREATE POLICY "Users can insert notifications for their dietitian"
  ON public.dietitian_notifications FOR INSERT
  WITH CHECK (patient_id = auth.uid());
