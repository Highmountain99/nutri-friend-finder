import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, X, GripVertical, ClipboardPaste, ChevronDown, Camera, Loader2 } from "lucide-react";
import { TAG_GROUPS } from "@/lib/recipeTags";
import { parseIngredientList, type ParsedIngredient } from "@/lib/recipeParser";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Json } from "@/integrations/supabase/types";

const UNITS = ["g", "kg", "ml", "dl", "l", "msk", "tsk", "st", "krm"];

export interface RecipeFormData {
  title: string;
  description: string;
  imageFile: File | null;
  imagePreview: string;
  prepTimeMinutes: number | "";
  cookTimeMinutes: number | "";
  servings: number | "";
  ingredients: { amount: string; unit: string; ingredient: string }[];
  instructions: string[];
  caloriesPerServing: number | "";
  proteinPerServing: number | "";
  carbsPerServing: number | "";
  fatPerServing: number | "";
  fiberPerServing: number | "";
  cuisine_types: string[];
  meal_types: string[];
  health_plans: string[];
  dietary_needs: string[];
  allergen_free: string[];
  sourceUrl: string;
}

const emptyForm: RecipeFormData = {
  title: "",
  description: "",
  imageFile: null,
  imagePreview: "",
  prepTimeMinutes: "",
  cookTimeMinutes: "",
  servings: 4,
  ingredients: [{ amount: "", unit: "", ingredient: "" }],
  instructions: [""],
  caloriesPerServing: "",
  proteinPerServing: "",
  carbsPerServing: "",
  fatPerServing: "",
  fiberPerServing: "",
  cuisine_types: [],
  meal_types: [],
  health_plans: [],
  dietary_needs: [],
  allergen_free: [],
  sourceUrl: "",
};

interface CreateRecipeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<RecipeFormData>;
  editId?: string;
}

export function CreateRecipeSheet({ open, onOpenChange, initialData, editId }: CreateRecipeSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RecipeFormData>({ ...emptyForm, ...initialData });
  const [saving, setSaving] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [nutritionOpen, setNutritionOpen] = useState(false);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setShowPaste(false);
    setPasteText("");
  };

  const updateField = <K extends keyof RecipeFormData>(key: K, value: RecipeFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addIngredient = () =>
    updateField("ingredients", [...form.ingredients, { amount: "", unit: "", ingredient: "" }]);

  const removeIngredient = (i: number) =>
    updateField("ingredients", form.ingredients.filter((_, j) => j !== i));

  const updateIngredient = (i: number, field: string, value: string) =>
    updateField(
      "ingredients",
      form.ingredients.map((ing, j) => (j === i ? { ...ing, [field]: value } : ing))
    );

  const addInstruction = () => updateField("instructions", [...form.instructions, ""]);
  const removeInstruction = (i: number) =>
    updateField("instructions", form.instructions.filter((_, j) => j !== i));
  const updateInstruction = (i: number, value: string) =>
    updateField("instructions", form.instructions.map((s, j) => (j === i ? value : s)));

  const handlePasteIngredients = () => {
    const parsed = parseIngredientList(pasteText);
    const mapped = parsed.map((p: ParsedIngredient) => ({
      amount: p.amount?.toString() || "",
      unit: p.unit || "",
      ingredient: p.ingredient,
    }));
    updateField("ingredients", [...form.ingredients.filter((i) => i.ingredient), ...mapped]);
    setShowPaste(false);
    setPasteText("");
    toast.success(`${mapped.length} ingredienser tillagda`);
  };

  const toggleTag = (group: string, tagId: string) => {
    const key = TAG_GROUPS.find((g) => g.key === group)?.dbColumn as keyof RecipeFormData;
    if (!key) return;
    const arr = form[key] as string[];
    const next = arr.includes(tagId) ? arr.filter((t) => t !== tagId) : [...arr, tagId];
    updateField(key, next as any);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateField("imageFile", file);
    updateField("imagePreview", URL.createObjectURL(file));
  };

  const handleSave = async (publish: boolean) => {
    if (!form.title.trim()) {
      toast.error("Titel krävs");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = form.imagePreview;

      // Upload image if file selected
      if (form.imageFile) {
        const ext = form.imageFile.name.split(".").pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("recipe-images")
          .upload(path, form.imageFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("recipe-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const ingredientsList: Json = form.ingredients
        .filter((i) => i.ingredient.trim())
        .map((i) => ({
          amount: parseFloat(i.amount) || null,
          unit: i.unit,
          ingredient: i.ingredient.trim(),
        }));
      const instructionsList: Json = form.instructions.filter(Boolean).map((s, i) => ({
        step: i + 1,
        text: s.trim(),
      }));

      const recipeData = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        image_url: imageUrl || null,
        prep_time_minutes: form.prepTimeMinutes || null,
        time_minutes: form.cookTimeMinutes || null,
        servings: form.servings || null,
        ingredients: ingredientsList,
        instructions: instructionsList,
        calories_per_serving: form.caloriesPerServing ? Math.round(Number(form.caloriesPerServing)) : null,
        protein_per_serving: form.proteinPerServing || null,
        carbs_per_serving: form.carbsPerServing || null,
        fat_per_serving: form.fatPerServing || null,
        fiber_per_serving: form.fiberPerServing || null,
        cuisine_types: form.cuisine_types,
        meal_types: form.meal_types,
        health_plans: form.health_plans,
        dietary_needs: form.dietary_needs,
        allergen_free: form.allergen_free,
        source_url: form.sourceUrl || null,
        is_published: publish,
        created_by: user!.id,
      };

      if (editId) {
        const { error } = await supabase.from("recipes").update(recipeData).eq("id", editId);
        if (error) throw error;
        toast.success("Recept uppdaterat!");
      } else {
        const { error } = await supabase.from("recipes").insert(recipeData);
        if (error) throw error;
        toast.success(publish ? "Recept publicerat!" : "Utkast sparat!");
      }

      queryClient.invalidateQueries({ queryKey: ["dietitian-recipes"] });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Kunde inte spara recept");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editId ? "Redigera recept" : "Skapa recept"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6 pb-24">
          {/* Basic info */}
          <div className="space-y-3">
            <div>
              <Label>Titel *</Label>
              <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Receptets namn" />
            </div>
            <div>
              <Label>Beskrivning</Label>
              <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Kort beskrivning..." rows={2} />
            </div>
          </div>

          {/* Image */}
          <div>
            <Label>Bild</Label>
            <label className="mt-1 flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden">
              {form.imagePreview ? (
                <img src={form.imagePreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-xs">Klicka eller dra bild hit</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          {/* Time & servings */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Förberedelsetid (min)</Label>
              <Input type="number" value={form.prepTimeMinutes} onChange={(e) => updateField("prepTimeMinutes", e.target.value ? +e.target.value : "")} />
            </div>
            <div>
              <Label>Tillagningstid (min)</Label>
              <Input type="number" value={form.cookTimeMinutes} onChange={(e) => updateField("cookTimeMinutes", e.target.value ? +e.target.value : "")} />
            </div>
            <div>
              <Label>Portioner</Label>
              <Input type="number" value={form.servings} onChange={(e) => updateField("servings", e.target.value ? +e.target.value : "")} />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Ingredienser</Label>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowPaste(!showPaste)}>
                <ClipboardPaste className="h-3.5 w-3.5 mr-1" /> Klistra in lista
              </Button>
            </div>
            {showPaste && (
              <div className="mb-3 space-y-2">
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={"400g kycklingbröst\n2 dl grädde\n1 msk olivolja"}
                  rows={4}
                />
                <Button size="sm" onClick={handlePasteIngredients} disabled={!pasteText.trim()}>
                  Tolka lista
                </Button>
              </div>
            )}
            {form.ingredients.map((ing, i) => (
              <div key={i} className="grid grid-cols-[70px_90px_1fr_28px] gap-2 mb-2">
                <Input placeholder="Mängd" value={ing.amount} onChange={(e) => updateIngredient(i, "amount", e.target.value)} className="h-9" />
                <Select value={ing.unit} onValueChange={(v) => updateIngredient(i, "unit", v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Enhet" /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Ingrediens" value={ing.ingredient} onChange={(e) => updateIngredient(i, "ingredient", e.target.value)} className="h-9" />
                <Button variant="ghost" size="icon" className="h-9 w-7 text-destructive" onClick={() => removeIngredient(i)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addIngredient}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ingrediens
            </Button>
          </div>

          {/* Instructions */}
          <div>
            <Label className="mb-2 block">Instruktioner</Label>
            {form.instructions.map((step, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <GripVertical className="h-4 w-4 mt-2.5 text-muted-foreground/50 shrink-0" />
                <span className="text-xs text-muted-foreground mt-2.5 w-5 shrink-0">{i + 1}.</span>
                <Textarea value={step} onChange={(e) => updateInstruction(i, e.target.value)} placeholder={`Steg ${i + 1}`} rows={2} className="min-h-[60px]" />
                <Button variant="ghost" size="icon" className="h-8 w-7 mt-1 text-destructive shrink-0" onClick={() => removeInstruction(i)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addInstruction}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Steg
            </Button>
          </div>

          {/* Nutrition */}
          <Collapsible open={nutritionOpen} onOpenChange={setNutritionOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-sm font-medium">
                Näringsvärden per portion
                <ChevronDown className={`h-4 w-4 transition-transform ${nutritionOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="grid grid-cols-5 gap-2">
                <div><Label className="text-xs">Kcal</Label><Input type="number" value={form.caloriesPerServing} onChange={(e) => updateField("caloriesPerServing", e.target.value ? +e.target.value : "")} className="h-9" /></div>
                <div><Label className="text-xs">Protein (g)</Label><Input type="number" value={form.proteinPerServing} onChange={(e) => updateField("proteinPerServing", e.target.value ? +e.target.value : "")} className="h-9" /></div>
                <div><Label className="text-xs">Kolhydr. (g)</Label><Input type="number" value={form.carbsPerServing} onChange={(e) => updateField("carbsPerServing", e.target.value ? +e.target.value : "")} className="h-9" /></div>
                <div><Label className="text-xs">Fett (g)</Label><Input type="number" value={form.fatPerServing} onChange={(e) => updateField("fatPerServing", e.target.value ? +e.target.value : "")} className="h-9" /></div>
                <div><Label className="text-xs">Fiber (g)</Label><Input type="number" value={form.fiberPerServing} onChange={(e) => updateField("fiberPerServing", e.target.value ? +e.target.value : "")} className="h-9" /></div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Tags */}
          <div>
            <h3 className="font-semibold text-sm mb-1">Kategorisera receptet</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Välj alla taggar som stämmer. Taggarna gör det enkelt att filtrera och föreslå rätt recept.
            </p>
            <div className="space-y-4">
              {TAG_GROUPS.map((group) => (
                <div key={group.key}>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.options.map((opt) => {
                      const col = group.dbColumn as keyof RecipeFormData;
                      const isActive = (form[col] as string[]).includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleTag(group.key, opt.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-accent"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source URL (if imported) */}
          {form.sourceUrl && (
            <div>
              <Label>Källa</Label>
              <Input value={form.sourceUrl} onChange={(e) => updateField("sourceUrl", e.target.value)} />
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="fixed bottom-0 right-0 w-full sm:max-w-2xl bg-background border-t p-4 flex items-center gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Spara som utkast"}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicera recept"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
