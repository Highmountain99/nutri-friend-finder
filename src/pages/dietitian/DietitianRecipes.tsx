import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignedPatients } from "@/hooks/dietitian/useAssignedPatients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Send, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export default function DietitianRecipes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: patients } = useAssignedPatients();
  const [showCreate, setShowCreate] = useState(false);
  const [suggestRecipeId, setSuggestRecipeId] = useState<string | null>(null);
  const [suggestPatientId, setSuggestPatientId] = useState("");

  // Fetch recipes created by this dietitian
  const { data: myRecipes, isLoading } = useQuery({
    queryKey: ["dietitian-recipes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    time_minutes: 30,
    servings: 2,
    calories_per_serving: 0,
    protein_per_serving: 0,
    carbs_per_serving: 0,
    fat_per_serving: 0,
    ingredients: "",
    instructions: "",
  });

  const createRecipe = useMutation({
    mutationFn: async () => {
      const ingredientsList: Json = form.ingredients.split("\n").filter(Boolean).map((i) => ({ name: i.trim(), amount: "" }));
      const instructionsList: Json = form.instructions.split("\n").filter(Boolean).map((s, i) => ({ step: i + 1, text: s.trim() }));

      const { error } = await supabase.from("recipes").insert({
        title: form.title,
        description: form.description,
        time_minutes: form.time_minutes,
        servings: form.servings,
        calories_per_serving: form.calories_per_serving,
        protein_per_serving: form.protein_per_serving,
        carbs_per_serving: form.carbs_per_serving,
        fat_per_serving: form.fat_per_serving,
        ingredients: ingredientsList,
        instructions: instructionsList,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietitian-recipes"] });
      setShowCreate(false);
      setForm({ title: "", description: "", time_minutes: 30, servings: 2, calories_per_serving: 0, protein_per_serving: 0, carbs_per_serving: 0, fat_per_serving: 0, ingredients: "", instructions: "" });
      toast.success("Recept skapat!");
    },
    onError: () => toast.error("Kunde inte skapa recept"),
  });

  const suggestRecipe = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_recipe_interactions").insert({
        user_id: suggestPatientId,
        recipe_id: suggestRecipeId!,
        source: "dietitian",
        dietitian_id: user!.id,
        status: "suggested",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSuggestRecipeId(null);
      setSuggestPatientId("");
      toast.success("Recept föreslaget till patient!");
    },
    onError: () => toast.error("Kunde inte föreslå recept"),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recept</h1>
          <p className="text-muted-foreground">Skapa och hantera dina egna recept.</p>
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
              <div className="grid grid-cols-4 gap-2">
                <Input type="number" placeholder="Kcal" value={form.calories_per_serving} onChange={(e) => setForm({ ...form, calories_per_serving: +e.target.value })} />
                <Input type="number" placeholder="Protein" value={form.protein_per_serving} onChange={(e) => setForm({ ...form, protein_per_serving: +e.target.value })} />
                <Input type="number" placeholder="Kolhydr." value={form.carbs_per_serving} onChange={(e) => setForm({ ...form, carbs_per_serving: +e.target.value })} />
                <Input type="number" placeholder="Fett" value={form.fat_per_serving} onChange={(e) => setForm({ ...form, fat_per_serving: +e.target.value })} />
              </div>
              <Textarea placeholder="Ingredienser (en per rad)" rows={5} value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
              <Textarea placeholder="Instruktioner (ett steg per rad)" rows={5} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
              <Button className="w-full" onClick={() => createRecipe.mutate()} disabled={!form.title || createRecipe.isPending}>
                {createRecipe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Skapa recept"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !myRecipes?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Du har inte skapat några recept ännu.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {myRecipes.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-soft flex items-center justify-center">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.calories_per_serving} kcal · {r.time_minutes} min</p>
                  </div>
                </div>
                <Dialog open={suggestRecipeId === r.id} onOpenChange={(open) => { if (!open) setSuggestRecipeId(null); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSuggestRecipeId(r.id)}>
                      <Send className="h-3 w-3 mr-1" /> Föreslå
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Föreslå till patient</DialogTitle></DialogHeader>
                    <Select value={suggestPatientId} onValueChange={setSuggestPatientId}>
                      <SelectTrigger><SelectValue placeholder="Välj patient" /></SelectTrigger>
                      <SelectContent>
                        {patients?.map((p) => (
                          <SelectItem key={p.patient_id} value={p.patient_id}>
                            Patient {p.patient_id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => suggestRecipe.mutate()} disabled={!suggestPatientId || suggestRecipe.isPending}>
                      {suggestRecipe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Föreslå recept"}
                    </Button>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
