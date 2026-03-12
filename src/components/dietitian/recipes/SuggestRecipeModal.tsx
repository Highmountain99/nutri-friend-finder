import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Send } from "lucide-react";
import { useAssignedPatients, getPatientDisplayName } from "@/hooks/dietitian/useAssignedPatients";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface RecipeInfo {
  id: string;
  title: string;
  image?: string | null;
}

interface SuggestRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId?: string;
  recipeTitle?: string;
  recipeImage?: string | null;
  recipes?: RecipeInfo[];
}

export function SuggestRecipeModal({
  open,
  onOpenChange,
  recipeId,
  recipeTitle,
  recipeImage,
  recipes: batchRecipes,
}: SuggestRecipeModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: patients } = useAssignedPatients();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  // Support both single recipe and batch
  const recipesToSuggest: RecipeInfo[] = batchRecipes && batchRecipes.length > 0
    ? batchRecipes
    : recipeId && recipeTitle
      ? [{ id: recipeId, title: recipeTitle, image: recipeImage }]
      : [];

  const filteredPatients = (patients || []).filter((p) =>
    getPatientDisplayName(p).toLowerCase().includes(search.toLowerCase())
  );

  const togglePatient = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (selectedIds.length === 0 || recipesToSuggest.length === 0) return;
    setSending(true);
    try {
      // Insert recipe suggestions for all recipes × all patients
      const inserts = recipesToSuggest.flatMap((recipe) =>
        selectedIds.map((pid) => ({
          recipe_id: recipe.id,
          dietitian_id: user!.id,
          patient_id: pid,
          message: message.trim() || null,
          status: "suggested",
        }))
      );
      const { error } = await supabase.from("recipe_suggestions").insert(inserts);
      if (error) throw error;

      // Send chat messages
      const recipeNames = recipesToSuggest.map((r) => `"${r.title}"`).join(", ");
      const chatContent = recipesToSuggest.length === 1
        ? (message.trim()
          ? `Jag har föreslagit receptet ${recipeNames}: ${message.trim()}`
          : `Jag har föreslagit receptet ${recipeNames} till dig.`)
        : (message.trim()
          ? `Jag har föreslagit ${recipesToSuggest.length} recept till dig: ${recipeNames}. ${message.trim()}`
          : `Jag har föreslagit ${recipesToSuggest.length} recept till dig: ${recipeNames}.`);

      for (const pid of selectedIds) {
        await supabase.from("chat_messages").insert({
          user_id: pid,
          sender: "dietitian",
          content: chatContent,
          conversation_type: "dietitian",
        });
      }

      toast.success(`${recipesToSuggest.length} recept föreslaget till ${selectedIds.length} patient(er)!`);
      queryClient.invalidateQueries({ queryKey: ["recipe-suggestions"] });
      setSelectedIds([]);
      setMessage("");
      setSearch("");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Kunde inte skicka förslaget");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {recipesToSuggest.length > 1
              ? `Föreslå ${recipesToSuggest.length} recept till patient`
              : "Föreslå recept till patient"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipe info */}
          {recipesToSuggest.length === 1 ? (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {recipesToSuggest[0].image ? (
                <img src={recipesToSuggest[0].image} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary/30 text-xs">🍽</div>
              )}
              <p className="font-medium text-sm">{recipesToSuggest[0].title}</p>
            </div>
          ) : (
            <div className="p-3 bg-muted/50 rounded-lg space-y-1.5 max-h-[120px] overflow-auto">
              {recipesToSuggest.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  {r.image ? (
                    <img src={r.image} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary/30 text-[10px] flex-shrink-0">🍽</div>
                  )}
                  <p className="text-sm truncate">{r.title}</p>
                </div>
              ))}
            </div>
          )}

          {/* Search patients */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök patient..."
              className="pl-9 h-9"
            />
          </div>

          {/* Patient list */}
          <div className="space-y-1.5 max-h-[200px] overflow-auto">
            {filteredPatients.map((p) => (
              <label
                key={p.patient_id}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent/30"
              >
                <Checkbox
                  checked={selectedIds.includes(p.patient_id)}
                  onCheckedChange={() => togglePatient(p.patient_id)}
                />
                <span className="text-sm flex-1">{getPatientDisplayName(p)}</span>
              </label>
            ))}
            {filteredPatients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Inga patienter hittades</p>
            )}
          </div>

          {/* Message */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Lägg till en kommentar (valfritt)..."
            rows={2}
          />

          <Button className="w-full" onClick={handleSend} disabled={selectedIds.length === 0 || sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Skicka {recipesToSuggest.length > 1 ? `${recipesToSuggest.length} förslag` : "förslag"} till {selectedIds.length} patient(er)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
