import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SwipeableRecipeCard } from "./SwipeableRecipeCard";
import { useDailyPicks, RecipeWithInteraction } from "@/hooks/useDailyPicks";
import { toast } from "sonner";

interface DailyPicksSectionProps {
  onRecipeSelect: (recipe: RecipeWithInteraction) => void;
}

export function DailyPicksSection({ onRecipeSelect }: DailyPicksSectionProps) {
  const {
    picks,
    isLoading,
    saveRecipe,
    skipRecipe,
    reviewSkipped,
    hasSkippedRecipes,
    isSaving,
    isSkipping,
  } = useDailyPicks();

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSave = () => {
    const currentRecipe = picks[currentIndex];
    if (currentRecipe) {
      saveRecipe(currentRecipe.id);
      toast.success("Recept sparat!");
      setCurrentIndex((prev) => Math.min(prev + 1, picks.length));
    }
  };

  const handleSkip = () => {
    const currentRecipe = picks[currentIndex];
    if (currentRecipe) {
      skipRecipe(currentRecipe.id);
      setCurrentIndex((prev) => Math.min(prev + 1, picks.length));
    }
  };

  const handleReviewSkipped = () => {
    reviewSkipped();
    setCurrentIndex(0);
    toast.success("Hoppade recept återställda");
  };

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Dagens tips</h2>
        <Skeleton className="h-[400px] rounded-lg" />
      </section>
    );
  }

  const currentRecipe = picks[currentIndex];
  const isFinished = currentIndex >= picks.length || !currentRecipe;
  const stackCards = picks.slice(currentIndex + 1, currentIndex + 3);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Dagens tips</h2>
        {!isFinished && picks.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {picks.length}
          </span>
        )}
      </div>

      {isFinished ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center space-y-4">
          <p className="text-muted-foreground">Du har gått igenom alla dagens tips!</p>
          {hasSkippedRecipes ? (
            <Button variant="outline" onClick={handleReviewSkipped} className="gap-2">
              <RefreshCw className="w-4 h-4" />Granska hoppade recept
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Kom tillbaka imorgon för nya förslag!</p>
          )}
        </div>
      ) : (
        <div className="relative" style={{ paddingBottom: `${stackCards.length * 12}px` }}>
          {/* Stack cards behind – rendered bottom-up so z-order is correct */}
          {stackCards
            .map((recipe, idx) => {
              const depth = idx + 1; // 1 = directly behind, 2 = further back
              return (
                <div
                  key={recipe.id}
                  className="absolute inset-x-0 top-0 rounded-xl border border-border/40 overflow-hidden pointer-events-none bg-card"
                  style={{
                    transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`,
                    zIndex: -depth,
                    filter: `brightness(${1 - depth * 0.06})`,
                    transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1), filter 0.35s ease",
                  }}
                >
                  <div className="h-48 bg-muted">
                    {recipe.image_url ? (
                      <img src={recipe.image_url} alt="" className="w-full h-full object-cover" draggable={false} />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-1 text-base">{recipe.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{recipe.description}</p>
                  </div>
                </div>
              );
            })}

          <SwipeableRecipeCard
            recipe={currentRecipe}
            onSave={handleSave}
            onSkip={handleSkip}
            onTap={() => onRecipeSelect(currentRecipe)}
            disabled={isSaving || isSkipping}
          />
        </div>
      )}
    </section>
  );
}
