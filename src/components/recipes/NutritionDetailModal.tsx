import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecipeDetail } from "@/hooks/useRecipeDetail";

interface NutritionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: RecipeDetail;
}

export function NutritionDetailModal({
  open,
  onOpenChange,
  recipe,
}: NutritionDetailModalProps) {
  const nutritionDetails = recipe.nutrition_details || {};

  // Common nutrition fields to display
  const nutritionFields = [
    { key: "calories", label: "Kalorier", unit: "kcal", value: recipe.calories_per_serving },
    { key: "protein", label: "Protein", unit: "g", value: recipe.protein_per_serving },
    { key: "carbs", label: "Kolhydrater", unit: "g", value: recipe.carbs_per_serving },
    { key: "fat", label: "Fett", unit: "g", value: recipe.fat_per_serving },
    { key: "fiber", label: "Fiber", unit: "g", value: nutritionDetails.fiber },
    { key: "sugar", label: "Socker", unit: "g", value: nutritionDetails.sugar },
    { key: "sodium", label: "Natrium", unit: "mg", value: nutritionDetails.sodium },
    { key: "saturatedFat", label: "Mättat fett", unit: "g", value: nutritionDetails.saturatedFat },
    { key: "cholesterol", label: "Kolesterol", unit: "mg", value: nutritionDetails.cholesterol },
    { key: "potassium", label: "Kalium", unit: "mg", value: nutritionDetails.potassium },
    { key: "vitaminA", label: "Vitamin A", unit: "%", value: nutritionDetails.vitaminA },
    { key: "vitaminC", label: "Vitamin C", unit: "%", value: nutritionDetails.vitaminC },
    { key: "calcium", label: "Kalcium", unit: "%", value: nutritionDetails.calcium },
    { key: "iron", label: "Järn", unit: "%", value: nutritionDetails.iron },
  ];

  const availableFields = nutritionFields.filter(
    (f) => f.value !== null && f.value !== undefined
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Näringsinnehåll per portion</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {availableFields.length > 0 ? (
            <div className="divide-y divide-border">
              {availableFields.map((field) => (
                <div
                  key={field.key}
                  className="flex justify-between py-3 text-sm"
                >
                  <span className="text-muted-foreground">{field.label}</span>
                  <span className="font-medium text-foreground">
                    {typeof field.value === 'number' 
                      ? field.value.toFixed(1) 
                      : String(field.value)} {field.unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Ingen detaljerad näringsinformation tillgänglig
            </p>
          )}

          {recipe.servings && (
            <p className="text-xs text-muted-foreground text-center">
              Baserat på {recipe.servings} portioner
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
