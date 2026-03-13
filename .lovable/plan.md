

## Plan: Invite onboarding, home dietitian card, and patient milestone completion

### 1. Add concern/reason step to invite signup flow
**File:** `src/pages/Invite.tsx`

After the signup form fields, add a new step (or inline section) where the invited patient can:
- Select a primary concern from a predefined list (same categories as the qualifying flow: weight_loss, gut_health, diabetes, heart_health, etc.)
- OR write free text describing their reason
- A "Hoppa över" (skip) button to proceed without answering

Save the selected `unified_concern_category` and/or `ai_free_text` into the `intake_profiles` row that's created on signup. Currently it hardcodes `unified_concern_category: "general_health"` -- instead use the patient's selection.

### 2. Show assigned dietitian on home screen
**File:** `src/pages/Home.tsx`

Add a new section (above or below appointment) that:
- Queries `dietist_patient_assignments` joined with `dietitian_profiles` to find the patient's assigned dietitian
- Displays a card with the dietitian's avatar, name, and title (e.g., "Stella Wallander är din dietist")
- Includes a "Boka samtal" button that navigates to `/booking`

### 3. Let patients toggle their own milestones
**Database migration:** Add RLS policy on `treatment_milestones` allowing patients to UPDATE `is_completed` and `completed_at` on their own milestones (where the treatment plan's `patient_id` matches `auth.uid()`).

**File:** `src/components/progress/shared/TreatmentPlanSection.tsx`

Make the milestone circles clickable/checkable by the patient:
- Add a mutation that calls `supabase.from("treatment_milestones").update(...)` to toggle `is_completed` and set `completed_at` timestamp
- Replace the static circle/check icon with a `Checkbox` component
- Invalidate the `my-treatment-plan` query on success

### 4. Show completion timestamp in dietitian view
**File:** `src/components/dietitian/TreatmentPlanTab.tsx`

Next to each milestone, if `completed_at` is set, display it as a small timestamp label (e.g., "Klar 12 mar") so the dietitian can see when the patient marked it done.

### Technical details

**Migration SQL:**
```sql
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
```

**Files to create/modify:**
- `src/pages/Invite.tsx` -- add concern selection step
- `src/pages/Home.tsx` -- add dietitian card with "Boka samtal"
- `src/components/progress/shared/TreatmentPlanSection.tsx` -- make milestones toggleable
- `src/components/dietitian/TreatmentPlanTab.tsx` -- show completed_at timestamp
- `src/hooks/usePatientTreatmentPlan.ts` -- add toggleMilestone mutation
- Migration for RLS policy

