import { useState } from "react";
import { RefreshCw, Sparkles, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SuggestedRecipeCard } from "./SuggestedRecipeCard";
import { useSuggestedRecipes } from "@/hooks/useSuggestedRecipes";
import { toast } from "sonner";

interface SuggestedRecipesSectionProps {
  onRecipeSelect: (recipeId: string) => void;
}

export function SuggestedRecipesSection({ onRecipeSelect }: SuggestedRecipesSectionProps) {
  const {
    active,
    isLoading,
    hasDismissed,
    hasSaved,
    saveRecipe,
    dismissRecipe,
    restoreDismissed,
    isSaving,
    isDismissing,
  } = useSuggestedRecipes();

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSave = () => {
    const current = active[currentIndex];
    if (current) {
      saveRecipe(current.suggestion_id);
      toast.success("Recept sparat!");
      setCurrentIndex((prev) => Math.min(prev + 1, active.length));
    }
  };

  const handleDismiss = () => {
    const current = active[currentIndex];
    if (current) {
      dismissRecipe(current.suggestion_id);
      setCurrentIndex((prev) => Math.min(prev + 1, active.length));
    }
  };

  const handleRestoreDismissed = () => {
    restoreDismissed();
    setCurrentIndex(0);
    toast.success("Borttagna förslag återställda");
  };

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Föreslagna av din dietist</h2>
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
      </section>
    );
  }

  if (active.length === 0 && !hasDismissed) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Föreslagna av din dietist</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <UtensilsCrossed className="h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium text-sm">Inga receptförslag ännu</p>
          <p className="text-xs mt-1 text-center max-w-[250px]">
            Din dietist kan föreslå recept som passar just dig.
          </p>
        </div>
      </section>
    );
  }

  const currentRecipe = active[currentIndex];
  const isFinished = currentIndex >= active.length || !currentRecipe;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Föreslagna av din dietist</h2>
        </div>
        {!isFinished && active.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {active.length}
          </span>
        )}
      </div>

      {isFinished ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center space-y-4">
          <p className="text-muted-foreground">
            Du har gått igenom alla förslag från din dietist!
          </p>
          {hasDismissed ? (
            <Button variant="outline" onClick={handleRestoreDismissed} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Se borttagna förslag igen
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Dina sparade recept hittar du under "Mina recept".
            </p>
          )}
        </div>
      ) : (
        <div className="relative pb-6">
          {/* Stack effect */}
          {active
            .slice(currentIndex + 1, currentIndex + 3)
            .reverse()
            .map((recipe, reverseIndex) => {
              const stackSize = Math.min(active.length - currentIndex - 1, 2);
              const i = stackSize - 1 - reverseIndex;
              return (
                <div
                  key={recipe.id}
                  className="absolute inset-x-0 top-0 bg-card rounded-xl shadow-soft border border-border/50 overflow-hidden pointer-events-none"
                  style={{
                    transform: `translateY(${(i + 1) * 16}px) scale(${1 - (i + 1) * 0.05})`,
                    zIndex: -i - 1,
                  }}
                >
                  <div className="h-48 bg-muted relative">
                    {recipe.image_url ? (
                      <img src={recipe.image_url} alt="" className="w-full h-full object-cover opacity-70" draggable={false} />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>
                  <div className="p-4 bg-card">
                    <div className="h-5 bg-muted/30 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted/20 rounded w-1/2" />
                  </div>
                </div>
              );
            })}

          <SuggestedRecipeCard
            recipe={currentRecipe}
            onSave={handleSave}
            onDismiss={handleDismiss}
            onTap={() => onRecipeSelect(currentRecipe.id)}
            disabled={isSaving || isDismissing}
          />
        </div>
      )}
    </section>
  );
}
