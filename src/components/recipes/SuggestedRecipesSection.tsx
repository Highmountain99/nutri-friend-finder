import { RefreshCw, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SuggestedRecipeCard } from "./SuggestedRecipeCard";
import { useSuggestedRecipes } from "@/hooks/useSuggestedRecipes";

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
  } = useSuggestedRecipes();

  const handleSave = (suggestionId: string) => {
    saveRecipe(suggestionId);
  };

  const handleDismiss = (suggestionId: string) => {
    dismissRecipe(suggestionId);
  };

  const handleRestoreDismissed = () => {
    restoreDismissed();
  };

  const coachFullName = active[0]?.dietitianName || "Din coach";
  const coachFirstName = coachFullName.split(" ")[0];

  const header = (
    <div className="flex items-end justify-between gap-3">
      <h2
        className="font-serif m-0"
        style={{
          fontSize: 26,
          fontWeight: 800,
          lineHeight: 1.05,
          textTransform: "uppercase",
          color: "#1F3A2E",
          letterSpacing: "-0.01em",
        }}
      >
        Från{" "}
        <span
          style={{
            backgroundColor: "#C6D2BA",
            color: "#1F3A2E",
            borderRadius: 999,
            padding: "1px 12px 3px",
            display: "inline-block",
          }}
        >
          {coachFirstName}
        </span>{" "}
        till dig
      </h2>
      {active.length > 0 && (
        <span
          className="shrink-0 pb-0.5"
          style={{ fontSize: 13, fontWeight: 600, color: "#8A8471" }}
        >
          {active.length} kvar
        </span>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <section className="space-y-4">
        {header}
        <Skeleton className="h-[400px] rounded-2xl" />
      </section>
    );
  }

  if (active.length === 0 && !hasDismissed && !hasSaved) {
    return (
      <section className="space-y-4">
        {header}
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <UtensilsCrossed className="h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium text-sm">Inga receptförslag ännu</p>
          <p className="text-xs mt-1 text-center max-w-[250px]">
            Din coach kan föreslå recept som passar just dig.
          </p>
        </div>
      </section>
    );
  }

  const isFinished = active.length === 0;
  // Show up to 3 stack cards behind the top card
  const visibleCards = active.slice(0, 4);

  return (
    <section className="space-y-4">
      {header}

      {isFinished ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center space-y-4">
          <p className="text-muted-foreground">Du har gått igenom alla förslag från din coach!</p>
          {hasDismissed ? (
            <Button variant="outline" onClick={handleRestoreDismissed} className="gap-2">
              <RefreshCw className="w-4 h-4" />Se borttagna förslag igen
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Dina sparade recept hittar du under "Mina recept".</p>
          )}
        </div>
      ) : (
        <div
          className="relative"
          style={{ paddingBottom: `${Math.min(visibleCards.length - 1, 3) * 12}px` }}
        >
          {/* Render cards in reverse order so the first card is on top */}
          {visibleCards.map((recipe, idx) => {
            const isTop = idx === 0;
            const depth = idx;

            if (!isTop) {
              // Background stack cards — static, non-interactive
              return (
                <div
                  key={recipe.suggestion_id}
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
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{recipe.message || recipe.description}</p>
                  </div>
                </div>
              );
            }

            // Top interactive card
            return (
              <SuggestedRecipeCard
                key={recipe.suggestion_id}
                recipe={recipe}
                onSave={() => handleSave(recipe.suggestion_id)}
                onDismiss={() => handleDismiss(recipe.suggestion_id)}
                onTap={() => onRecipeSelect(recipe.id)}
                disabled={false}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
