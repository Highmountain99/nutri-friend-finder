-- Create symptom_entries table
CREATE TABLE public.symptom_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  meal_id UUID REFERENCES public.nutrition_entries(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  symptom_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.symptom_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
CREATE POLICY "Users can view own symptoms" 
  ON public.symptom_entries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symptoms" 
  ON public.symptom_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own symptoms" 
  ON public.symptom_entries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own symptoms" 
  ON public.symptom_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policy for dietists to view assigned patient symptoms
CREATE POLICY "Dietists can view assigned patient symptoms" 
  ON public.symptom_entries FOR SELECT 
  USING (is_assigned_dietist(user_id));

-- Trigger for updated_at
CREATE TRIGGER update_symptom_entries_updated_at
  BEFORE UPDATE ON public.symptom_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();