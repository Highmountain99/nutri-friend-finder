import { Clock, Users, Heart, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipes, useToggleFavorite, RecipeWithFavorite } from "@/hooks/useRecipes";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RecipeSearchResultsProps {
  searchQuery: string;
  cuisineType?: string;
  mealType?: string;
  onRecipeSelect: (recipeId: string) => void;
  onClearFilters: () => void;
}

function formatTime(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function RecipeCardSkeleton() {
  return (
    <Card className="shadow-soft overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          <Skeleton className="w-24 h-24 flex-shrink-0" />
          <div className="flex-1 p-3 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-1.5 mt-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecipeSearchResults({
  searchQuery,
  cuisineType,
  mealType,
  onRecipeSelect,
  onClearFilters,
}: RecipeSearchResultsProps) {
  const { user } = useAuth();
  
  // Map cuisine/meal type to category for existing hook
  const category = mealType 
    ? mealType.charAt(0).toUpperCase() + mealType.slice(1)
    : undefined;
  
  const { data: recipes, isLoading, error } = useRecipes(category, searchQuery);
  const toggleFavorite = useToggleFavorite();

  // Filter by cuisine type if provided
  const filteredRecipes = cuisineType
    ? recipes?.filter((r) => 
        r.tags?.some((tag) => tag.toLowerCase().includes(cuisineType.toLowerCase()))
      )
    : recipes;

  const handleFavoriteClick = (
    e: React.MouseEvent,
    recipeId: string,
    isFavorite: boolean
  ) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Logga in för att spara favoriter");
      return;
    }

    toggleFavorite.mutate(
      { recipeId, isFavorite },
      {
        onSuccess: () => {
          toast.success(isFavorite ? "Borttagen från favoriter" : "Tillagd i favoriter");
        },
        onError: () => {
          toast.error("Kunde inte uppdatera favorit");
        },
      }
    );
  };

  // Active filter badges
  const activeFilters = [
    cuisineType && { key: "cuisine", label: cuisineType },
    mealType && { key: "meal", label: mealType },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="space-y-4">
      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filter:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="rounded-full cursor-pointer"
              onClick={onClearFilters}
            >
              {filter.label} ×
            </Badge>
          ))}
          <button
            className="text-sm text-primary underline"
            onClick={onClearFilters}
          >
            Rensa alla
          </button>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <>
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
        </>
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Kunde inte ladda recept</p>
        </div>
      ) : filteredRecipes && filteredRecipes.length > 0 ? (
        filteredRecipes.map((recipe) => (
          <Card
            key={recipe.id}
            className="shadow-soft overflow-hidden cursor-pointer hover:shadow-elevated transition-shadow"
            onClick={() => onRecipeSelect(recipe.id)}
          >
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-24 h-24 bg-muted flex-shrink-0 relative">
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">Ingen bild</span>
                    </div>
                  )}
                  {recipe.is_climate_smart && (
                    <div className="absolute top-1 left-1 bg-primary/90 rounded-full p-1">
                      <Leaf className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground line-clamp-1 pr-2">
                      {recipe.title}
                    </h3>
                    <button
                      className={`transition-colors flex-shrink-0 ${
                        recipe.is_favorite
                          ? "text-accent"
                          : "text-muted-foreground hover:text-accent"
                      }`}
                      onClick={(e) =>
                        handleFavoriteClick(e, recipe.id, recipe.is_favorite)
                      }
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          recipe.is_favorite ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {recipe.time_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(recipe.time_minutes)}
                      </span>
                    )}
                    {recipe.servings && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {recipe.servings} port
                      </span>
                    )}
                    {recipe.rating && (
                      <span className="flex items-center gap-1">
                        ⭐ {recipe.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {recipe.tags?.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] px-2 py-0.5"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Inga recept hittades</p>
          <button
            className="text-primary underline mt-2"
            onClick={onClearFilters}
          >
            Rensa sökning
          </button>
        </div>
      )}
    </div>
  );
}
