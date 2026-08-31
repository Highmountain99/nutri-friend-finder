import { useState } from "react";
import { ScanLine, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RecipeSearchBar } from "@/components/recipes/RecipeSearchBar";
import { RecipeSearchView } from "@/components/recipes/RecipeSearchView";
import { RecipeFiltersBar } from "@/components/recipes/RecipeFiltersBar";
import { RecipeSearchResultsList } from "@/components/recipes/RecipeSearchResultsList";
import { SuggestedRecipesSection } from "@/components/recipes/SuggestedRecipesSection";
import { MyRecipesSection } from "@/components/recipes/MyRecipesSection";
import { RecipeDetailSheet } from "@/components/recipes/RecipeDetailSheet";
import { ScannerSheet } from "@/components/scanner/ScannerSheet";
import { MyRecipesSheet } from "@/components/recipes/MyRecipesSheet";
import { ScannerHistoryProvider } from "@/contexts/ScannerHistoryContext";
import { emptyFilters, hasActiveFilters, type RecipeFilters, type RecipeSortKey } from "@/hooks/useRecipeSearch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ViewMode = "default" | "search-browse" | "search-results";

export default function Recipes() {
  return (
    <ScannerHistoryProvider>
      <RecipesContent />
    </ScannerHistoryProvider>
  );
}

function RecipesContent() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecipeFilters>(emptyFilters);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [myRecipesOpen, setMyRecipesOpen] = useState(false);
  const [browseAll, setBrowseAll] = useState(false);
  const [sort, setSort] = useState<RecipeSortKey>("rating");

  // Determine view mode
  const viewMode: ViewMode =
    browseAll || searchQuery.trim().length > 0 || hasActiveFilters(filters)
      ? "search-results"
      : isSearchFocused
        ? "search-browse"
        : "default";

  const handleRecipeIdSelect = (recipeId: string) => {
    if (selectedRecipeId && selectedRecipeId !== recipeId) {
      setSelectedRecipeId(null);
      setTimeout(() => setSelectedRecipeId(recipeId), 50);
    } else {
      setSelectedRecipeId(recipeId);
    }
  };

  const handleCuisineSelect = (cuisineId: string) => {
    setFilters({ ...emptyFilters, cuisineTypes: [cuisineId] });
  };

  const handleMealTypeSelect = (mealTypeId: string) => {
    setFilters({ ...emptyFilters, mealTypes: [mealTypeId] });
  };

  const handleCancel = () => {
    setSearchQuery("");
    setFilters(emptyFilters);
    setIsSearchFocused(false);
    setBrowseAll(false);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setSearchQuery("");
    setBrowseAll(false);
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header - only show in default mode */}
      {viewMode === "default" && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Recept</h1>
            <p className="text-sm text-muted-foreground">
              Hitta recept som passar dig
            </p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setScannerOpen(true)}>
            <ScanLine className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Search Bar + Browse all */}
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <RecipeSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            isFocused={isSearchFocused}
            onFocus={() => setIsSearchFocused(true)}
            onCancel={handleCancel}
          />
        </div>
        {viewMode !== "search-results" && !isSearchFocused && (
          <Button
            variant="outline"
            size="icon"
            data-tour="recipes-browse"
            className="rounded-full shrink-0"
            onClick={() => setBrowseAll(true)}
            aria-label="Bläddra alla recept"
          >
            <BookOpen className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* View content based on mode */}
      {viewMode === "search-browse" && (
        <RecipeSearchView
          onCuisineSelect={handleCuisineSelect}
          onMealTypeSelect={handleMealTypeSelect}
        />
      )}

      {viewMode === "search-results" && (
        <>
          <RecipeFiltersBar filters={filters} onFiltersChange={setFilters} />
          <div className="flex items-center justify-end">
            <Select value={sort} onValueChange={(v) => setSort(v as RecipeSortKey)}>
              <SelectTrigger className="h-9 w-auto min-w-[140px] rounded-full text-sm shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Bäst betyg</SelectItem>
                <SelectItem value="time">Snabbast</SelectItem>
                <SelectItem value="newest">Senaste</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <RecipeSearchResultsList
            searchQuery={searchQuery}
            filters={filters}
            browseAll={browseAll}
            sort={sort}
            onRecipeSelect={handleRecipeIdSelect}
            onClearFilters={clearFilters}
          />
        </>
      )}

      {viewMode === "default" && (
        <div className="space-y-8">
          {/* Suggested by dietitian - primary view */}
          {user && (
            <div data-tour="recipes-suggested">
              <SuggestedRecipesSection onRecipeSelect={handleRecipeIdSelect} />
            </div>
          )}

          {/* My saved recipes */}
          {user && (
            <MyRecipesSection
              onRecipeSelect={handleRecipeIdSelect}
              onViewAll={() => setMyRecipesOpen(true)}
            />
          )}
        </div>
      )}

      {/* Recipe Detail Sheet */}
      <RecipeDetailSheet
        recipeId={selectedRecipeId}
        open={!!selectedRecipeId}
        onOpenChange={(open) => {
          if (!open) setSelectedRecipeId(null);
        }}
      />

      {/* Scanner Sheet */}
      <ScannerSheet open={scannerOpen} onOpenChange={setScannerOpen} />

      {/* My Recipes Sheet */}
      <MyRecipesSheet
        open={myRecipesOpen}
        onOpenChange={setMyRecipesOpen}
        onRecipeSelect={handleRecipeIdSelect}
      />
    </div>
  );
}
