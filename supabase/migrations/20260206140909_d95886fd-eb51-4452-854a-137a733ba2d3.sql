-- Add Stripe-related columns to appointments table
ALTER TABLE public.appointments
ADD COLUMN stripe_customer_id text,
ADD COLUMN stripe_setup_intent_id text,
ADD COLUMN payment_method_saved boolean DEFAULT false;