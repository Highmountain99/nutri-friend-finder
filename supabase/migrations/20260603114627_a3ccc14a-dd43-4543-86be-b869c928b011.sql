-- 1. Move stripe payment data from appointments into a separate table
-- accessible only to the user themselves (not to assigned dietitians).
CREATE TABLE public.appointment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid,
  user_id uuid NOT NULL,
  stripe_customer_id text,
  stripe_setup_intent_id text,
  payment_method_saved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_payments TO authenticated;
GRANT ALL ON public.appointment_payments TO service_role;

ALTER TABLE public.appointment_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment records"
ON public.appointment_payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment records"
ON public.appointment_payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment records"
ON public.appointment_payments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment records"
ON public.appointment_payments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER trg_appointment_payments_updated_at
BEFORE UPDATE ON public.appointment_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill existing data
INSERT INTO public.appointment_payments
  (appointment_id, user_id, stripe_customer_id, stripe_setup_intent_id, payment_method_saved, created_at, updated_at)
SELECT id, user_id, stripe_customer_id, stripe_setup_intent_id,
       COALESCE(payment_method_saved, false), created_at, updated_at
FROM public.appointments
WHERE stripe_customer_id IS NOT NULL
   OR stripe_setup_intent_id IS NOT NULL
   OR payment_method_saved = true;

-- Drop the sensitive columns from appointments so dietitian SELECT no longer exposes them
ALTER TABLE public.appointments
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_setup_intent_id,
  DROP COLUMN IF EXISTS payment_method_saved;

-- 2. Restrict dietitian_availability SELECT to authenticated users only
-- to prevent unauthenticated enumeration of booked slots.
DROP POLICY IF EXISTS "Anyone can view dietitian availability" ON public.dietitian_availability;

CREATE POLICY "Authenticated users can view dietitian availability"
ON public.dietitian_availability
FOR SELECT
TO authenticated
USING (true);