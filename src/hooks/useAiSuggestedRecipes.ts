import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SuggestedRecipe } from "@/hooks/useSuggestedRecipes";

interface AiSuggestedData {
  active: SuggestedRecipe[];
  dismissed: SuggestedRecipe[];
  savedCount: number;
}

const QUERY_KEY = "ai-suggested-recipes";

export function useAiSuggestedRecipes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async (): Promise<AiSuggestedData> => {
      const empty = { active: [], dismissed: [], savedCount: 0 };
      if (!user) return empty;

      const { data: rows, error } = await supabase
        .from("user_recipe_interactions")
        .select("id, recipe_id, status, created_at")
        .eq("user_id", user.id)
        .eq("source", "ai")
        .order("created_at", { ascending: false });

      if (error || !rows || rows.length === 0) return empty;

      const { data: recipes } = await supabase
        .from("recipes")
        .select(
          "id, title, description, image_url, time_minutes, servings, difficulty, tags, rating, is_climate_smart, calories_per_serving, protein_per_serving"
        )
        .in("id", rows.map((r) => r.recipe_id));

      const mapRow = (r: (typeof rows)[0]): SuggestedRecipe | null => {
        const recipe = recipes?.find((x) => x.id === r.recipe_id);
        if (!recipe) return null;
        return {
          ...recipe,
          suggestion_id: r.id,
          dietitianName: "Kostcoachen",
          message: null,
        };
      };

      return {
        active: rows.filter((r) => r.status === "suggested").map(mapRow).filter(Boolean) as SuggestedRecipe[],
        dismissed: rows.filter((r) => r.status === "skipped").map(mapRow).filter(Boolean) as SuggestedRecipe[],
        savedCount: rows.filter((r) => r.status === "saved").length,
      };
    },
    enabled: !!user,
  });

  const optimisticRemove = (id: string, newStatus: "saved" | "skipped") => {
    queryClient.setQueryData<AiSuggestedData>([QUERY_KEY, user?.id], (old) => {
      if (!old) return old;
      const recipe = old.active.find((r) => r.suggestion_id === id);
      return {
        active: old.active.filter((r) => r.suggestion_id !== id),
        dismissed: newStatus === "skipped" && recipe ? [...old.dismissed, recipe] : old.dismissed,
        savedCount: newStatus === "saved" ? old.savedCount + 1 : old.savedCount,
      };
    });
  };

  const setStatus = async (id: string, status: "saved" | "skipped") => {
    const { error } = await supabase
      .from("user_recipe_interactions")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  };

  const saveMutation = useMutation({
    mutationFn: (id: string) => setStatus(id, "saved"),
    onMutate: (id: string) => optimisticRemove(id, "saved"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["myRecipes"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => setStatus(id, "skipped"),
    onMutate: (id: string) => optimisticRemove(id, "skipped"),
    onError: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase
        .from("user_recipe_interactions")
        .update({ status: "suggested" })
        .eq("user_id", user.id)
        .eq("source", "ai")
        .eq("status", "skipped");
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });

  return {
    active: data?.active || [],
    dismissed: data?.dismissed || [],
    isLoading,
    hasDismissed: (data?.dismissed.length || 0) > 0,
    hasSaved: (data?.savedCount || 0) > 0,
    saveRecipe: saveMutation.mutate,
    dismissRecipe: dismissMutation.mutate,
    restoreDismissed: restoreMutation.mutate,
  };
}
