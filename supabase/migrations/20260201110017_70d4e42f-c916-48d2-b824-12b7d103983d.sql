-- Create health_tracking_entries table for storing diverse health metrics
CREATE TABLE public.health_tracking_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date, metric_type)
);

-- Enable RLS
ALTER TABLE public.health_tracking_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own entries
CREATE POLICY "Users can view own health entries"
ON public.health_tracking_entries
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert own health entries"
ON public.health_tracking_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update own health entries"
ON public.health_tracking_entries
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own health entries"
ON public.health_tracking_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Dietists can view assigned patient entries
CREATE POLICY "Dietists can view assigned patient health entries"
ON public.health_tracking_entries
FOR SELECT
USING (is_assigned_dietist(user_id));

-- Add trigger for updated_at
CREATE TRIGGER update_health_tracking_entries_updated_at
BEFORE UPDATE ON public.health_tracking_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();