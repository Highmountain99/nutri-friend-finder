import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Upload, Link, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import type { Tables, Json } from "@/integrations/supabase/types";
import { RecipeFilterPanel, type RecipeFilterState, emptyFilterState } from "@/components/dietitian/recipes/RecipeFilterPanel";
import { DietitianRecipeCard } from "@/components/dietitian/recipes/DietitianRecipeCard";
import { CreateRecipeSheet, type RecipeFormData } from "@/components/dietitian/recipes/CreateRecipeSheet";
import { ImportRecipeModal } from "@/components/dietitian/recipes/ImportRecipeModal";
import { FetchRecipeFromUrlModal } from "@/components/dietitian/recipes/FetchRecipeFromUrlModal";
import { SuggestRecipeModal } from "@/components/dietitian/recipes/SuggestRecipeModal";

type Recipe = Tables<"recipes">;

export default function DietitianRecipes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<RecipeFilterState>(emptyFilterState);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFetch, setShowFetch] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [suggestRecipe, setSuggestRecipe] = useState<{ id: string; title: string; image?: string | null } | null>(null);

  // Fetch all recipes (dietitian sees all)
  const { data: recipes, isLoading } = useQuery({
    queryKey: ["dietitian-recipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Recipe[];
    },
  });

  const allRecipes = recipes || [];

  // Client-side filtering
  const filteredRecipes = allRecipes.filter((r) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const ingredientText = JSON.stringify(r.ingredients || []).toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !ingredientText.includes(q)) return false;
    }
    if (filters.cuisine_types.length > 0 && !filters.cuisine_types.some((t) => (r.cuisine_types || []).includes(t))) return false;
    if (filters.meal_types.length > 0 && !filters.meal_types.some((t) => (r.meal_types || []).includes(t))) return false;
    if (filters.health_plans.length > 0 && !filters.health_plans.some((t) => (r.health_plans || []).includes(t))) return false;
    if (filters.dietary_needs.length > 0 && !filters.dietary_needs.some((t) => (r.dietary_needs || []).includes(t))) return false;
    if (filters.allergen_free.length > 0 && !filters.allergen_free.some((t) => (r.allergen_free || []).includes(t))) return false;
    return true;
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-recipes"] });
      toast.success("Recept borttaget");
    },
    onError: () => toast.error("Kunde inte ta bort recept"),
  });

  const duplicateRecipe = useMutation({
    mutationFn: async (recipe: Recipe) => {
      const { id, created_at, updated_at, ...rest } = recipe;
      const { error } = await supabase.from("recipes").insert({
        ...rest,
        title: `${recipe.title} (kopia)`,
        is_published: false,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-recipes"] });
      toast.success("Recept duplicerat som utkast");
    },
    onError: () => toast.error("Kunde inte duplicera recept"),
  });

  const recipeToFormData = (r: Recipe): Partial<RecipeFormData> => {
    const ingredients = (r.ingredients as any[] || []).map((i: any) => ({
      amount: i.amount?.toString() || "",
      unit: i.unit || "",
      ingredient: i.ingredient || i.name || "",
    }));
    const instructions = (r.instructions as any[] || []).map((s: any) => s.text || s);
    return {
      title: r.title,
      description: r.description || "",
      imagePreview: r.image_url || "",
      imageFile: null,
      prepTimeMinutes: (r as any).prep_time_minutes || "",
      cookTimeMinutes: r.time_minutes || "",
      servings: r.servings || 4,
      ingredients: ingredients.length > 0 ? ingredients : [{ amount: "", unit: "", ingredient: "" }],
      instructions: instructions.length > 0 ? instructions : [""],
      caloriesPerServing: r.calories_per_serving || "",
      proteinPerServing: r.protein_per_serving as number || "",
      carbsPerServing: r.carbs_per_serving as number || "",
      fatPerServing: r.fat_per_serving as number || "",
      fiberPerServing: (r as any).fiber_per_serving || "",
      cuisine_types: r.cuisine_types || [],
      meal_types: r.meal_types || [],
      health_plans: r.health_plans || [],
      dietary_needs: r.dietary_needs || [],
      allergen_free: r.allergen_free || [],
      sourceUrl: r.source_url || "",
    };
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Recept</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Skapa recept
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-1.5" /> Importera recept
          </Button>
          <Button variant="outline" onClick={() => setShowFetch(true)}>
            <Link className="h-4 w-4 mr-1.5" /> Hämta från länk
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      <RecipeFilterPanel
        filters={filters}
        onChange={setFilters}
        totalCount={allRecipes.length}
        filteredCount={filteredRecipes.length}
      />

      {/* Recipe grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <UtensilsCrossed className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">Inga recept hittades</p>
          <p className="text-sm mt-1">Prova att ändra filter eller skapa ett nytt recept.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <DietitianRecipeCard
              key={recipe.id}
              recipe={recipe}
              onSuggest={(id) =>
                setSuggestRecipe({ id, title: recipe.title, image: recipe.image_url })
              }
              onEdit={(r) => setEditRecipe(r)}
              onDuplicate={(r) => duplicateRecipe.mutate(r)}
              onDelete={(id) => {
                if (confirm("Vill du verkligen ta bort detta recept?")) {
                  deleteRecipe.mutate(id);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateRecipeSheet open={showCreate} onOpenChange={setShowCreate} />

      {editRecipe && (
        <CreateRecipeSheet
          open={!!editRecipe}
          onOpenChange={(o) => { if (!o) setEditRecipe(null); }}
          initialData={recipeToFormData(editRecipe)}
          editId={editRecipe.id}
        />
      )}

      <ImportRecipeModal open={showImport} onOpenChange={setShowImport} />
      <FetchRecipeFromUrlModal open={showFetch} onOpenChange={setShowFetch} />

      {suggestRecipe && (
        <SuggestRecipeModal
          open={!!suggestRecipe}
          onOpenChange={(o) => { if (!o) setSuggestRecipe(null); }}
          recipeId={suggestRecipe.id}
          recipeTitle={suggestRecipe.title}
          recipeImage={suggestRecipe.image}
        />
      )}
    </div>
  );
}
