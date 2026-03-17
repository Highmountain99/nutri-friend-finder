-- Allow patients to mark incoming chat messages as read without granting broad UPDATE access
create or replace function public.mark_chat_message_read(_message_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _updated_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.chat_messages
  set read_at = coalesce(read_at, now())
  where id = _message_id
    and user_id = auth.uid()
    and sender <> 'user'
    and status = 'sent'
  returning id into _updated_id;

  return _updated_id is not null;
end;
$$;