CREATE POLICY "Patients can update own milestones"
ON public.treatment_milestones
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM treatment_goals tg
    JOIN treatment_plans tp ON tp.id = tg.plan_id
    WHERE tg.id = treatment_milestones.goal_id
    AND tp.patient_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM treatment_goals tg
    JOIN treatment_plans tp ON tp.id = tg.plan_id
    WHERE tg.id = treatment_milestones.goal_id
    AND tp.patient_id = auth.uid()
  )
);