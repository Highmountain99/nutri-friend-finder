
-- 1. Fix patient_invitations: Replace overly permissive public SELECT policy
-- Drop the current policy that exposes all pending invitations
DROP POLICY IF EXISTS "Anyone can read invitation by code" ON public.patient_invitations;

-- Create a restrictive policy: only allow lookup by specific invite_code (used via RPC)
-- Since the app uses accept_invitation_and_assign (SECURITY DEFINER), 
-- we don't need public SELECT at all. Only dietitians need to see their own.
-- For the invite page, the RPC function runs as SECURITY DEFINER and bypasses RLS.

-- 2. Fix user_roles: Add restrictive policy preventing self-role-assignment
-- The existing admin INSERT policy is correct, but add explicit deny for non-admins
CREATE POLICY "Prevent non-admin role insertion"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Fix dietitian_notifications: Scope INSERT to assigned dietitian only
DROP POLICY IF EXISTS "Users can insert notifications for their dietitian" ON public.dietitian_notifications;

CREATE POLICY "Users can insert notifications for their assigned dietitian"
ON public.dietitian_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  patient_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.dietist_patient_assignments
    WHERE patient_id = auth.uid()
      AND dietist_id = dietitian_notifications.dietitian_id
  )
);
