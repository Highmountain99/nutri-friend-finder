-- Trigger function to keep recipes.rating and recipes.rating_count in sync
create or replace function public.update_recipe_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _recipe_id uuid;
  _avg numeric;
  _count integer;
begin
  -- Determine affected recipe_id
  if TG_OP = 'DELETE' then
    _recipe_id := OLD.recipe_id;
  else
    _recipe_id := NEW.recipe_id;
  end if;

  select avg(rating)::numeric(3,2), count(*)
  into _avg, _count
  from public.recipe_ratings
  where recipe_id = _recipe_id;

  update public.recipes
  set rating = _avg,
      rating_count = _count,
      updated_at = now()
  where id = _recipe_id;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

-- Attach trigger
create trigger trg_update_recipe_rating
after insert or update or delete on public.recipe_ratings
for each row execute function public.update_recipe_rating();