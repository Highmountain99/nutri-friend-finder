import { useState, useEffect, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, GripVertical, Trash2, Smartphone, Sparkles } from "lucide-react";
import { BlockPreview } from "./blocks/BlockPreview";
import { useBlockTemplates, seedSystemTemplates } from "@/hooks/dietitian/useBlockTemplates";
import { ensureDefaultPatientBlocks } from "@/lib/ensureDefaultPatientBlocks";

interface ConfigureProgressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
}

interface BlockItem {
  id: string;
  label: string;
  description: string;
  blockId: string;
  templateId: string;
  icon: string;
  dataSource: string;
  dataConfig: Record<string, any>;
  displayConfig: Record<string, any>;
  blockType: string;
}

export function ConfigureProgressSheet({ open, onOpenChange, patientId }: ConfigureProgressSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<BlockItem[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [addingBlock, setAddingBlock] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const { data: patientBlocks, isLoading } = useQuery({
    queryKey: ["patient-blocks", patientId],
    queryFn: async () => {
      if (user?.id) {
        await seedSystemTemplates(user.id);
        await ensureDefaultPatientBlocks(patientId, user.id);
      }
      const { data, error } = await supabase
        .from("patient_blocks")
        .select("*, block_templates(*)")
        .eq("patient_id", patientId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((b: any) => ({ ...b, template: b.block_templates }));
    },
    enabled: open,
  });

  const { data: blockTemplates } = useBlockTemplates();

  useEffect(() => {
    if (!patientBlocks) return;
    setItems(patientBlocks.map((pb: any) => ({
      id: pb.id,
      label: pb.override_title || pb.template?.title || "Block",
      description: pb.template?.description || "",
      blockId: pb.id,
      templateId: pb.block_template_id,
      icon: pb.template?.icon || "Square",
      dataSource: pb.template?.data_source || "none",
      dataConfig: pb.template?.data_config || {},
      displayConfig: pb.template?.display_config || {},
      blockType: pb.template?.block_type || "progress",
    })));
  }, [patientBlocks]);

  const removeBlock = async (item: BlockItem) => {
    try {
      const { error } = await supabase
        .from("patient_blocks")
        .update({ is_active: false })
        .eq("id", item.blockId);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== item.id));
      queryClient.invalidateQueries({ queryKey: ["patient-blocks"] });
      toast.success("Block borttaget");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddBlock = async (tmpl: any) => {
    if (!user) return;
    setAddingBlock(tmpl.id);
    try {
      const maxSort = items.length;
      const { data: inserted, error } = await supabase
        .from("patient_blocks")
        .insert({
          patient_id: patientId,
          block_template_id: tmpl.id,
          dietitian_id: user.id,
          sort_order: maxSort,
          is_active: true,
        })
        .select("id")
        .single();
      if (error) throw error;

      await supabase.from("block_templates").update({ usage_count: (tmpl.usage_count || 0) + 1 }).eq("id", tmpl.id);

      setItems(prev => [...prev, {
        id: inserted.id,
        label: tmpl.title,
        description: tmpl.description || "",
        blockId: inserted.id,
        templateId: tmpl.id,
        icon: tmpl.icon || "Square",
        dataSource: tmpl.data_source || "none",
        dataConfig: tmpl.data_config || {},
        displayConfig: tmpl.display_config || {},
        blockType: tmpl.block_type || "progress",
      }]);

      queryClient.invalidateQueries({ queryKey: ["patient-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["block-templates"] });
      toast.success(`"${tmpl.title}" tillagt`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingBlock(null);
    }
  };

  // Drag & drop
  const handleDragStart = useCallback((idx: number, e: React.DragEvent<HTMLDivElement>) => {
    setDragIdx(idx);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.4";
    });
  }, []);

  const handleDragEnter = useCallback((idx: number) => {
    setOverIdx(idx);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      setItems(prev => {
        const updated = [...prev];
        const [removed] = updated.splice(dragIdx, 1);
        updated.splice(overIdx, 0, removed);
        return updated;
      });
    }
    setDragIdx(null);
    setOverIdx(null);
    dragNode.current = null;
  }, [dragIdx, overIdx]);

  // Save block sort order
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      for (let idx = 0; idx < items.length; idx++) {
        await supabase.from("patient_blocks").update({ sort_order: idx }).eq("id", items[idx].blockId);
      }

      queryClient.invalidateQueries({ queryKey: ["patient-blocks"] });
      toast.success("Utvecklingsvy uppdaterad");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Kunde inte spara: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Library blocks not yet added
  const addedTemplateIds = new Set(items.map(i => i.templateId));
  const availableTemplates = (blockTemplates || []).filter(t => !addedTemplateIds.has(t.id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg w-full p-0">
        <div className="p-6 pb-3">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg">Designa utvecklingsvy</SheetTitle>
            <SheetDescription className="text-sm">
              Bygg klientens vy genom att lägga till block från biblioteket.
            </SheetDescription>
          </SheetHeader>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 pb-6">
            {/* Phone preview */}
            <div className="px-6">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Klientens vy
                </Label>
              </div>

              <div className="mx-auto max-w-[320px] border-2 border-border rounded-[2rem] bg-background shadow-lg overflow-hidden">
                <div className="h-6 bg-muted/50 flex items-center justify-center">
                  <div className="w-16 h-1 bg-muted-foreground/20 rounded-full" />
                </div>

                <div className="p-4 space-y-3 min-h-[340px]">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">Inga block tillagda</p>
                      <p className="text-xs text-muted-foreground mt-1">Lägg till block från biblioteket nedan</p>
                    </div>
                  ) : (
                    (() => {
                      const ORDER = [
                        "weight_trend_card",
                        "meals_week_card",
                        "logged_days_card",
                        "waist_trend_card",
                      ];
                      const renderOf = (it: any) => it.displayConfig?.render_as || "";
                      const sorted = [...items].sort((a, b) => {
                        const ia = ORDER.indexOf(renderOf(a));
                        const ib = ORDER.indexOf(renderOf(b));
                        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                      });
                      const isHalf = (it: any) =>
                        ["meals_week_card", "logged_days_card"].includes(renderOf(it));

                      const wrap = (item: any) => (
                        <div
                          key={item.id}
                          className="group relative rounded-xl border border-primary/30 hover:border-primary/50 transition-all overflow-hidden"
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); removeBlock(item); }}
                            className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all z-10"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                          <div className="pointer-events-none">
                            <BlockPreview
                              title={item.label}
                              description={item.description}
                              icon={item.icon}
                              dataSource={item.dataSource}
                              dataConfig={item.dataConfig}
                              displayConfig={item.displayConfig}
                              blockType={item.blockType}
                            />
                          </div>
                        </div>
                      );

                      const rows: JSX.Element[] = [];
                      let i = 0;
                      while (i < sorted.length) {
                        const cur = sorted[i];
                        if (isHalf(cur) && sorted[i + 1] && isHalf(sorted[i + 1])) {
                          rows.push(
                            <div key={`row-${cur.id}`} className="grid grid-cols-2 gap-3 items-start">
                              {wrap(cur)}
                              {wrap(sorted[i + 1])}
                            </div>
                          );
                          i += 2;
                        } else {
                          rows.push(wrap(cur));
                          i += 1;
                        }
                      }
                      return rows;
                    })()
                  )}

                </div>

                <div className="h-5 flex items-center justify-center">
                  <div className="w-24 h-1 bg-muted-foreground/20 rounded-full" />
                </div>
              </div>
            </div>

            {/* Available blocks from library */}
            {availableTemplates.length > 0 && (
              <div className="px-6 space-y-3">
                <Separator />
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Blockbibliotek
                </Label>
                <p className="text-xs text-muted-foreground">
                  Klicka för att lägga till i klientens vy.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {availableTemplates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleAddBlock(tmpl)}
                      disabled={addingBlock === tmpl.id}
                      className="rounded-xl border border-dashed border-border bg-muted/30 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50 overflow-hidden"
                    >
                      {addingBlock === tmpl.id ? (
                        <div className="flex items-center justify-center p-6">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="p-2">
                          <BlockPreview
                            title={tmpl.title}
                            description={tmpl.description || ""}
                            icon={tmpl.icon || "Square"}
                            dataSource={tmpl.data_source}
                            dataConfig={(tmpl.data_config as Record<string, any>) || {}}
                            displayConfig={(tmpl.display_config as Record<string, any>) || {}}
                            blockType={tmpl.block_type}
                            compact
                          />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-6 pt-2">
              <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Spara design
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}