import { Clock, Users, Heart, Leaf, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipeSearch, type RecipeFilters, type RecipeSortKey, type RecipeWithFavorite } from "@/hooks/useRecipeSearch";
import { useToggleFavorite } from "@/hooks/useRecipes";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RecipeSearchResultsListProps {
  searchQuery: string;
  filters: RecipeFilters;
  onRecipeSelect: (recipeId: string) => void;
  onClearFilters: () => void;
  browseAll?: boolean;
  sort?: RecipeSortKey;
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

// Filter label mapping
const filterLabels: Record<string, Record<string, string>> = {
  cuisineTypes: {
    mediterranean: "Medelhav",
    asian: "Asiatiskt",
    swedish: "Svenskt",
    mexican: "Mexikanskt",
    italian: "Italienskt",
    indian: "Indiskt",
  },
  mealTypes: {
    breakfast: "Frukost",
    lunch: "Lunch",
    dinner: "Middag",
    salad: "Sallad",
    soup: "Soppa",
    main_course: "Huvudrätt",
    appetizer: "Förrätt",
  },
  healthPlans: {
    low_carb: "Låga kolhydrater",
    high_fiber: "Högt fiber",
    high_protein: "Högt protein",
    mediterranean: "Medelhavs",
    heart_friendly: "Bra för hjärta",
    low_sodium: "Lågt sodium",
    kidney_friendly: "Bra för njurar",
    diabetic_friendly: "Bra för diabetes",
  },
  dietaryNeeds: {
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    pescitarian: "Pescitarian",
    keto: "Keto",
    paleo: "Paleo",
    kosher: "Kosher",
  },
  allergenFree: {
    lactose_free: "Laktosfri",
    gluten_free: "Glutenfri",
    soy_free: "Sojafri",
    egg_free: "Äggfri",
    shellfish_free: "Skaldjursfri",
    peanut_free: "Jordnötsfri",
    nut_free: "Nötfri",
    sesame_free: "Sesamfri",
    sulfite_free: "Sulfitfri",
    fodmap_free: "FODMAPfri",
  },
};

export function RecipeSearchResultsList({
  searchQuery,
  filters,
  onRecipeSelect,
  onClearFilters,
  browseAll = false,
  sort = "rating",
}: RecipeSearchResultsListProps) {
  const { user } = useAuth();
  const { data: recipes, isLoading, error } = useRecipeSearch(searchQuery, filters, browseAll, sort);
  const toggleFavorite = useToggleFavorite();

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

  // Get all active filter chips
  const activeFilterChips: { key: string; category: string; id: string; label: string }[] = [];
  
  Object.entries(filters).forEach(([category, values]) => {
    if (Array.isArray(values)) {
      values.forEach((id) => {
        const label = filterLabels[category]?.[id] || id;
        activeFilterChips.push({ key: `${category}-${id}`, category, id, label });
      });
    }
  });

  return (
    <div className="space-y-4">
      {/* Active filter chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilterChips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="rounded-full pl-2 pr-1 py-1 flex items-center gap-1"
            >
              <span>{chip.label}</span>
              <button
                className="w-4 h-4 rounded-full hover:bg-muted flex items-center justify-center"
                onClick={() => {
                  // Remove this specific filter
                  const currentValues = filters[chip.category as keyof RecipeFilters] as string[];
                  const newFilters = {
                    ...filters,
                    [chip.category]: currentValues.filter((v) => v !== chip.id),
                  };
                  onClearFilters(); // We'll need to update this to accept partial clear
                }}
              >
                <X className="w-3 h-3" />
              </button>
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
      ) : recipes && recipes.length > 0 ? (
        recipes.map((recipe) => (
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
