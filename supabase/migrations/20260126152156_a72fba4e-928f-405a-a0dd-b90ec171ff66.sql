-- Create enum for activity levels
CREATE TYPE public.activity_level AS ENUM (
  'sedentary',
  'lightly_active',
  'moderately_active',
  'active',
  'very_active'
);

-- Create enum for gender
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');

-- User nutrition settings (AI tracking preferences and body metrics)
CREATE TABLE public.user_nutrition_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_tracking_enabled BOOLEAN DEFAULT false,
  ai_tracking_onboarding_completed BOOLEAN DEFAULT false,
  calorie_tracking_enabled BOOLEAN DEFAULT true,
  gender public.gender,
  height_cm NUMERIC(5,1),
  weight_kg NUMERIC(5,1),
  activity_level public.activity_level,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- User nutrition goals (can be set by user or dietist)
CREATE TABLE public.user_nutrition_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calories_goal INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 50,
  carbs_goal INTEGER DEFAULT 250,
  fat_goal INTEGER DEFAULT 65,
  set_by_dietist BOOLEAN DEFAULT false,
  dietist_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Daily nutrition entries
CREATE TABLE public.nutrition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_name TEXT,
  calories INTEGER DEFAULT 0,
  protein NUMERIC(6,1) DEFAULT 0,
  carbs NUMERIC(6,1) DEFAULT 0,
  fat NUMERIC(6,1) DEFAULT 0,
  is_ai_estimated BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Apple Health integration settings
CREATE TABLE public.apple_health_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Daily health metrics (from Apple Health)
CREATE TABLE public.daily_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0,
  active_energy_kcal NUMERIC(7,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, metric_date)
);

-- Enable RLS on all tables
ALTER TABLE public.user_nutrition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apple_health_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_health_metrics ENABLE ROW LEVEL SECURITY;

-- Create role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'dietist', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for user_nutrition_settings
CREATE POLICY "Users can view own nutrition settings"
  ON public.user_nutrition_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition settings"
  ON public.user_nutrition_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition settings"
  ON public.user_nutrition_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_nutrition_goals
CREATE POLICY "Users can view own nutrition goals"
  ON public.user_nutrition_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition goals"
  ON public.user_nutrition_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition goals"
  ON public.user_nutrition_goals FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'dietist'));

CREATE POLICY "Dietists can view patient goals"
  ON public.user_nutrition_goals FOR SELECT
  USING (public.has_role(auth.uid(), 'dietist'));

-- RLS Policies for nutrition_entries
CREATE POLICY "Users can view own nutrition entries"
  ON public.nutrition_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition entries"
  ON public.nutrition_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition entries"
  ON public.nutrition_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition entries"
  ON public.nutrition_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Dietists can view patient entries"
  ON public.nutrition_entries FOR SELECT
  USING (public.has_role(auth.uid(), 'dietist'));

-- RLS Policies for apple_health_settings
CREATE POLICY "Users can view own apple health settings"
  ON public.apple_health_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own apple health settings"
  ON public.apple_health_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own apple health settings"
  ON public.apple_health_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_health_metrics
CREATE POLICY "Users can view own health metrics"
  ON public.daily_health_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health metrics"
  ON public.daily_health_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health metrics"
  ON public.daily_health_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Dietists can view patient health metrics"
  ON public.daily_health_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'dietist'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_nutrition_entries_user_date ON public.nutrition_entries(user_id, entry_date);
CREATE INDEX idx_daily_health_metrics_user_date ON public.daily_health_metrics(user_id, metric_date);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_user_nutrition_settings_updated_at
  BEFORE UPDATE ON public.user_nutrition_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_nutrition_goals_updated_at
  BEFORE UPDATE ON public.user_nutrition_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_apple_health_settings_updated_at
  BEFORE UPDATE ON public.apple_health_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_health_metrics_updated_at
  BEFORE UPDATE ON public.daily_health_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();