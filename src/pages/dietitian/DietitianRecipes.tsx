import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload, Link, UtensilsCrossed, Send, X } from "lucide-react";
import { toast } from "sonner";
import type { Tables, Json } from "@/integrations/supabase/types";
import { RecipeFilterPanel, type RecipeFilterState, emptyFilterState, type RecipeSortOption } from "@/components/dietitian/recipes/RecipeFilterPanel";
import { DietitianRecipeCard } from "@/components/dietitian/recipes/DietitianRecipeCard";
import { CreateRecipeSheet, type RecipeFormData } from "@/components/dietitian/recipes/CreateRecipeSheet";
import { ImportRecipeModal } from "@/components/dietitian/recipes/ImportRecipeModal";
import { FetchRecipeFromUrlModal } from "@/components/dietitian/recipes/FetchRecipeFromUrlModal";
import { SuggestRecipeModal } from "@/components/dietitian/recipes/SuggestRecipeModal";
import { RecipeDetailSheet } from "@/components/recipes/RecipeDetailSheet";

type Recipe = Tables<"recipes">;

export default function DietitianRecipes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [filters, setFilters] = useState<RecipeFilterState>(emptyFilterState);
  const [sortBy, setSortBy] = useState<RecipeSortOption>("newest");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFetch, setShowFetch] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [suggestRecipe, setSuggestRecipe] = useState<{ id: string; title: string; image?: string | null } | null>(null);
  const [detailRecipeId, setDetailRecipeId] = useState<string | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchSuggest, setShowBatchSuggest] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Fetch all recipes
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

  // Fetch saved/favorite recipe IDs
  const { data: favoriteIds } = useQuery({
    queryKey: ["dietitian-favorite-recipes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_favorite_recipes")
        .select("recipe_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set(data.map((f) => f.recipe_id));
    },
    enabled: !!user,
  });

  const savedIds = favoriteIds || new Set<string>();
  const allRecipes = recipes || [];

  // Tab filtering
  const tabFiltered = activeTab === "mine"
    ? allRecipes.filter((r) => r.created_by === user?.id || savedIds.has(r.id))
    : allRecipes;

  // Client-side filtering
  const filteredRecipes = tabFiltered.filter((r) => {
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

  // Sort
  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (b.created_at || "").localeCompare(a.created_at || "");
      case "oldest":
        return (a.created_at || "").localeCompare(b.created_at || "");
      case "rating":
        return (b.rating ?? 0) - (a.rating ?? 0);
      case "time_asc":
        return (a.time_minutes ?? 999) - (b.time_minutes ?? 999);
      default:
        return 0;
    }
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

  const saveToMyRecipes = useMutation({
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase.from("user_favorite_recipes").insert({
        user_id: user!.id,
        recipe_id: recipeId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-favorite-recipes"] });
      toast.success("Recept tillagt i mina recept");
    },
    onError: () => toast.error("Kunde inte spara recept"),
  });

  const removeFromMyRecipes = useMutation({
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase
        .from("user_favorite_recipes")
        .delete()
        .eq("user_id", user!.id)
        .eq("recipe_id", recipeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-favorite-recipes"] });
      toast.success("Recept borttaget från mina recept");
    },
    onError: () => toast.error("Kunde inte ta bort recept"),
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

  // Build batch recipes for suggest modal
  const batchRecipes = Array.from(selectedIds).map((id) => {
    const r = allRecipes.find((rec) => rec.id === id);
    return r ? { id: r.id, title: r.title, image: r.image_url } : null;
  }).filter(Boolean) as { id: string; title: string; image?: string | null }[];

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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "all" | "mine"); clearSelection(); }}>
         <TabsList>
           <TabsTrigger value="mine">Mina recept</TabsTrigger>
           <TabsTrigger value="all">Alla recept</TabsTrigger>
         </TabsList>
      </Tabs>

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} recept markerade
          </span>
          <Button
            size="sm"
            onClick={() => setShowBatchSuggest(true)}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Föreslå till patient
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSelection}
            className="gap-1 text-muted-foreground ml-auto"
          >
            <X className="h-3.5 w-3.5" />
            Avmarkera
          </Button>
        </div>
      )}

      {/* Filter panel */}
      <RecipeFilterPanel
        filters={filters}
        onChange={setFilters}
        totalCount={tabFiltered.length}
        filteredCount={sortedRecipes.length}
        sortBy={sortBy}
        onSortChange={setSortBy}
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
      ) : sortedRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <UtensilsCrossed className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">Inga recept hittades</p>
          <p className="text-sm mt-1">
            {activeTab === "mine"
              ? "Du har inga egna recept ännu. Skapa ett nytt eller lägg till från alla recept."
              : "Prova att ändra filter eller skapa ett nytt recept."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedRecipes.map((recipe) => {
            const isOwn = recipe.created_by === user?.id;
            const isSaved = savedIds.has(recipe.id);
            const isSelected = selectedIds.has(recipe.id);
            return (
              <DietitianRecipeCard
                key={recipe.id}
                recipe={recipe}
                isOwn={isOwn}
                isSaved={isSaved}
                isSelected={isSelected}
                onToggleSelect={() => toggleSelect(recipe.id)}
                onSuggest={(id) =>
                  setSuggestRecipe({ id, title: recipe.title, image: recipe.image_url })
                }
                onEdit={isOwn ? (r) => setEditRecipe(r) : undefined}
                onDuplicate={(r) => duplicateRecipe.mutate(r)}
                onDelete={isOwn ? (id) => {
                  if (confirm("Vill du verkligen ta bort detta recept?")) {
                    deleteRecipe.mutate(id);
                  }
                } : undefined}
                onSaveToMine={!isOwn && !isSaved ? (id) => saveToMyRecipes.mutate(id) : undefined}
                onRemoveFromMine={isSaved && !isOwn ? (id) => removeFromMyRecipes.mutate(id) : undefined}
                onOpen={(id) => setDetailRecipeId(id)}
              />
            );
          })}
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

      {/* Single recipe suggest */}
      {suggestRecipe && (
        <SuggestRecipeModal
          open={!!suggestRecipe}
          onOpenChange={(o) => { if (!o) setSuggestRecipe(null); }}
          recipeId={suggestRecipe.id}
          recipeTitle={suggestRecipe.title}
          recipeImage={suggestRecipe.image}
        />
      )}

      {/* Batch suggest */}
      {showBatchSuggest && batchRecipes.length > 0 && (
        <SuggestRecipeModal
          open={showBatchSuggest}
          onOpenChange={(o) => {
            setShowBatchSuggest(o);
            if (!o) clearSelection();
          }}
          recipes={batchRecipes}
        />
      )}

      {/* Recipe detail */}
      <RecipeDetailSheet
        recipeId={detailRecipeId}
        open={!!detailRecipeId}
        onOpenChange={(o) => { if (!o) setDetailRecipeId(null); }}
      />
    </div>
  );
}
