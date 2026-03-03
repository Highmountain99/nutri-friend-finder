
-- 1. Insert the missing assignment for the existing booking
INSERT INTO public.dietist_patient_assignments (dietist_id, patient_id)
SELECT dp.user_id, a.user_id
FROM public.appointments a
JOIN public.dietitian_profiles dp ON dp.id = a.dietitian_id
WHERE a.id = '5f0aa54f-73a0-464b-a847-7b43c2d5ffe9'
ON CONFLICT DO NOTHING;

-- 2. Create a trigger function that auto-creates assignments when appointments are booked
CREATE OR REPLACE FUNCTION public.auto_assign_patient_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _dietist_user_id uuid;
BEGIN
  -- Only act on new bookings
  IF NEW.dietitian_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the dietitian's user_id from their profile
  SELECT user_id INTO _dietist_user_id
  FROM public.dietitian_profiles
  WHERE id = NEW.dietitian_id;

  IF _dietist_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create assignment if it doesn't exist
  INSERT INTO public.dietist_patient_assignments (dietist_id, patient_id)
  VALUES (_dietist_user_id, NEW.user_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Attach trigger to appointments table
CREATE TRIGGER trg_auto_assign_on_booking
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_patient_on_booking();
