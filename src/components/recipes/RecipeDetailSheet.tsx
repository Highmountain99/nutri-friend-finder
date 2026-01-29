import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Users,
  ChefHat,
  Heart,
  Leaf,
  Flame,
  ChevronRight,
  Star,
} from "lucide-react";
import { useRecipeDetail, useRateRecipe } from "@/hooks/useRecipeDetail";
import { useToggleFavorite } from "@/hooks/useRecipes";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CookingModeSheet } from "./CookingModeSheet";
import { NutritionDetailModal } from "./NutritionDetailModal";

interface RecipeDetailSheetProps {
  recipeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetailSheet({
  recipeId,
  open,
  onOpenChange,
}: RecipeDetailSheetProps) {
  const { user } = useAuth();
  const { recipe, isLoading, userRating, similarRecipes } = useRecipeDetail(recipeId);
  const rateRecipe = useRateRecipe();
  const toggleFavorite = useToggleFavorite();

  const [showCookingMode, setShowCookingMode] = useState(false);
  const [showNutritionDetail, setShowNutritionDetail] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleRate = (rating: number) => {
    if (!user) {
      toast.error("Logga in för att betygsätta");
      return;
    }
    if (!recipeId) return;

    setSelectedRating(rating);
    rateRecipe.mutate(
      { recipeId, rating },
      {
        onSuccess: () => toast.success("Betyg sparat!"),
        onError: () => toast.error("Kunde inte spara betyg"),
      }
    );
  };

  const handleSimilarRecipeClick = (similarRecipeId: string) => {
    // Close and reopen with new recipe
    onOpenChange(false);
    setTimeout(() => {
      // Re-trigger with new recipe ID (parent should handle this)
    }, 100);
  };

  if (!open) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
          {isLoading || !recipe ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>{recipe.title}</SheetTitle>
              </SheetHeader>

              {/* Image */}
              <div className="relative -mx-6 -mt-6 h-56">
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ChefHat className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}

                {/* Badges overlay */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {recipe.is_climate_smart && (
                    <Badge className="bg-primary/90 text-primary-foreground gap-1">
                      <Leaf className="w-3 h-3" />
                      Klimatsmart
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-6 py-4">
                {/* Title and favorite */}
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold text-foreground">{recipe.title}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!user) {
                        toast.error("Logga in för att spara favoriter");
                        return;
                      }
                      toggleFavorite.mutate({ recipeId: recipe.id, isFavorite: false });
                    }}
                  >
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {recipe.time_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {recipe.time_minutes} min
                    </span>
                  )}
                  {recipe.servings && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {recipe.servings} port
                    </span>
                  )}
                  {recipe.difficulty && (
                    <span className="flex items-center gap-1">
                      <ChefHat className="w-4 h-4" />
                      {recipe.difficulty}
                    </span>
                  )}
                </div>

                {/* Description */}
                {recipe.description && (
                  <p className="text-muted-foreground">{recipe.description}</p>
                )}

                {/* Nutrition summary */}
                <div
                  className="bg-muted/50 rounded-lg p-4 cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => setShowNutritionDetail(true)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Näring per portion</h3>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-accent">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div className="font-semibold text-foreground">
                        {recipe.calories_per_serving || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">kcal</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Protein</div>
                      <div className="font-semibold text-foreground">
                        {recipe.protein_per_serving || "—"}g
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Kolhydrater</div>
                      <div className="font-semibold text-foreground">
                        {recipe.carbs_per_serving || "—"}g
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Fett</div>
                      <div className="font-semibold text-foreground">
                        {recipe.fat_per_serving || "—"}g
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Ingredients */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Ingredienser ({recipe.ingredients.length})
                  </h3>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        <span className="text-foreground">
                          {ingredient.quantity && `${ingredient.quantity} `}
                          {ingredient.unit && `${ingredient.unit} `}
                          {ingredient.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Instructions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Instruktioner</h3>
                  <ol className="space-y-4">
                    {recipe.instructions.map((instruction, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">
                          {instruction.stepNumber || i + 1}
                        </span>
                        <p className="text-sm text-foreground pt-0.5">
                          {instruction.text}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>

                <Separator />

                {/* Rating */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Betygsätt detta recept</h3>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            (selectedRating || userRating?.rating || 0) >= star
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {recipe.rating && (
                    <p className="text-sm text-muted-foreground">
                      Snittbetyg: {recipe.rating.toFixed(1)} ({recipe.rating_count || 0} betyg)
                    </p>
                  )}
                </div>

                {/* Similar recipes */}
                {similarRecipes.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">Liknande recept</h3>
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
                        {similarRecipes.map((similar) => (
                          <div
                            key={similar.id}
                            className="w-28 flex-shrink-0 cursor-pointer"
                            onClick={() => handleSimilarRecipeClick(similar.id)}
                          >
                            <div className="h-20 bg-muted rounded-lg overflow-hidden mb-2">
                              {similar.image_url ? (
                                <img
                                  src={similar.image_url}
                                  alt={similar.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ChefHat className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs font-medium line-clamp-2 text-foreground">
                              {similar.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Start cooking button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowCookingMode(true)}
                >
                  <ChefHat className="w-5 h-5 mr-2" />
                  Börja laga
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Cooking mode */}
      {recipe && (
        <CookingModeSheet
          open={showCookingMode}
          onOpenChange={setShowCookingMode}
          recipe={recipe}
        />
      )}

      {/* Nutrition detail modal */}
      {recipe && (
        <NutritionDetailModal
          open={showNutritionDetail}
          onOpenChange={setShowNutritionDetail}
          recipe={recipe}
        />
      )}
    </>
  );
}
