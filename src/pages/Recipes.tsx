import { useState } from "react";
import { Search, Clock, Users, Heart, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipes, useToggleFavorite } from "@/hooks/useRecipes";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const categories = ["Alla", "Frukost", "Lunch", "Middag", "Dessert"];

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

export default function Recipes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alla");
  const { user } = useAuth();
  const { data: recipes, isLoading, error } = useRecipes(activeCategory, searchQuery);
  const toggleFavorite = useToggleFavorite();

  const handleFavoriteClick = (recipeId: string, isFavorite: boolean) => {
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

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Recept</h1>
        <p className="text-sm text-muted-foreground">Hitta recept som passar dig</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Sök recept..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? "default" : "secondary"}
            className="rounded-full px-4 py-1.5 whitespace-nowrap cursor-pointer transition-colors"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Recipe Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <RecipeCardSkeleton />
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteClick(recipe.id, recipe.is_favorite);
                        }}
                      >
                        <Heart
                          className={`w-4 h-4 ${recipe.is_favorite ? "fill-current" : ""}`}
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
            {searchQuery && (
              <button
                className="text-primary underline mt-2"
                onClick={() => setSearchQuery("")}
              >
                Rensa sökning
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
