-- Function to notify edge function on new dietitian chat messages
CREATE OR REPLACE FUNCTION public.notify_push_on_dietitian_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only for dietitian messages
  IF NEW.sender <> 'dietitian' THEN
    RETURN NEW;
  END IF;

  -- Use pg_net to call edge function asynchronously
  PERFORM net.http_post(
    url := 'https://tqqszajpfnqhyrictani.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'chat_messages',
      'record', jsonb_build_object(
        'user_id', NEW.user_id,
        'sender', NEW.sender,
        'content', left(NEW.content, 100)
      )
    )
  );

  RETURN NEW;
END;
$function$;

-- Create trigger
CREATE TRIGGER on_dietitian_message_push_notify
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  WHEN (NEW.sender = 'dietitian')
  EXECUTE FUNCTION public.notify_push_on_dietitian_message();