
-- Allow dietitians to delete draft AI messages for assigned patients
CREATE POLICY "Dietists can delete draft messages for assigned patients"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (
  is_assigned_dietist(user_id)
  AND sender = 'ai'
  AND status = 'draft'
);
