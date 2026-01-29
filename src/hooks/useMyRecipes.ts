import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SavedRecipe {
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
  is_climate_smart: boolean | null;
  calories_per_serving: number | null;
  protein_per_serving: number | null;
  saved_at: string;
}

export function useMyRecipes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["myRecipes", user?.id],
    queryFn: async (): Promise<SavedRecipe[]> => {
      if (!user) return [];

      // Get all saved recipe interactions
      const { data: interactions, error: interactionsError } = await supabase
        .from("user_recipe_interactions")
        .select("recipe_id, created_at")
        .eq("user_id", user.id)
        .eq("status", "saved")
        .order("created_at", { ascending: false });

      if (interactionsError) throw interactionsError;
      if (!interactions || interactions.length === 0) return [];

      const recipeIds = interactions.map((i) => i.recipe_id);

      // Fetch the actual recipes
      const { data: recipes, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .in("id", recipeIds);

      if (recipesError) throw recipesError;

      // Combine with saved_at timestamp and maintain order
      return interactions.map((interaction) => {
        const recipe = recipes?.find((r) => r.id === interaction.recipe_id);
        if (!recipe) return null;

        return {
          ...recipe,
          saved_at: interaction.created_at || new Date().toISOString(),
        };
      }).filter(Boolean) as SavedRecipe[];
    },
    enabled: !!user,
  });
}
