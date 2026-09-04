import { useState } from "react";
import { ChevronDown, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SuggestedRecipeCard } from "./SuggestedRecipeCard";
import { useAiSuggestedRecipes } from "@/hooks/useAiSuggestedRecipes";

interface AiSuggestedRecipesSectionProps {
  onRecipeSelect: (recipeId: string) => void;
}

export function AiSuggestedRecipesSection({ onRecipeSelect }: AiSuggestedRecipesSectionProps) {
  const [open, setOpen] = useState(false);
  const {
    active,
    isLoading,
    hasDismissed,
    hasSaved,
    saveRecipe,
    dismissRecipe,
    restoreDismissed,
  } = useAiSuggestedRecipes();

  const visibleCards = active.slice(0, 4);
  const isFinished = active.length === 0;

  return (
    <section className="space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-left active:scale-[0.99] transition-transform"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 shrink-0" style={{ color: "#1F3A2E" }} />
          <span className="font-semibold text-foreground truncate">Från kostcoachen</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {active.length > 0 && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: "#C6D2BA", color: "#1F3A2E" }}
            >
              {active.length}
            </span>
          )}
          <ChevronDown
            className="h-4 w-4 text-muted-foreground transition-transform"
            style={{ transform: open ? "rotate(180deg)" : undefined }}
          />
        </span>
      </button>

      {open && (
        <>
          {isLoading ? (
            <Skeleton className="h-[400px] rounded-2xl" />
          ) : isFinished ? (
            <div className="bg-muted/50 rounded-2xl p-8 text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                {hasDismissed || hasSaved
                  ? "Du har gått igenom alla förslag från kostcoachen."
                  : "Fråga kostcoachen i chatten om recept, så dyker förslagen upp här."}
              </p>
              {hasDismissed && (
                <Button variant="outline" onClick={() => restoreDismissed()} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Se borttagna förslag igen
                </Button>
              )}
            </div>
          ) : (
            <div
              className="relative"
              style={{ paddingBottom: `${Math.min(visibleCards.length - 1, 3) * 12}px` }}
            >
              {visibleCards.map((recipe, idx) => {
                if (idx !== 0) {
                  return (
                    <div
                      key={recipe.suggestion_id}
                      className="absolute inset-x-0 top-0 rounded-xl border border-border/40 overflow-hidden pointer-events-none bg-card"
                      style={{
                        transform: `translateY(${idx * 12}px) scale(${1 - idx * 0.04})`,
                        zIndex: -idx,
                        filter: `brightness(${1 - idx * 0.06})`,
                      }}
                    >
                      <div className="h-48 bg-muted">
                        {recipe.image_url && (
                          <img
                            src={recipe.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-1 text-base">
                          {recipe.title}
                        </h3>
                      </div>
                    </div>
                  );
                }

                return (
                  <SuggestedRecipeCard
                    key={recipe.suggestion_id}
                    recipe={recipe}
                    onSave={() => saveRecipe(recipe.suggestion_id)}
                    onDismiss={() => dismissRecipe(recipe.suggestion_id)}
                    onTap={() => onRecipeSelect(recipe.id)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
