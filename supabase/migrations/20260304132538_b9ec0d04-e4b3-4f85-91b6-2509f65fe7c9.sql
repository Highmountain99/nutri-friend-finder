
ALTER TABLE public.chat_messages 
ADD COLUMN status text NOT NULL DEFAULT 'sent';

-- Update existing AI messages to 'sent' (they were already delivered)
-- Future AI messages will be saved as 'draft' by the edge function

COMMENT ON COLUMN public.chat_messages.status IS 'sent = visible to patient, draft = awaiting dietitian approval';
