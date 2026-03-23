import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Plus } from "lucide-react";
import { useBlockTemplates, BlockTemplate } from "@/hooks/dietitian/useBlockTemplates";
import { BlockCard, CATEGORY_LABELS } from "./BlockCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface BlockPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
}

export function BlockPickerSheet({ open, onOpenChange, patientId }: BlockPickerSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [adding, setAdding] = useState<string | null>(null);

  const { data: templates, isLoading } = useBlockTemplates({ category: categoryFilter });

  const filtered = (templates || []).filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (template: BlockTemplate) => {
    if (!user) return;
    setAdding(template.id);
    try {
      // Get current max sort_order
      const { data: existing } = await supabase
        .from("patient_blocks")
        .select("sort_order")
        .eq("patient_id", patientId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { error } = await supabase
        .from("patient_blocks")
        .insert({
          patient_id: patientId,
          block_template_id: template.id,
          dietitian_id: user.id,
          sort_order: nextOrder,
          is_active: true,
        });

      if (error) throw error;

      // Increment usage count
      await supabase
        .from("block_templates")
        .update({ usage_count: template.usage_count + 1 })
        .eq("id", template.id);

      queryClient.invalidateQueries({ queryKey: ["patient-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["block-templates"] });
      toast.success(`"${template.title}" tillagt`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[85vh] sm:max-w-lg w-full p-0">
        <div className="p-6 pb-3">
          <DialogHeader className="text-left">
            <DialogTitle>Lägg till block från biblioteket</DialogTitle>
            <DialogDescription>Välj block att lägga till i patientens utvecklingsvy.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 space-y-4 pb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sök block..."
                className="pl-9 rounded-xl"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36 rounded-xl">
                <SelectValue placeholder="Alla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-12">
              Inga block hittades. Skapa nya i blockbiblioteket.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((template) => (
                <div key={template.id} className="relative">
                  <BlockCard template={template} />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={adding === template.id}
                    onClick={() => handleAdd(template)}
                    className="absolute top-3 right-3 h-7 text-xs rounded-lg"
                  >
                    {adding === template.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <><Plus className="h-3 w-3 mr-1" /> Lägg till</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
