import { CuisineCategoryGrid } from "./CuisineCategoryGrid";
import { MealTypeCategoryGrid } from "./MealTypeCategoryGrid";
import type { RecipeFilters } from "@/hooks/useRecipeSearch";

interface RecipeSearchViewProps {
  onCuisineSelect: (cuisineId: string) => void;
  onMealTypeSelect: (mealTypeId: string) => void;
}

export function RecipeSearchView({
  onCuisineSelect,
  onMealTypeSelect,
}: RecipeSearchViewProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <CuisineCategoryGrid onSelect={onCuisineSelect} />
      <MealTypeCategoryGrid onSelect={onMealTypeSelect} />
    </div>
  );
}
