
-- Speed up dietitian patient page loads by replacing per-row RLS function calls
-- with initPlan-wrapped auth.uid() and an EXISTS lookup, and add a missing index.

-- nutrition_entries ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own nutrition entries" ON public.nutrition_entries;
DROP POLICY IF EXISTS "Dietists can view assigned patient entries" ON public.nutrition_entries;

CREATE POLICY "Read own or assigned patient nutrition entries"
ON public.nutrition_entries
FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.dietist_patient_assignments d
    WHERE d.dietist_id = (SELECT auth.uid())
      AND d.patient_id = nutrition_entries.user_id
  )
);

-- symptom_entries -----------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own symptoms" ON public.symptom_entries;
DROP POLICY IF EXISTS "Dietists can view assigned patient symptoms" ON public.symptom_entries;

CREATE POLICY "Read own or assigned patient symptoms"
ON public.symptom_entries
FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.dietist_patient_assignments d
    WHERE d.dietist_id = (SELECT auth.uid())
      AND d.patient_id = symptom_entries.user_id
  )
);

CREATE INDEX IF NOT EXISTS idx_symptom_entries_user_date
  ON public.symptom_entries (user_id, entry_date DESC);

-- health_tracking_entries ---------------------------------------------------
DROP POLICY IF EXISTS "Users can view own health entries" ON public.health_tracking_entries;
DROP POLICY IF EXISTS "Dietists can view assigned patient health entries" ON public.health_tracking_entries;

CREATE POLICY "Read own or assigned patient health entries"
ON public.health_tracking_entries
FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.dietist_patient_assignments d
    WHERE d.dietist_id = (SELECT auth.uid())
      AND d.patient_id = health_tracking_entries.user_id
  )
);

CREATE INDEX IF NOT EXISTS idx_health_tracking_user_date
  ON public.health_tracking_entries (user_id, entry_date DESC);

-- Ensure dietist assignments lookup is fast in both directions
CREATE INDEX IF NOT EXISTS idx_dietist_patient_assignments_dietist_patient
  ON public.dietist_patient_assignments (dietist_id, patient_id);
