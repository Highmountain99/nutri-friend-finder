import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Users, UtensilsCrossed, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TAG_GROUPS } from "@/lib/recipeTags";

interface SuggestedRecipesSectionProps {
  onRecipeSelect: (recipeId: string) => void;
}

function getTagLabel(id: string): string | null {
  for (const group of Object.values(TAG_GROUPS)) {
    const opt = group.options.find((o) => o.id === id);
    if (opt) return opt.label;
  }
  return null;
}

export function SuggestedRecipesSection({ onRecipeSelect }: SuggestedRecipesSectionProps) {
  const { user } = useAuth();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["patient-suggested-recipes", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all suggestions for this patient that are still 'suggested' or 'saved'
      const { data: suggestionRows, error: sugError } = await supabase
        .from("recipe_suggestions")
        .select("id, recipe_id, message, status, created_at, dietitian_id")
        .eq("patient_id", user.id)
        .in("status", ["suggested", "saved"])
        .order("created_at", { ascending: false });

      if (sugError || !suggestionRows || suggestionRows.length === 0) return [];

      const recipeIds = suggestionRows.map((s) => s.recipe_id);

      const { data: recipes } = await supabase
        .from("recipes")
        .select("id, title, description, image_url, time_minutes, servings, cuisine_types, meal_types, health_plans, dietary_needs, allergen_free, calories_per_serving")
        .in("id", recipeIds);

      // Get dietitian names
      const dietitianIds = [...new Set(suggestionRows.map((s) => s.dietitian_id))];
      const { data: dietitianProfiles } = await supabase
        .from("dietitian_profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", dietitianIds);

      const dietitianMap = new Map(
        (dietitianProfiles || []).map((d) => [d.user_id, `${d.first_name} ${d.last_name}`])
      );

      return suggestionRows.map((s) => {
        const recipe = recipes?.find((r) => r.id === s.recipe_id);
        return {
          ...s,
          recipe,
          dietitianName: dietitianMap.get(s.dietitian_id) || "Din dietist",
        };
      }).filter((s) => s.recipe);
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Föreslagna av din dietist</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!suggestions || suggestions.length === 0) {
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
            Din dietist kan föreslå recept som passar just dig. Använd sökfunktionen för att hitta egna recept.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Föreslagna av din dietist</h2>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const recipe = suggestion.recipe!;
          const allTags = [
            ...(recipe.cuisine_types || []),
            ...(recipe.meal_types || []),
            ...(recipe.health_plans || []),
            ...(recipe.dietary_needs || []),
            ...(recipe.allergen_free || []),
          ];
          const tagLabels = allTags.map(getTagLabel).filter(Boolean).slice(0, 3);
          const extraCount = allTags.length - 3;

          return (
            <Card
              key={suggestion.id}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => onRecipeSelect(recipe.id)}
            >
              <CardContent className="p-0">
                <div className="flex">
                  {/* Image */}
                  <div className="w-28 h-28 flex-shrink-0 bg-muted">
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3 min-w-0">
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                      {recipe.title}
                    </h3>

                    <p className="text-xs text-muted-foreground mt-1">
                      Föreslagen av {suggestion.dietitianName}
                    </p>

                    {suggestion.message && (
                      <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                        "{suggestion.message}"
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {recipe.time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recipe.time_minutes} min
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {recipe.servings} port
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {tagLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tagLabels.map((label) => (
                          <Badge key={label} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {label}
                          </Badge>
                        ))}
                        {extraCount > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{extraCount}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
