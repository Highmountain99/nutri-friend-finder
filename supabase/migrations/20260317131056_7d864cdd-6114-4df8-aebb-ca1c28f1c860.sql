-- Mark all incoming sent chat messages as read for the authenticated patient
create or replace function public.mark_all_chat_messages_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _updated_count integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.chat_messages
  set read_at = coalesce(read_at, now())
  where user_id = auth.uid()
    and sender <> 'user'
    and status = 'sent'
    and read_at is null;

  get diagnostics _updated_count = row_count;
  return _updated_count;
end;
$$;