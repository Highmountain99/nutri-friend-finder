-- 1) Allow patients (and dietitians) to delete their own chat attachments
CREATE POLICY "Users can delete own chat attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2) Restrict Realtime channel subscriptions so users can only receive broadcasts
-- on topics scoped to their own auth.uid(). This blocks cross-patient leakage
-- via the websocket even if the underlying table RLS is correct.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can only receive own-topic messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Topic must contain the subscriber's auth.uid() (e.g. "chat-<uid>", "user:<uid>")
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
);
