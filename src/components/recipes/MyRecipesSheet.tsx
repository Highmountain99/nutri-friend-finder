import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRecipes, SavedRecipe } from "@/hooks/useMyRecipes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

interface MyRecipesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecipeSelect: (recipeId: string) => void;
}

export function MyRecipesSheet({ open, onOpenChange, onRecipeSelect }: MyRecipesSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: recipes, isLoading } = useMyRecipes();

  const removeMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase
        .from("user_recipe_interactions")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId)
        .eq("status", "saved");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRecipes"] });
      toast.success("Recept borttaget");
    },
    onError: () => toast.error("Kunde inte ta bort receptet"),
  });

  const handleRecipeClick = (recipeId: string) => {
    onRecipeSelect(recipeId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 flex flex-col">
        <SheetHeader className="px-4 pt-5 pb-3 border-b">
          <SheetTitle className="text-lg">Mina recept ({recipes?.length || 0})</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : !recipes || recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <UtensilsCrossed className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium text-sm">Inga sparade recept</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  {/* Clickable area */}
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleRecipeClick(recipe.id)}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                        {recipe.title}
                      </h3>
                      {recipe.time_minutes && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {recipe.time_minutes} min
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMutation.mutate(recipe.id);
                    }}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
