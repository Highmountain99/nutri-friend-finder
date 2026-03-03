import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignedPatients } from "@/hooks/dietitian/useAssignedPatients";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Send, UtensilsCrossed, Search, Clock, MoreVertical, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

const categoryOptions = [
  "FODMAP-vänlig", "Glutenfri", "Laktosfri", "Vegansk", "Vegetarisk", "Snabb", "Budgetvänlig",
];

export default function DietitianRecipes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: patients } = useAssignedPatients();
  const [showCreate, setShowCreate] = useState(false);
  const [suggestRecipeId, setSuggestRecipeId] = useState<string | null>(null);
  const [suggestPatientIds, setSuggestPatientIds] = useState<string[]>([]);
  const [suggestMessage, setSuggestMessage] = useState("");
  const [viewMode, setViewMode] = useState<"mine" | "all">("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  const { data: myRecipes, isLoading: myLoading } = useQuery({
    queryKey: ["dietitian-recipes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes").select("*").eq("created_by", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: allRecipes, isLoading: allLoading } = useQuery({
    queryKey: ["all-recipes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    enabled: viewMode === "all",
  });

  const recipes = viewMode === "mine" ? myRecipes : allRecipes;
  const isLoading = viewMode === "mine" ? myLoading : allLoading;

  const filteredRecipes = (recipes ?? []).filter((r) => {
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterCategory && !(r.tags ?? []).some((t: string) => t.toLowerCase().includes(filterCategory.toLowerCase())) && !(r.dietary_needs ?? []).some((d: string) => d.toLowerCase().includes(filterCategory.toLowerCase()))) return false;
    return true;
  });

  const [form, setForm] = useState({
    title: "", description: "", time_minutes: 30, servings: 2,
    calories_per_serving: 0, protein_per_serving: 0, carbs_per_serving: 0, fat_per_serving: 0,
    ingredients: [{ amount: "", unit: "", name: "" }],
    instructions: [""],
    tags: [] as string[],
  });

  const addIngredient = () => setForm((f) => ({ ...f, ingredients: [...f.ingredients, { amount: "", unit: "", name: "" }] }));
  const addInstruction = () => setForm((f) => ({ ...f, instructions: [...f.instructions, ""] }));
  const toggleTag = (tag: string) => setForm((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }));

  const createRecipe = useMutation({
    mutationFn: async () => {
      const ingredientsList: Json = form.ingredients.filter((i) => i.name.trim()).map((i) => ({ name: i.name, amount: `${i.amount} ${i.unit}`.trim() }));
      const instructionsList: Json = form.instructions.filter(Boolean).map((s, i) => ({ step: i + 1, text: s.trim() }));
      const { error } = await supabase.from("recipes").insert({
        title: form.title, description: form.description, time_minutes: form.time_minutes, servings: form.servings,
        calories_per_serving: form.calories_per_serving, protein_per_serving: form.protein_per_serving,
        carbs_per_serving: form.carbs_per_serving, fat_per_serving: form.fat_per_serving,
        ingredients: ingredientsList, instructions: instructionsList, created_by: user!.id,
        tags: form.tags, dietary_needs: form.tags,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["all-recipes"] });
      setShowCreate(false);
      setForm({ title: "", description: "", time_minutes: 30, servings: 2, calories_per_serving: 0, protein_per_serving: 0, carbs_per_serving: 0, fat_per_serving: 0, ingredients: [{ amount: "", unit: "", name: "" }], instructions: [""], tags: [] });
      toast.success("Recept skapat!");
    },
    onError: () => toast.error("Kunde inte skapa recept"),
  });

  const suggestRecipe = useMutation({
    mutationFn: async () => {
      const inserts = suggestPatientIds.map((pid) => ({
        user_id: pid, recipe_id: suggestRecipeId!, source: "dietitian" as const,
        dietitian_id: user!.id, status: "suggested",
      }));
      const { error } = await supabase.from("user_recipe_interactions").insert(inserts);
      if (error) throw error;

      // Also send chat message if there's a message
      if (suggestMessage.trim()) {
        for (const pid of suggestPatientIds) {
          await supabase.from("chat_messages").insert({
            user_id: pid, sender: "dietitian", content: suggestMessage.trim(),
            conversation_type: "dietitian",
          });
        }
      }
    },
    onSuccess: () => {
      setSuggestRecipeId(null);
      setSuggestPatientIds([]);
      setSuggestMessage("");
      toast.success("Recept föreslaget till patient(er)!");
    },
    onError: () => toast.error("Kunde inte föreslå recept"),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recept</h1>
          <p className="text-muted-foreground">Skapa, hantera och föreslå recept till patienter.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Nytt recept</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
            <DialogHeader><DialogTitle>Skapa recept</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Beskrivning" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Tid (min)" value={form.time_minutes} onChange={(e) => setForm({ ...form, time_minutes: +e.target.value })} />
                <Input type="number" placeholder="Portioner" value={form.servings} onChange={(e) => setForm({ ...form, servings: +e.target.value })} />
              </div>
              {/* Tags */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Kategorier</p>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((c) => (
                    <Badge key={c} variant={form.tags.includes(c) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTag(c)}>
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
              {/* Ingredients */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Ingredienser</p>
                {form.ingredients.map((ing, i) => (
                  <div key={i} className="grid grid-cols-[60px_60px_1fr] gap-2 mb-2">
                    <Input placeholder="Mängd" value={ing.amount} onChange={(e) => setForm((f) => ({ ...f, ingredients: f.ingredients.map((ig, j) => j === i ? { ...ig, amount: e.target.value } : ig) }))} />
                    <Input placeholder="Enhet" value={ing.unit} onChange={(e) => setForm((f) => ({ ...f, ingredients: f.ingredients.map((ig, j) => j === i ? { ...ig, unit: e.target.value } : ig) }))} />
                    <Input placeholder="Ingrediens" value={ing.name} onChange={(e) => setForm((f) => ({ ...f, ingredients: f.ingredients.map((ig, j) => j === i ? { ...ig, name: e.target.value } : ig) }))} />
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addIngredient}><Plus className="h-3 w-3 mr-1" /> Ingrediens</Button>
              </div>
              {/* Instructions */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Instruktioner</p>
                {form.instructions.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span className="text-xs text-muted-foreground mt-2.5 w-5 shrink-0">{i + 1}.</span>
                    <Textarea placeholder={`Steg ${i + 1}`} value={step} onChange={(e) => setForm((f) => ({ ...f, instructions: f.instructions.map((s, j) => j === i ? e.target.value : s) }))} rows={2} />
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addInstruction}><Plus className="h-3 w-3 mr-1" /> Steg</Button>
              </div>
              {/* Nutrition */}
              <div className="grid grid-cols-4 gap-2">
                <Input type="number" placeholder="Kcal" value={form.calories_per_serving} onChange={(e) => setForm({ ...form, calories_per_serving: +e.target.value })} />
                <Input type="number" placeholder="Protein" value={form.protein_per_serving} onChange={(e) => setForm({ ...form, protein_per_serving: +e.target.value })} />
                <Input type="number" placeholder="Kolhydr." value={form.carbs_per_serving} onChange={(e) => setForm({ ...form, carbs_per_serving: +e.target.value })} />
                <Input type="number" placeholder="Fett" value={form.fat_per_serving} onChange={(e) => setForm({ ...form, fat_per_serving: +e.target.value })} />
              </div>
              <Button className="w-full" onClick={() => createRecipe.mutate()} disabled={!form.title || createRecipe.isPending}>
                {createRecipe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicera recept"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Sök recept..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Alla kategorier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla kategorier</SelectItem>
            {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex rounded-lg border overflow-hidden">
          <button className={`px-3 py-1.5 text-xs font-medium ${viewMode === "mine" ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={() => setViewMode("mine")}>Mina recept</button>
          <button className={`px-3 py-1.5 text-xs font-medium ${viewMode === "all" ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={() => setViewMode("all")}>Alla recept</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !filteredRecipes.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Inga recept hittades.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              {r.image_url && (
                <div className="h-36 bg-muted">
                  <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                </div>
              )}
              {!r.image_url && (
                <div className="h-36 bg-primary/5 flex items-center justify-center">
                  <UtensilsCrossed className="h-8 w-8 text-primary/30" />
                </div>
              )}
              <CardContent className="py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {r.calories_per_serving && <span>{r.calories_per_serving} kcal</span>}
                      {r.time_minutes && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{r.time_minutes} min</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(r.tags ?? []).slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSuggestRecipeId(r.id)}>
                        <Send className="h-3 w-3 mr-2" /> Föreslå till patient
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Suggest modal */}
      <Dialog open={!!suggestRecipeId} onOpenChange={(open) => { if (!open) { setSuggestRecipeId(null); setSuggestPatientIds([]); setSuggestMessage(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Föreslå till patient</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {patients?.map((p) => (
                <label key={p.patient_id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={suggestPatientIds.includes(p.patient_id)}
                    onCheckedChange={(checked) => {
                      setSuggestPatientIds((prev) => checked ? [...prev, p.patient_id] : prev.filter((id) => id !== p.patient_id));
                    }}
                  />
                  <span className="text-sm">Patient {p.patient_id.slice(0, 8)}</span>
                </label>
              ))}
            </div>
            <Textarea placeholder="Meddelande (valfritt)" value={suggestMessage} onChange={(e) => setSuggestMessage(e.target.value)} rows={2} />
            <Button className="w-full" onClick={() => suggestRecipe.mutate()} disabled={suggestPatientIds.length === 0 || suggestRecipe.isPending}>
              {suggestRecipe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Föreslå till ${suggestPatientIds.length} patient(er)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
