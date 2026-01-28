-- Create recipes table for storing recipe data
CREATE TABLE public.recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    image_url text,
    time_minutes integer,
    servings integer DEFAULT 2,
    difficulty text DEFAULT 'medel',
    tags text[] DEFAULT '{}',
    category text DEFAULT 'middag',
    ingredients jsonb DEFAULT '[]',
    instructions jsonb DEFAULT '[]',
    source_url text,
    rating numeric(2,1),
    is_featured boolean DEFAULT false,
    is_climate_smart boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (recipes are public content)
CREATE POLICY "Anyone can view recipes"
ON public.recipes
FOR SELECT
USING (true);

-- Only admins can insert/update/delete recipes
CREATE POLICY "Admins can insert recipes"
ON public.recipes
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update recipes"
ON public.recipes
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete recipes"
ON public.recipes
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_recipes_updated_at
BEFORE UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_favorite_recipes table for saving favorites
CREATE TABLE public.user_favorite_recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, recipe_id)
);

-- Enable RLS on favorites
ALTER TABLE public.user_favorite_recipes ENABLE ROW LEVEL SECURITY;

-- Users can only view their own favorites
CREATE POLICY "Users can view own favorites"
ON public.user_favorite_recipes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add their own favorites
CREATE POLICY "Users can add favorites"
ON public.user_favorite_recipes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove favorites"
ON public.user_favorite_recipes
FOR DELETE
USING (auth.uid() = user_id);