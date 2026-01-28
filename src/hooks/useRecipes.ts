import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  time_minutes: number | null;
  servings: number | null;
  difficulty: string | null;
  tags: string[] | null;
  category: string | null;
  rating: number | null;
  is_featured: boolean | null;
  is_climate_smart: boolean | null;
  created_at: string | null;
}

export interface RecipeWithFavorite extends Recipe {
  is_favorite: boolean;
}

export function useRecipes(category?: string, searchQuery?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recipes", category, searchQuery, user?.id],
    queryFn: async (): Promise<RecipeWithFavorite[]> => {
      // Fetch recipes
      let query = supabase
        .from("recipes")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false, nullsFirst: false });

      if (category && category !== "Alla") {
        query = query.eq("category", category.toLowerCase());
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data: recipes, error } = await query;

      if (error) throw error;

      // Fetch user favorites if logged in
      let favoriteIds: string[] = [];
      if (user) {
        const { data: favorites } = await supabase
          .from("user_favorite_recipes")
          .select("recipe_id")
          .eq("user_id", user.id);

        favoriteIds = favorites?.map((f) => f.recipe_id) || [];
      }

      // Combine recipes with favorite status
      return (recipes || []).map((recipe) => ({
        ...recipe,
        is_favorite: favoriteIds.includes(recipe.id),
      }));
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ recipeId, isFavorite }: { recipeId: string; isFavorite: boolean }) => {
      if (!user) throw new Error("Must be logged in to favorite recipes");

      if (isFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from("user_favorite_recipes")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_id", recipeId);

        if (error) throw error;
      } else {
        // Add favorite
        const { error } = await supabase
          .from("user_favorite_recipes")
          .insert({ user_id: user.id, recipe_id: recipeId });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useFeaturedRecipes() {
  return useQuery({
    queryKey: ["recipes", "featured"],
    queryFn: async (): Promise<Recipe[]> => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("is_featured", true)
        .order("rating", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });
}
