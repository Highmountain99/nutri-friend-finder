-- Securely accept an invite as the logged-in patient, create assignment,
-- and seed intake profile without marking qualifying as completed.
create or replace function public.accept_invitation_and_assign(
  _invite_code text,
  _primary_concern text default null,
  _free_text text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _invite public.patient_invitations%rowtype;
  _uid uuid := auth.uid();
  _jwt_email text := lower(coalesce(auth.jwt()->>'email', ''));
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into _invite
  from public.patient_invitations
  where invite_code = _invite_code
    and status = 'pending'
  order by created_at desc
  limit 1
  for update;

  if not found then
    return false;
  end if;

  -- If invite is email-specific, enforce email match from JWT claim
  if _invite.patient_email is not null
     and lower(_invite.patient_email) <> _jwt_email then
    return false;
  end if;

  -- Link patient <-> dietitian
  insert into public.dietist_patient_assignments (dietist_id, patient_id)
  select _invite.dietitian_id, _uid
  where not exists (
    select 1
    from public.dietist_patient_assignments d
    where d.dietist_id = _invite.dietitian_id
      and d.patient_id = _uid
  );

  -- Mark invitation as accepted (idempotent for pending rows)
  update public.patient_invitations
  set status = 'accepted',
      accepted_by = _uid,
      accepted_at = now()
  where id = _invite.id
    and status = 'pending';

  -- Seed intake profile for invite flow but keep qualifying open
  insert into public.intake_profiles (
    user_id,
    care_seeker_type,
    wants_dietist,
    unified_concern_category,
    ai_free_text,
    current_step
  )
  values (
    _uid,
    'self',
    true,
    coalesce(nullif(_primary_concern, ''), 'general_health'),
    nullif(btrim(_free_text), ''),
    2
  )
  on conflict (user_id) do update
  set care_seeker_type = coalesce(public.intake_profiles.care_seeker_type, excluded.care_seeker_type),
      wants_dietist = coalesce(public.intake_profiles.wants_dietist, excluded.wants_dietist),
      unified_concern_category = coalesce(excluded.unified_concern_category, public.intake_profiles.unified_concern_category),
      ai_free_text = coalesce(excluded.ai_free_text, public.intake_profiles.ai_free_text),
      current_step = case
        when public.intake_profiles.completed_at is null
          then greatest(coalesce(public.intake_profiles.current_step, 0), excluded.current_step)
        else public.intake_profiles.current_step
      end,
      updated_at = now();

  return true;
end;
$$;

revoke all on function public.accept_invitation_and_assign(text, text, text) from public;
grant execute on function public.accept_invitation_and_assign(text, text, text) to authenticated;