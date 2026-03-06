import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RecipeDetail {
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
  rating_count: number | null;
  is_climate_smart: boolean | null;
  is_featured: boolean | null;
  calories_per_serving: number | null;
  protein_per_serving: number | null;
  carbs_per_serving: number | null;
  fat_per_serving: number | null;
  nutrition_details: Record<string, unknown> | null;
  ingredients: Ingredient[];
  instructions: Instruction[];
  similar_recipe_ids: string[] | null;
  cuisine_types: string[] | null;
  meal_types: string[] | null;
  health_plans: string[] | null;
  dietary_needs: string[] | null;
  allergen_free: string[] | null;
}

export interface Ingredient {
  text: string;
  quantity?: string;
  unit?: string;
  ingredient?: string;
  amount?: string | number;
}

export interface Instruction {
  stepNumber: number;
  text: string;
}

export interface UserRating {
  rating: number;
  review_text: string | null;
}

export function useRecipeDetail(recipeId: string | null) {
  const { user } = useAuth();

  const recipeQuery = useQuery({
    queryKey: ["recipeDetail", recipeId],
    queryFn: async (): Promise<RecipeDetail | null> => {
      if (!recipeId) return null;

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();

      if (error) throw error;

      // Parse ingredients and instructions from JSONB
      const ingredients = Array.isArray(data.ingredients) 
        ? (data.ingredients as unknown as Ingredient[])
        : [];
      
      const instructions = Array.isArray(data.instructions)
        ? (data.instructions as unknown as Instruction[])
        : [];

      return {
        ...data,
        nutrition_details: data.nutrition_details as Record<string, unknown> | null,
        ingredients,
        instructions,
      };
    },
    enabled: !!recipeId,
  });

  const userRatingQuery = useQuery({
    queryKey: ["userRating", recipeId, user?.id],
    queryFn: async (): Promise<UserRating | null> => {
      if (!recipeId || !user) return null;

      const { data, error } = await supabase
        .from("recipe_ratings")
        .select("rating, review_text")
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!recipeId && !!user,
  });

  const similarRecipesQuery = useQuery({
    queryKey: ["similarRecipes", recipeId, recipeQuery.data?.similar_recipe_ids],
    queryFn: async () => {
      const ids = recipeQuery.data?.similar_recipe_ids;
      if (!ids || ids.length === 0) return [];

      const { data, error } = await supabase
        .from("recipes")
        .select("id, title, image_url, time_minutes, rating")
        .in("id", ids)
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!recipeQuery.data?.similar_recipe_ids?.length,
  });

  return {
    recipe: recipeQuery.data,
    isLoading: recipeQuery.isLoading,
    error: recipeQuery.error,
    userRating: userRatingQuery.data,
    similarRecipes: similarRecipesQuery.data || [],
  };
}

export function useRateRecipe() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      recipeId,
      rating,
      reviewText,
    }: {
      recipeId: string;
      rating: number;
      reviewText?: string;
    }) => {
      if (!user) throw new Error("Must be logged in to rate recipes");

      const { error } = await supabase.from("recipe_ratings").upsert(
        {
          user_id: user.id,
          recipe_id: recipeId,
          rating,
          review_text: reviewText || null,
        },
        { onConflict: "user_id,recipe_id" }
      );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userRating", variables.recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipeDetail", variables.recipeId] });
    },
  });
}
