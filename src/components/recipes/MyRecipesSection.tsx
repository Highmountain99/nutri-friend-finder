import { ChevronRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyRecipes, SavedRecipe } from "@/hooks/useMyRecipes";

interface MyRecipesSectionProps {
  onRecipeSelect: (recipeId: string) => void;
  onViewAll: () => void;
}

export function MyRecipesSection({ onRecipeSelect, onViewAll }: MyRecipesSectionProps) {
  const { data: recipes, isLoading } = useMyRecipes();

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Mina recept</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-32 h-32 rounded-lg flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Mina recept</h2>
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <p className="text-muted-foreground text-sm">
            Du har inte sparat några recept ännu.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Svep höger på ett recept i Dagens tips för att spara det!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Mina recept ({recipes.length})
        </h2>
        <button
          onClick={onViewAll}
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          Se alla
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {recipes.slice(0, 5).map((recipe) => (
          <Card
            key={recipe.id}
            className="w-32 flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
            onClick={() => onRecipeSelect(recipe.id)}
          >
            <CardContent className="p-0">
              <div className="h-20 bg-muted">
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">🍽️</span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <h3 className="text-xs font-medium line-clamp-2 text-foreground">
                  {recipe.title}
                </h3>
                {recipe.time_minutes && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-1">
                    <Clock className="w-3 h-3" />
                    {recipe.time_minutes} min
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
