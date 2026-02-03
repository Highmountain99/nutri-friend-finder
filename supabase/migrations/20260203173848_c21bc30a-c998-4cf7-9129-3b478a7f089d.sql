-- Create recipe import queue table for tracking scraping progress
CREATE TABLE public.recipe_import_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  scraped_data jsonb,
  parsed_data jsonb,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.recipe_import_queue ENABLE ROW LEVEL SECURITY;

-- Only admins can manage the import queue
CREATE POLICY "Admins can view import queue" 
ON public.recipe_import_queue 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert to import queue" 
ON public.recipe_import_queue 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update import queue" 
ON public.recipe_import_queue 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete from import queue" 
ON public.recipe_import_queue 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster status queries
CREATE INDEX idx_recipe_import_queue_status ON public.recipe_import_queue(status);

-- Add index for deduplication checks
CREATE INDEX idx_recipe_import_queue_source_url ON public.recipe_import_queue(source_url);