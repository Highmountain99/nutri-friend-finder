
ALTER TABLE public.user_recipe_interactions
  ADD CONSTRAINT user_recipe_interactions_user_recipe_unique UNIQUE (user_id, recipe_id);
