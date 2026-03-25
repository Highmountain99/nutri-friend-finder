import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SuggestedRecipe {
  id: string;
  suggestion_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  time_minutes: number | null;
  servings: number | null;
  difficulty: string | null;
  tags: string[] | null;
  rating: number | null;
  is_climate_smart: boolean | null;
  calories_per_serving: number | null;
  protein_per_serving: number | null;
  dietitianName: string;
  message: string | null;
}

interface SuggestedData {
  active: SuggestedRecipe[];
  dismissed: SuggestedRecipe[];
  savedCount: number;
}

const QUERY_KEY = "suggested-recipes-stack";

export function useSuggestedRecipes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async (): Promise<SuggestedData> => {
      if (!user) return { active: [], dismissed: [], savedCount: 0 };

      const { data: rows, error } = await supabase
        .from("recipe_suggestions")
        .select("id, recipe_id, message, status, created_at, dietitian_id")
        .eq("patient_id", user.id)
        .in("status", ["suggested", "saved", "dismissed"])
        .order("created_at", { ascending: false });

      if (error || !rows || rows.length === 0) return { active: [], dismissed: [], savedCount: 0 };

      const recipeIds = rows.map((s) => s.recipe_id);
      const { data: recipes } = await supabase
        .from("recipes")
        .select("id, title, description, image_url, time_minutes, servings, difficulty, tags, rating, is_climate_smart, calories_per_serving, protein_per_serving")
        .in("id", recipeIds);

      const dietitianIds = [...new Set(rows.map((s) => s.dietitian_id))];
      const { data: profiles } = await supabase
        .from("dietitian_profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", dietitianIds);

      const dietMap = new Map(
        (profiles || []).map((d) => [d.user_id, `${d.first_name} ${d.last_name}`])
      );

      const mapRow = (s: (typeof rows)[0]): SuggestedRecipe | null => {
        const recipe = recipes?.find((r) => r.id === s.recipe_id);
        if (!recipe) return null;
        return {
          ...recipe,
          suggestion_id: s.id,
          dietitianName: dietMap.get(s.dietitian_id) || "Din dietist",
          message: s.message,
        };
      };

      const active = rows.filter((s) => s.status === "suggested").map(mapRow).filter(Boolean) as SuggestedRecipe[];
      const dismissed = rows.filter((s) => s.status === "dismissed").map(mapRow).filter(Boolean) as SuggestedRecipe[];
      const savedCount = rows.filter((s) => s.status === "saved").length;

      return { active, dismissed, savedCount };
    },
    enabled: !!user,
  });

  // Optimistic helper: move a recipe from active to a new status locally
  const optimisticRemove = (suggestionId: string, newStatus: "saved" | "dismissed") => {
    queryClient.setQueryData<SuggestedData>([QUERY_KEY, user?.id], (old) => {
      if (!old) return old;
      const recipe = old.active.find((r) => r.suggestion_id === suggestionId);
      return {
        active: old.active.filter((r) => r.suggestion_id !== suggestionId),
        dismissed: newStatus === "dismissed" && recipe ? [...old.dismissed, recipe] : old.dismissed,
        savedCount: newStatus === "saved" ? old.savedCount + 1 : old.savedCount,
      };
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from("recipe_suggestions")
        .update({ status: "saved" })
        .eq("id", suggestionId);
      if (error) throw error;

      if (!user) return;
      const suggestion = data?.active.find((s) => s.suggestion_id === suggestionId);
      if (suggestion) {
        await supabase.from("user_recipe_interactions").upsert(
          {
            user_id: user.id,
            recipe_id: suggestion.id,
            status: "saved",
            suggested_date: new Date().toISOString().split("T")[0],
            source: "algo",
          },
          { onConflict: "user_id,recipe_id" }
        );
      }
    },
    onMutate: (suggestionId) => {
      optimisticRemove(suggestionId, "saved");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["myRecipes"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from("recipe_suggestions")
        .update({ status: "dismissed" })
        .eq("id", suggestionId);
      if (error) throw error;
    },
    onMutate: (suggestionId) => {
      optimisticRemove(suggestionId, "dismissed");
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const restoreDismissedMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase
        .from("recipe_suggestions")
        .update({ status: "suggested" })
        .eq("patient_id", user.id)
        .eq("status", "dismissed");
      if (error) throw error;
    },
    onMutate: () => {
      queryClient.setQueryData<SuggestedData>([QUERY_KEY, user?.id], (old) => {
        if (!old) return old;
        return {
          active: [...old.active, ...old.dismissed],
          dismissed: [],
          savedCount: old.savedCount,
        };
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  return {
    active: data?.active || [],
    dismissed: data?.dismissed || [],
    isLoading,
    hasDismissed: (data?.dismissed.length || 0) > 0,
    hasSaved: (data?.savedCount || 0) > 0,
    saveRecipe: saveMutation.mutate,
    dismissRecipe: dismissMutation.mutate,
    restoreDismissed: restoreDismissedMutation.mutate,
    isSaving: saveMutation.isPending,
    isDismissing: dismissMutation.isPending,
  };
}
