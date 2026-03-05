import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export interface RecipeWithInteraction {
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
  carbs_per_serving: number | null;
  fat_per_serving: number | null;
  ingredients: unknown;
  instructions: unknown;
  source: "algo" | "dietitian";
  dietitian_id: string | null;
}

export function useDailyPicks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: picks, isLoading, error } = useQuery({
    queryKey: ["dailyPicks", user?.id, today],
    queryFn: async (): Promise<RecipeWithInteraction[]> => {
      if (!user) return [];

      // Get all recipes that user hasn't interacted with today
      // or have been suggested by dietitian
      const { data: interactions } = await supabase
        .from("user_recipe_interactions")
        .select("recipe_id, status, source, dietitian_id")
        .eq("user_id", user.id)
        .eq("suggested_date", today);

      const interactedIds = interactions?.map((i) => i.recipe_id) || [];
      const dietitianRecommendations = interactions?.filter(
        (i) => i.source === "dietitian" && i.status === "suggested"
      ) || [];

      // Fetch dietitian recommended recipes first
      let dietitianRecipes: RecipeWithInteraction[] = [];
      if (dietitianRecommendations.length > 0) {
        const dietitianRecipeIds = dietitianRecommendations.map((r) => r.recipe_id);
        const { data } = await supabase
          .from("recipes")
          .select("*")
          .in("id", dietitianRecipeIds);

        dietitianRecipes = (data || []).map((recipe) => ({
          ...recipe,
          source: "dietitian" as const,
          dietitian_id: dietitianRecommendations.find(
            (r) => r.recipe_id === recipe.id
          )?.dietitian_id || null,
        }));
      }

      // Fetch algorithm-suggested recipes (ones user hasn't seen today)
      let query = supabase
        .from("recipes")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(10);

      // Exclude already interacted recipes
      const excludeIds = interactedIds.filter(
        (id) => !dietitianRecommendations.some((r) => r.recipe_id === id)
      );
      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const { data: algoRecipes } = await query;

      const algoRecipesWithSource: RecipeWithInteraction[] = (algoRecipes || []).map(
        (recipe) => ({
          ...recipe,
          source: "algo" as const,
          dietitian_id: null,
        })
      );

      // Combine: dietitian first, then algo
      return [...dietitianRecipes, ...algoRecipesWithSource];
    },
    enabled: !!user,
  });

  const { data: skippedCount } = useQuery({
    queryKey: ["skippedCount", user?.id, today],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;

      const { count } = await supabase
        .from("user_recipe_interactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("suggested_date", today)
        .eq("status", "skipped");

      return count || 0;
    },
    enabled: !!user,
  });

  const saveRecipeMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase.from("user_recipe_interactions").upsert(
        {
          user_id: user.id,
          recipe_id: recipeId,
          status: "saved",
          suggested_date: today,
          source: "algo",
        },
        { onConflict: "user_id,recipe_id" }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyPicks"] });
      queryClient.invalidateQueries({ queryKey: ["myRecipes"] });
      queryClient.invalidateQueries({ queryKey: ["skippedCount"] });
    },
  });

  const skipRecipeMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase.from("user_recipe_interactions").upsert(
        {
          user_id: user.id,
          recipe_id: recipeId,
          status: "skipped",
          suggested_date: today,
          source: "algo",
        },
        { onConflict: "user_id,recipe_id" }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyPicks"] });
      queryClient.invalidateQueries({ queryKey: ["skippedCount"] });
    },
  });

  const reviewSkippedMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      // Reset skipped recipes to suggested
      const { error } = await supabase
        .from("user_recipe_interactions")
        .update({ status: "suggested" })
        .eq("user_id", user.id)
        .eq("suggested_date", today)
        .eq("status", "skipped");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyPicks"] });
      queryClient.invalidateQueries({ queryKey: ["skippedCount"] });
    },
  });

  return {
    picks: picks || [],
    isLoading,
    error,
    saveRecipe: saveRecipeMutation.mutate,
    skipRecipe: skipRecipeMutation.mutate,
    reviewSkipped: reviewSkippedMutation.mutate,
    hasSkippedRecipes: (skippedCount || 0) > 0,
    isSaving: saveRecipeMutation.isPending,
    isSkipping: skipRecipeMutation.isPending,
  };
}
