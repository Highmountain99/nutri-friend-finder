import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Send, Users2 } from "lucide-react";
import { useAssignedPatients, getPatientDisplayName } from "@/hooks/dietitian/useAssignedPatients";
import { useClientGroups } from "@/hooks/dietitian/useClientGroups";
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
  const { data: groups } = useClientGroups();
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

  const toggleGroup = (memberIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = memberIds.length > 0 && memberIds.every((id) => prev.includes(id));
      return allSelected
        ? prev.filter((id) => !memberIds.includes(id))
        : Array.from(new Set([...prev, ...memberIds]));
    });
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

      // Send chat messages with a compact attachment link instead of summary text
      const count = recipesToSuggest.length;
      const chatContent = message.trim()
        ? message.trim()
        : count === 1
          ? "Jag har föreslagit ett nytt recept till dig."
          : `Jag har föreslagit ${count} nya recept till dig.`;

      const attachment = {
        type: "recipe_suggestions_link",
        url: "/recipes",
        name: "Föreslagna recept",
        count,
      };

      for (const pid of selectedIds) {
        await supabase.from("chat_messages").insert({
          user_id: pid,
          sender: "dietitian",
          content: chatContent,
          conversation_type: "dietitian",
          attachments: [attachment],
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
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {recipesToSuggest.length > 1
              ? `Föreslå ${recipesToSuggest.length} recept till patient`
              : "Föreslå recept till patient"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden flex-1">
          {/* Recipe info */}
          {recipesToSuggest.length === 1 ? (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg shrink-0">
              {recipesToSuggest[0].image ? (
                <img src={recipesToSuggest[0].image} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary/30 text-xs shrink-0">🍽</div>
              )}
              <p className="font-medium text-sm">{recipesToSuggest[0].title}</p>
            </div>
          ) : (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2 max-h-[120px] overflow-y-auto shrink-0">
              {recipesToSuggest.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5">
                  {r.image ? (
                    <img src={r.image} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary/30 text-[10px] shrink-0">🍽</div>
                  )}
                  <p className="text-sm truncate">{r.title}</p>
                </div>
              ))}
            </div>
          )}

          {/* Training groups */}
          {(groups?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {groups!.map((g) => {
                const active = g.member_ids.length > 0 && g.member_ids.every((id) => selectedIds.includes(id));
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.member_ids)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-accent/40"
                    }`}
                  >
                    <Users2 className="h-3 w-3" />
                    {g.name}
                    <span className="opacity-60">{g.member_ids.length}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search patients */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök klient..."
              className="pl-9 h-10"
            />
          </div>

          {/* Patient list */}
          <div className="space-y-0.5 overflow-y-auto min-h-0 flex-1 -mx-1 px-1">
            {filteredPatients.map((p) => (
              <label
                key={p.patient_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors"
              >
                <Checkbox
                  checked={selectedIds.includes(p.patient_id)}
                  onCheckedChange={() => togglePatient(p.patient_id)}
                />
                <span className="text-sm">{getPatientDisplayName(p)}</span>
              </label>
            ))}
            {filteredPatients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Inga klienter hittades</p>
            )}
          </div>

          {/* Message */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Lägg till en kommentar (valfritt)..."
            rows={2}
            className="shrink-0"
          />

          <Button className="w-full shrink-0" onClick={handleSend} disabled={selectedIds.length === 0 || sending}>
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
