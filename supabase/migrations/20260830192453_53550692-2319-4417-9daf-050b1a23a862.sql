CREATE OR REPLACE FUNCTION public.accept_invitation_and_assign(_invite_code text, _primary_concern text DEFAULT NULL::text, _free_text text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    and (patient_email is null or status = 'pending')
  order by created_at desc
  limit 1
  for update;

  if not found then
    return false;
  end if;

  if _invite.patient_email is not null
     and lower(_invite.patient_email) <> _jwt_email then
    return false;
  end if;

  insert into public.dietist_patient_assignments (dietist_id, patient_id)
  select _invite.dietitian_id, _uid
  where not exists (
    select 1
    from public.dietist_patient_assignments d
    where d.dietist_id = _invite.dietitian_id
      and d.patient_id = _uid
  );

  if _invite.patient_email is not null then
    update public.patient_invitations
    set status = 'accepted',
        accepted_by = _uid,
        accepted_at = now()
    where id = _invite.id
      and status = 'pending';
  end if;

  insert into public.intake_profiles (
    user_id,
    care_seeker_type,
    wants_dietist,
    unified_concern_category,
    ai_free_text,
    current_step,
    completed_at
  )
  values (
    _uid,
    'self',
    true,
    coalesce(nullif(_primary_concern, ''), 'general_health'),
    nullif(btrim(_free_text), ''),
    99,
    now()
  )
  on conflict (user_id) do update
  set care_seeker_type = coalesce(public.intake_profiles.care_seeker_type, excluded.care_seeker_type),
      wants_dietist = true,
      unified_concern_category = coalesce(public.intake_profiles.unified_concern_category, excluded.unified_concern_category),
      ai_free_text = coalesce(public.intake_profiles.ai_free_text, excluded.ai_free_text),
      current_step = greatest(coalesce(public.intake_profiles.current_step, 0), excluded.current_step),
      completed_at = coalesce(public.intake_profiles.completed_at, now()),
      updated_at = now();

  return true;
end;
$function$;