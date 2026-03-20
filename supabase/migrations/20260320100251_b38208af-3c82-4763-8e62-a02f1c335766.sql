DROP TRIGGER IF EXISTS on_dietitian_message_push_notify ON public.chat_messages;
DROP FUNCTION IF EXISTS public.notify_push_on_dietitian_message();