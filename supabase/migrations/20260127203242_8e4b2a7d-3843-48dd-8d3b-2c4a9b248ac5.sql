-- Fix 1: Add dietitian-patient relationships table for proper access control
CREATE TABLE IF NOT EXISTS public.dietist_patient_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietist_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(dietist_id, patient_id)
);

-- Enable RLS on the assignments table
ALTER TABLE public.dietist_patient_assignments ENABLE ROW LEVEL SECURITY;

-- Dietists can view their own assignments
CREATE POLICY "Dietists can view own assignments"
    ON public.dietist_patient_assignments FOR SELECT
    USING (dietist_id = auth.uid() OR patient_id = auth.uid());

-- Only admins can manage assignments
CREATE POLICY "Admins can manage assignments"
    ON public.dietist_patient_assignments FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Create function to check if a dietist is assigned to a patient
CREATE OR REPLACE FUNCTION public.is_assigned_dietist(_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.dietist_patient_assignments
        WHERE dietist_id = auth.uid() AND patient_id = _patient_id
    )
$$;

-- Fix 2: Update dietist policies to require patient assignment (drop and recreate)

-- Drop overly permissive dietist policies for nutrition_entries
DROP POLICY IF EXISTS "Dietists can view patient entries" ON public.nutrition_entries;

-- Create new policy that requires assignment
CREATE POLICY "Dietists can view assigned patient entries"
    ON public.nutrition_entries FOR SELECT
    USING (auth.uid() = user_id OR public.is_assigned_dietist(user_id));

-- Drop overly permissive dietist policies for daily_health_metrics
DROP POLICY IF EXISTS "Dietists can view patient health metrics" ON public.daily_health_metrics;

-- Create new policy that requires assignment
CREATE POLICY "Dietists can view assigned patient health metrics"
    ON public.daily_health_metrics FOR SELECT
    USING (auth.uid() = user_id OR public.is_assigned_dietist(user_id));

-- Drop overly permissive dietist policies for user_nutrition_goals
DROP POLICY IF EXISTS "Dietists can view patient goals" ON public.user_nutrition_goals;

-- Create new policy that requires assignment
CREATE POLICY "Dietists can view assigned patient goals"
    ON public.user_nutrition_goals FOR SELECT
    USING (auth.uid() = user_id OR public.is_assigned_dietist(user_id));

-- Also fix the update policy for goals
DROP POLICY IF EXISTS "Users can update own nutrition goals" ON public.user_nutrition_goals;

CREATE POLICY "Users and assigned dietists can update goals"
    ON public.user_nutrition_goals FOR UPDATE
    USING (auth.uid() = user_id OR public.is_assigned_dietist(user_id));

-- Fix 3: Add explicit policies for user_roles to prevent privilege escalation

-- Drop the ALL policy and replace with specific policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert roles
CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update roles
CREATE POLICY "Admins can update roles"
    ON public.user_roles FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete roles
CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));