import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Link, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { autoSuggestTags } from "@/lib/recipeParser";
import { CreateRecipeSheet, type RecipeFormData } from "./CreateRecipeSheet";

interface FetchRecipeFromUrlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FetchRecipeFromUrlModal({ open, onOpenChange }: FetchRecipeFromUrlModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<RecipeFormData> | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const getDomain = (url: string) => {
    try {
      return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    } catch {
      return url;
    }
  };

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-recipe", {
        body: { url: url.trim() },
      });

      if (error) throw error;
      if (!data?.success) {
        toast.error(data?.error || "Kunde inte hämta receptet");
        return;
      }

      const r = data.recipe;
      const suggested = autoSuggestTags(r);

      setFormData({
        title: r.title || "",
        description: r.description || "",
        imagePreview: r.imageUrl || "",
        imageFile: null,
        prepTimeMinutes: r.prepTimeMinutes || "",
        cookTimeMinutes: r.cookTimeMinutes || "",
        servings: r.servings || 4,
        ingredients: (r.ingredients || []).map((i: any) => ({
          amount: i.amount?.toString() || "",
          unit: i.unit || "",
          ingredient: i.ingredient || "",
        })),
        instructions: r.instructions || [""],
        caloriesPerServing: r.caloriesPerServing || "",
        proteinPerServing: r.proteinPerServing || "",
        carbsPerServing: r.carbsPerServing || "",
        fatPerServing: r.fatPerServing || "",
        fiberPerServing: r.fiberPerServing || "",
        sourceUrl: url.trim(),
        ...suggested,
      });
      setShowEditor(true);
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Kunde inte hämta receptet. Prova att klistra in det manuellt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hämta recept från länk</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Klistra in länk till recept..."
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Fungerar med Köket, Tasteline, Recept.se, HelloFresh, Mathem, Lidl, Coop, Zeta,
                matbloggar m.fl. Saknas näringsvärden görs en uppskattning.
              </p>
            </div>
            <Button className="w-full" onClick={handleFetch} disabled={!url.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Hämtar recept från {getDomain(url)}...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Hämta recept
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {formData && (
        <CreateRecipeSheet
          open={showEditor}
          onOpenChange={(o) => {
            setShowEditor(o);
            if (!o) setFormData(null);
          }}
          initialData={formData}
        />
      )}
    </>
  );
}
