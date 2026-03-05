import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Send } from "lucide-react";
import { useAssignedPatients, getPatientDisplayName } from "@/hooks/dietitian/useAssignedPatients";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SuggestRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  recipeTitle: string;
  recipeImage?: string | null;
}

export function SuggestRecipeModal({
  open,
  onOpenChange,
  recipeId,
  recipeTitle,
  recipeImage,
}: SuggestRecipeModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: patients } = useAssignedPatients();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  const filteredPatients = (patients || []).filter((p) =>
    getPatientDisplayName(p).toLowerCase().includes(search.toLowerCase())
  );

  const togglePatient = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;
    setSending(true);
    try {
      // Insert recipe suggestions
      const inserts = selectedIds.map((pid) => ({
        recipe_id: recipeId,
        dietitian_id: user!.id,
        patient_id: pid,
        message: message.trim() || null,
        status: "suggested",
      }));
      const { error } = await supabase.from("recipe_suggestions").insert(inserts);
      if (error) throw error;

      // Send chat messages
      const chatContent = message.trim()
        ? `Jag har föreslagit receptet "${recipeTitle}": ${message.trim()}`
        : `Jag har föreslagit receptet "${recipeTitle}" till dig.`;

      for (const pid of selectedIds) {
        await supabase.from("chat_messages").insert({
          user_id: pid,
          sender: "dietitian",
          content: chatContent,
          conversation_type: "dietitian",
        });
      }

      toast.success(`Recept föreslaget till ${selectedIds.length} patient(er)!`);
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
          <DialogTitle>Föreslå recept till patient</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipe info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            {recipeImage ? (
              <img src={recipeImage} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary/30 text-xs">🍽</div>
            )}
            <p className="font-medium text-sm">{recipeTitle}</p>
          </div>

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
                Skicka förslag till {selectedIds.length} patient(er)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
