ALTER TABLE public.client_training_days ADD COLUMN IF NOT EXISTS session_date date;

ALTER TABLE public.client_training_days DROP CONSTRAINT IF EXISTS client_training_days_patient_id_weekday_key;
DROP INDEX IF EXISTS client_training_days_patient_id_weekday_key;

CREATE UNIQUE INDEX IF NOT EXISTS client_training_days_recurring_uniq
  ON public.client_training_days (patient_id, weekday)
  WHERE session_date IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS client_training_days_date_uniq
  ON public.client_training_days (patient_id, session_date)
  WHERE session_date IS NOT NULL;