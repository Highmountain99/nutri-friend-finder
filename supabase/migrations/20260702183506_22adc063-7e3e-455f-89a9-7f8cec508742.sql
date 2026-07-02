ALTER TABLE public.treatment_plans
  ADD COLUMN IF NOT EXISTS end_goal text,
  ADD COLUMN IF NOT EXISTS end_goal_target_date date;