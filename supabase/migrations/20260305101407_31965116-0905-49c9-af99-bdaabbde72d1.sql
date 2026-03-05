
-- Add attachments column to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Create chat-attachments storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false) ON CONFLICT DO NOTHING;

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload own chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view attachments in conversations they're part of
CREATE POLICY "Users can view own chat attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Dietitians can view patient attachments
CREATE POLICY "Dietitians can view patient chat attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments' AND is_assigned_dietist((storage.foldername(name))[1]::uuid));

-- Dietitians can upload to patient folders
CREATE POLICY "Dietitians can upload patient chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND is_assigned_dietist((storage.foldername(name))[1]::uuid));
