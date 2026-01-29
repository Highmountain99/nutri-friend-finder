import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RecipeSearchBar } from "@/components/recipes/RecipeSearchBar";
import { DailyPicksSection } from "@/components/recipes/DailyPicksSection";
import { MyRecipesSection } from "@/components/recipes/MyRecipesSection";
import { CuisineShortcuts } from "@/components/recipes/CuisineShortcuts";
import { MealTypeShortcuts } from "@/components/recipes/MealTypeShortcuts";
import { RecipeDetailSheet } from "@/components/recipes/RecipeDetailSheet";
import { RecipeSearchResults } from "@/components/recipes/RecipeSearchResults";
import { RecipeWithInteraction } from "@/hooks/useDailyPicks";

export default function Recipes() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    cuisineType?: string;
    mealType?: string;
  }>({});

  const isSearching = searchQuery.length > 0 || Object.keys(activeFilters).length > 0;

  const handleRecipeSelect = (recipe: RecipeWithInteraction) => {
    setSelectedRecipeId(recipe.id);
  };

  const handleRecipeIdSelect = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
  };

  const handleCuisineSelect = (cuisineType: string) => {
    setActiveFilters({ cuisineType });
  };

  const handleMealTypeSelect = (mealType: string) => {
    setActiveFilters({ mealType });
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
  };

  return (
    <div className="px-4 py-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Recept</h1>
        <p className="text-sm text-muted-foreground">
          Hitta recept som passar dig
        </p>
      </div>

      {/* Search */}
      <RecipeSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onFilterClick={() => setShowFilters(true)}
      />

      {isSearching ? (
        /* Search Results View */
        <RecipeSearchResults
          searchQuery={searchQuery}
          cuisineType={activeFilters.cuisineType}
          mealType={activeFilters.mealType}
          onRecipeSelect={handleRecipeIdSelect}
          onClearFilters={clearFilters}
        />
      ) : (
        /* Default View */
        <>
          {/* Daily Picks - only for logged in users */}
          {user && <DailyPicksSection onRecipeSelect={handleRecipeSelect} />}

          {/* My Recipes - only for logged in users */}
          {user && (
            <MyRecipesSection
              onRecipeSelect={handleRecipeIdSelect}
              onViewAll={() => {
                // Could navigate to a full saved recipes page
              }}
            />
          )}

          {/* Cuisine shortcuts */}
          <CuisineShortcuts onSelect={handleCuisineSelect} />

          {/* Meal type shortcuts */}
          <MealTypeShortcuts onSelect={handleMealTypeSelect} />
        </>
      )}

      {/* Recipe Detail Sheet */}
      <RecipeDetailSheet
        recipeId={selectedRecipeId}
        open={!!selectedRecipeId}
        onOpenChange={(open) => {
          if (!open) setSelectedRecipeId(null);
        }}
      />
    </div>
  );
}
