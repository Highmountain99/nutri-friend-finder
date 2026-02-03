-- Drop the existing overly permissive SELECT policy on recipe_ratings
DROP POLICY IF EXISTS "Anyone can view recipe ratings" ON public.recipe_ratings;

-- Create a new policy that only allows users to view their own ratings
-- (Aggregate rating data is already stored on the recipes table itself)
CREATE POLICY "Users can view own ratings"
ON public.recipe_ratings
FOR SELECT
USING (auth.uid() = user_id);