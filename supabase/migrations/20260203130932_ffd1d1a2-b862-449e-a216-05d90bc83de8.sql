-- Add foreign key relationship between appointments and dietitian_profiles
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_dietitian_id_fkey
FOREIGN KEY (dietitian_id) REFERENCES public.dietitian_profiles(id);