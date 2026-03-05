import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardPaste, Upload, Files, Loader2 } from "lucide-react";
import { parseRecipeText, type ParsedRecipe } from "@/lib/recipeParser";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface ImportRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportRecipeModal({ open, onOpenChange }: ImportRecipeModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pasteText, setPasteText] = useState("");
  const [parsed, setParsed] = useState<Partial<ParsedRecipe>[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [importing, setImporting] = useState(false);

  const handleParseText = () => {
    // Try splitting on double newlines to detect multiple recipes
    const blocks = pasteText.split(/\n{3,}/);
    const results = blocks.map((block) => parseRecipeText(block)).filter((r) => r.title);
    if (results.length === 0) {
      // Treat entire text as single recipe
      const single = parseRecipeText(pasteText);
      if (single.title) {
        setParsed([single]);
        setSelected([true]);
      } else {
        toast.error("Kunde inte tolka receptet. Kontrollera formatet.");
      }
    } else {
      setParsed(results);
      setSelected(results.map(() => true));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const results: Partial<ParsedRecipe>[] = [];
    for (const file of Array.from(files)) {
      if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const text = await file.text();
        const parsed = parseRecipeText(text);
        if (parsed.title) results.push(parsed);
      } else {
        toast.info(`${file.name}: Formatet stöds inte ännu (bara .txt)`);
      }
    }
    if (results.length > 0) {
      setParsed(results);
      setSelected(results.map(() => true));
    } else {
      toast.error("Inga recept hittades i filerna.");
    }
  };

  const handleImport = async () => {
    const toImport = parsed.filter((_, i) => selected[i]);
    if (toImport.length === 0) return;
    setImporting(true);
    try {
      const inserts = toImport.map((r) => ({
        title: r.title || "Namnlöst recept",
        description: r.description || null,
        time_minutes: r.cookTimeMinutes || null,
        prep_time_minutes: r.prepTimeMinutes || null,
        servings: r.servings || null,
        ingredients: (r.ingredients || []).map((i) => ({
          amount: i.amount,
          unit: i.unit,
          ingredient: i.ingredient,
        })) as Json,
        instructions: (r.instructions || []).map((s, i) => ({
          step: i + 1,
          text: s,
        })) as Json,
        calories_per_serving: r.caloriesPerServing || null,
        protein_per_serving: r.proteinPerServing || null,
        carbs_per_serving: r.carbsPerServing || null,
        fat_per_serving: r.fatPerServing || null,
        fiber_per_serving: r.fiberPerServing || null,
        is_published: false,
        created_by: user!.id,
      }));

      const { error } = await supabase.from("recipes").insert(inserts);
      if (error) throw error;

      toast.success(`${toImport.length} recept importerade som utkast!`);
      queryClient.invalidateQueries({ queryKey: ["dietitian-recipes"] });
      setParsed([]);
      setSelected([]);
      setPasteText("");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Kunde inte importera recept");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Importera recept</DialogTitle>
        </DialogHeader>

        {parsed.length === 0 ? (
          <Tabs defaultValue="paste">
            <TabsList className="w-full">
              <TabsTrigger value="paste" className="flex-1 gap-1.5"><ClipboardPaste className="h-3.5 w-3.5" /> Klistra in text</TabsTrigger>
              <TabsTrigger value="file" className="flex-1 gap-1.5"><Upload className="h-3.5 w-3.5" /> Ladda upp fil</TabsTrigger>
              <TabsTrigger value="multi" className="flex-1 gap-1.5"><Files className="h-3.5 w-3.5" /> Flera filer</TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-3 mt-4">
              <Textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Klistra in ditt recept här...\n\nTitel: Kycklinggryta med ris\nPortioner: 4\nTid: 30 min\n\nIngredienser:\n400g kycklingbröst\n2 dl kokosmjölk\n\nGör så här:\n1. Skär kycklingen i bitar\n2. Stek i olivolja`}
                rows={12}
              />
              <Button className="w-full" onClick={handleParseText} disabled={!pasteText.trim()}>
                Tolka recept
              </Button>
            </TabsContent>

            <TabsContent value="file" className="space-y-3 mt-4">
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-accent/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">Dra fil hit eller klicka</span>
                <span className="text-xs text-muted-foreground">.txt stöds</span>
                <input type="file" accept=".txt,.md" className="hidden" onChange={handleFileUpload} />
              </label>
            </TabsContent>

            <TabsContent value="multi" className="space-y-3 mt-4">
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-accent/50 transition-colors">
                <Files className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">Välj flera filer</span>
                <input type="file" accept=".txt,.md" multiple className="hidden" onChange={handleFileUpload} />
              </label>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {parsed.length} recept tolkade. Välj vilka som ska importeras:
            </p>
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {parsed.map((r, i) => (
                <label key={i} className="flex items-start gap-2 p-2 rounded-lg border cursor-pointer hover:bg-accent/30">
                  <Checkbox
                    checked={selected[i]}
                    onCheckedChange={(checked) =>
                      setSelected((s) => s.map((v, j) => (j === i ? !!checked : v)))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{r.title || "Namnlöst"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.ingredients?.length || 0} ingredienser · {r.instructions?.length || 0} steg
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setParsed([]); setSelected([]); }}>
                Tillbaka
              </Button>
              <Button className="flex-1" onClick={handleImport} disabled={importing || selected.every((s) => !s)}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Importera ${selected.filter(Boolean).length} recept`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
