-- Create dietitian_profiles table
CREATE TABLE public.dietitian_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Legitimerad dietist',
    bio TEXT,
    avatar_url TEXT,
    specializations TEXT[] DEFAULT '{}'::text[],
    languages TEXT[] DEFAULT '{"svenska"}'::text[],
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dietitian_availability table
CREATE TABLE public.dietitian_availability (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dietitian_id UUID NOT NULL REFERENCES public.dietitian_profiles(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    time_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(dietitian_id, available_date)
);

-- Create indexes for performance
CREATE INDEX idx_dietitian_profiles_user_id ON public.dietitian_profiles(user_id);
CREATE INDEX idx_dietitian_profiles_specializations ON public.dietitian_profiles USING GIN(specializations);
CREATE INDEX idx_dietitian_profiles_languages ON public.dietitian_profiles USING GIN(languages);
CREATE INDEX idx_dietitian_availability_date ON public.dietitian_availability(available_date);
CREATE INDEX idx_dietitian_availability_dietitian ON public.dietitian_availability(dietitian_id);

-- Enable RLS
ALTER TABLE public.dietitian_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietitian_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies for dietitian_profiles
CREATE POLICY "Anyone can view dietitian profiles"
ON public.dietitian_profiles
FOR SELECT
USING (true);

CREATE POLICY "Dietitians can update own profile"
ON public.dietitian_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all dietitian profiles"
ON public.dietitian_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for dietitian_availability
CREATE POLICY "Anyone can view dietitian availability"
ON public.dietitian_availability
FOR SELECT
USING (true);

CREATE POLICY "Dietitians can manage own availability"
ON public.dietitian_availability
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.dietitian_profiles
        WHERE id = dietitian_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all availability"
ON public.dietitian_availability
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_dietitian_profiles_updated_at
BEFORE UPDATE ON public.dietitian_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with test dietitians
INSERT INTO public.dietitian_profiles (id, user_id, first_name, last_name, title, bio, avatar_url, specializations, languages, is_available) VALUES
('d1111111-1111-1111-1111-111111111111', gen_random_uuid(), 'Anna', 'Lindqvist', 'Legitimerad dietist', 'Specialiserad på diabetes och metabola sjukdomar med över 10 års erfarenhet. Jag hjälper dig att hitta en hållbar livsstil.', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face', ARRAY['diabetes', 'weight_loss', 'heart_health'], ARRAY['svenska', 'engelska'], true),
('d2222222-2222-2222-2222-222222222222', gen_random_uuid(), 'Erik', 'Johansson', 'Kostrådgivare', 'Expert på mag-tarmhälsa och IBS. Tillsammans utforskar vi vilka livsmedel som fungerar för just dig.', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face', ARRAY['gut_health', 'general_health'], ARRAY['svenska'], true),
('d3333333-3333-3333-3333-333333333333', gen_random_uuid(), 'Maria', 'Bergström', 'Legitimerad dietist', 'Fokus på ätstörningar och emotionellt ätande. Jag arbetar med medkänsla och evidensbaserade metoder.', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face', ARRAY['eating_disorder', 'emotional_eating', 'womens_health'], ARRAY['svenska', 'engelska', 'spanska'], true),
('d4444444-4444-4444-4444-444444444444', gen_random_uuid(), 'Johan', 'Svensson', 'Legitimerad dietist', 'Erfarenhet av graviditetskost och barnnutrition. Jag stöttar dig genom hela resan.', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face', ARRAY['womens_health', 'general_health'], ARRAY['svenska', 'finska'], true),
('d5555555-5555-5555-5555-555555555555', gen_random_uuid(), 'Sofia', 'Andersson', 'Kostrådgivare', 'Specialiserad på viktminskning och idrottsnutrition. Låt oss nå dina mål tillsammans!', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop&crop=face', ARRAY['weight_loss', 'general_health', 'heart_health'], ARRAY['svenska', 'norska'], true);

-- Seed availability for next 14 days
INSERT INTO public.dietitian_availability (dietitian_id, available_date, time_slots)
SELECT 
    dp.id,
    (CURRENT_DATE + (d.day)::int) as available_date,
    '[{"hour": 9, "minute": 0, "booked": false}, {"hour": 10, "minute": 0, "booked": false}, {"hour": 11, "minute": 0, "booked": false}, {"hour": 13, "minute": 0, "booked": false}, {"hour": 14, "minute": 0, "booked": false}, {"hour": 15, "minute": 0, "booked": false}]'::jsonb as time_slots
FROM public.dietitian_profiles dp
CROSS JOIN generate_series(1, 14) as d(day)
WHERE dp.is_available = true;