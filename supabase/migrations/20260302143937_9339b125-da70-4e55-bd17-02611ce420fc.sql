
-- Dietister ska kunna läsa sina bokningar via dietitian_id
CREATE POLICY "Dietitians can view own bookings"
ON public.appointments FOR SELECT
USING (dietitian_id IN (
  SELECT id FROM dietitian_profiles WHERE user_id = auth.uid()
));

-- Dietister ska kunna skapa recept
CREATE POLICY "Dietitians can insert recipes"
ON public.recipes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dietitian_profiles WHERE user_id = auth.uid()
  )
);

-- Dietister ska kunna uppdatera egna recept (behöver created_by-fält)
ALTER TABLE public.recipes ADD COLUMN created_by uuid;

CREATE POLICY "Dietitians can update own recipes"
ON public.recipes FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Dietitians can delete own recipes"
ON public.recipes FOR DELETE
USING (created_by = auth.uid());

-- Config för vilka progress-metriker patienten ser
CREATE TABLE public.patient_progress_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  dietitian_id uuid NOT NULL,
  visible_metrics text[] DEFAULT '{}',
  concern_category_override text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(patient_id)
);

ALTER TABLE public.patient_progress_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can manage assigned patient config"
ON public.patient_progress_config FOR ALL
USING (is_assigned_dietist(patient_id));

CREATE POLICY "Patients can view own config"
ON public.patient_progress_config FOR SELECT
USING (auth.uid() = patient_id);
