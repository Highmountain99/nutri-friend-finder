import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export interface RecipeFilters {
  cuisineTypes: string[];
  mealTypes: string[];
  healthPlans: string[];
  dietaryNeeds: string[];
  allergenFree: string[];
}

export interface RecipeWithFavorite extends Tables<"recipes"> {
  is_favorite: boolean;
}

export const emptyFilters: RecipeFilters = {
  cuisineTypes: [],
  mealTypes: [],
  healthPlans: [],
  dietaryNeeds: [],
  allergenFree: [],
};

export function hasActiveFilters(filters: RecipeFilters): boolean {
  return (
    filters.cuisineTypes.length > 0 ||
    filters.mealTypes.length > 0 ||
    filters.healthPlans.length > 0 ||
    filters.dietaryNeeds.length > 0 ||
    filters.allergenFree.length > 0
  );
}

export function useRecipeSearch(searchQuery: string, filters: RecipeFilters, browseAll = false) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recipe-search", searchQuery, filters, browseAll, user?.id],
    queryFn: async () => {
      let query = supabase.from("recipes").select("*");

      // Text search on title
      if (searchQuery.trim()) {
        query = query.ilike("title", `%${searchQuery.trim()}%`);
      }

      // Array filters using contains
      if (filters.cuisineTypes.length > 0) {
        query = query.contains("cuisine_types", filters.cuisineTypes);
      }
      if (filters.mealTypes.length > 0) {
        query = query.contains("meal_types", filters.mealTypes);
      }
      if (filters.healthPlans.length > 0) {
        query = query.contains("health_plans", filters.healthPlans);
      }
      if (filters.dietaryNeeds.length > 0) {
        query = query.contains("dietary_needs", filters.dietaryNeeds);
      }
      if (filters.allergenFree.length > 0) {
        query = query.contains("allergen_free", filters.allergenFree);
      }

      query = query.order("rating", { ascending: false, nullsFirst: false }).limit(50);

      const { data: recipes, error } = await query;

      if (error) throw error;

      // Get user favorites if logged in
      let favoriteIds: string[] = [];
      if (user) {
        const { data: favorites } = await supabase
          .from("user_favorite_recipes")
          .select("recipe_id")
          .eq("user_id", user.id);
        favoriteIds = favorites?.map((f) => f.recipe_id) || [];
      }

      // Map recipes with favorite status
      const recipesWithFavorites: RecipeWithFavorite[] = (recipes || []).map((recipe) => ({
        ...recipe,
        is_favorite: favoriteIds.includes(recipe.id),
      }));

      return recipesWithFavorites;
    },
    enabled: searchQuery.trim().length > 0 || hasActiveFilters(filters),
  });
}
