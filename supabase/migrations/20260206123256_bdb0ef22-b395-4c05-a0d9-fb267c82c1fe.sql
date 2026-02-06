-- Create chat_messages table for storing conversation history
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    conversation_type TEXT NOT NULL DEFAULT 'ai' CHECK (conversation_type IN ('ai', 'dietitian')),
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai', 'dietitian')),
    content TEXT NOT NULL,
    escalated BOOLEAN DEFAULT false,
    escalation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view own messages"
ON public.chat_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own messages (only as 'user' sender)
CREATE POLICY "Users can insert own messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id AND sender = 'user');

-- Dietists can view assigned patient messages
CREATE POLICY "Dietists can view assigned patient messages"
ON public.chat_messages
FOR SELECT
USING (is_assigned_dietist(user_id));

-- Dietists can insert messages to assigned patients (as 'dietitian' sender)
CREATE POLICY "Dietists can insert messages to assigned patients"
ON public.chat_messages
FOR INSERT
WITH CHECK (is_assigned_dietist(user_id) AND sender = 'dietitian');

-- Service role can insert AI messages (for edge function)
-- Note: The edge function uses service role which bypasses RLS

-- Create index for faster queries
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;