import { useState, useEffect, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, GripVertical, EyeOff, Smartphone, Plus } from "lucide-react";
import { ModulePreview } from "./progress-builder/ModulePreview";
import { BlockPreview } from "./blocks/BlockPreview";
import { TEMPLATE_SECTION_DEFAULTS, CATEGORY_SECTIONS, GENERIC_SECTIONS, type SectionDef } from "./progress-builder/templateDefaults";
import { useBlockTemplates } from "@/hooks/dietitian/useBlockTemplates";
import * as Icons from "lucide-react";

const TEMPLATE_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: "auto", label: "Automatisk (från kvalificering)", description: "Baseras på patientens egna val" },
  { value: "weight_loss", label: "Viktminskning", description: "Vikt, midjemått, trendgraf" },
  { value: "diabetes", label: "Diabetes", description: "Blodsocker, HbA1c, trendgrafer" },
  { value: "gut_health", label: "Maghälsa / IBS", description: "FODMAP-faser, triggers, symptomfria dagar" },
  { value: "heart_health", label: "Hjärthälsa", description: "Blodtryck, kolesterol, trendgrafer" },
  { value: "womens_health", label: "Kvinnohälsa", description: "Vikt, midjemått, cykelfokus" },
  { value: "eating_disorder", label: "Ätstörning", description: "Måltidsregularitet, inga vikt-/kaloridata" },
  { value: "general_health", label: "Allmän hälsa", description: "Makros, kalorier, vikt" },
];

const getSectionsForTemplate = (tmpl: string): SectionDef[] => {
  return CATEGORY_SECTIONS[tmpl] || GENERIC_SECTIONS;
};

interface ConfigureProgressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
}

// Unified item: either a standard module or a library block
interface UnifiedItem {
  id: string;
  type: "module" | "block";
  label: string;
  description: string;
  enabled: boolean;
  sectionValue?: string;
  blockId?: string;
  templateId?: string;
  icon?: string;
  dataSource?: string;
  dataConfig?: Record<string, any>;
}

export function ConfigureProgressSheet({ open, onOpenChange, patientId }: ConfigureProgressSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState("auto");
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [addingBlock, setAddingBlock] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ["patient-progress-config", patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("patient_progress_config")
        .select("*")
        .eq("patient_id", patientId)
        .maybeSingle();
      return data;
    },
    enabled: open,
  });

  const { data: patientBlocks } = useQuery({
    queryKey: ["patient-blocks", patientId],
    queryFn: async () => {
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

  // Build unified items from template sections + patient blocks
  const buildItems = useCallback((tmpl: string, savedSections?: string[] | null, blocks?: any[]) => {
    const templateSections = getSectionsForTemplate(tmpl);
    const defaults = TEMPLATE_SECTION_DEFAULTS[tmpl] || TEMPLATE_SECTION_DEFAULTS["auto"];

    // Build module items
    const moduleItems: UnifiedItem[] = [];
    const enabledValues = savedSections && savedSections.length > 0 ? savedSections : defaults;

    for (const val of enabledValues) {
      const opt = templateSections.find(s => s.value === val);
      if (opt) moduleItems.push({
        id: `mod_${opt.value}`,
        type: "module",
        label: opt.label,
        description: opt.description,
        enabled: true,
        sectionValue: opt.value,
      });
    }
    for (const opt of templateSections) {
      if (!moduleItems.find(m => m.sectionValue === opt.value)) {
        moduleItems.push({
          id: `mod_${opt.value}`,
          type: "module",
          label: opt.label,
          description: opt.description,
          enabled: false,
          sectionValue: opt.value,
        });
      }
    }

    // Build block items from patient_blocks
    const blockItems: UnifiedItem[] = (blocks || []).map((pb: any) => ({
      id: `blk_${pb.id}`,
      type: "block" as const,
      label: pb.override_title || pb.template?.title || "Block",
      description: pb.template?.description || "",
      enabled: true,
      blockId: pb.id,
      templateId: pb.block_template_id,
      icon: pb.template?.icon || "Square",
      dataSource: pb.template?.data_source || "none",
      dataConfig: pb.template?.data_config || {},
    }));

    // Merge: enabled modules first, then blocks, then disabled modules
    const enabled = moduleItems.filter(m => m.enabled);
    const disabled = moduleItems.filter(m => !m.enabled);
    return [...enabled, ...blockItems, ...disabled];
  }, []);

  useEffect(() => {
    const tmpl = config?.concern_category_override || "auto";
    setTemplate(tmpl);
    const savedSections = (config as any)?.visible_sections as string[] | null;
    setItems(buildItems(tmpl, savedSections, patientBlocks));
  }, [config, patientBlocks, buildItems]);

  const handleTemplateChange = (newTemplate: string) => {
    setTemplate(newTemplate);
    // Keep existing blocks, rebuild modules
    const blockItems = items.filter(i => i.type === "block");
    const templateSections = getSectionsForTemplate(newTemplate);
    const defaults = TEMPLATE_SECTION_DEFAULTS[newTemplate] || TEMPLATE_SECTION_DEFAULTS["auto"];

    const moduleItems: UnifiedItem[] = [];
    for (const val of defaults) {
      const opt = templateSections.find(s => s.value === val);
      if (opt) moduleItems.push({
        id: `mod_${opt.value}`, type: "module", label: opt.label,
        description: opt.description, enabled: true, sectionValue: opt.value,
      });
    }
    for (const opt of templateSections) {
      if (!moduleItems.find(m => m.sectionValue === opt.value)) {
        moduleItems.push({
          id: `mod_${opt.value}`, type: "module", label: opt.label,
          description: opt.description, enabled: false, sectionValue: opt.value,
        });
      }
    }

    const enabled = moduleItems.filter(m => m.enabled);
    const disabled = moduleItems.filter(m => !m.enabled);
    setItems([...enabled, ...blockItems, ...disabled]);
  };

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  };

  const removeBlockItem = async (item: UnifiedItem) => {
    if (!item.blockId) return;
    try {
      const { error } = await supabase.from("patient_blocks").delete().eq("id", item.blockId);
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
      const maxSort = items.filter(i => i.enabled).length;
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

      const newItem: UnifiedItem = {
        id: `blk_${inserted.id}`,
        type: "block",
        label: tmpl.title,
        description: tmpl.description || "",
        enabled: true,
        blockId: inserted.id,
        templateId: tmpl.id,
        icon: tmpl.icon || "Square",
        dataSource: tmpl.data_source || "none",
        dataConfig: tmpl.data_config || {},
      };

      // Insert before disabled items
      setItems(prev => {
        const enabledItems = prev.filter(i => i.enabled);
        const disabledItems = prev.filter(i => !i.enabled);
        return [...enabledItems, newItem, ...disabledItems];
      });

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

  // Save: persist both module sections and block sort_order
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const enabledModules = items.filter(i => i.enabled && i.type === "module").map(i => i.sectionValue!);
      const payload = {
        patient_id: patientId,
        dietitian_id: user.id,
        concern_category_override: template === "auto" ? null : template,
        visible_sections: enabledModules,
        visible_metrics: [],
        updated_at: new Date().toISOString(),
      };

      if (config) {
        const { error } = await supabase.from("patient_progress_config").update(payload).eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("patient_progress_config").insert(payload);
        if (error) throw error;
      }

      // Update block sort_order based on position in list
      const enabledBlocks = items.filter(i => i.enabled && i.type === "block");
      for (let idx = 0; idx < enabledBlocks.length; idx++) {
        const blk = enabledBlocks[idx];
        if (blk.blockId) {
          await supabase.from("patient_blocks").update({ sort_order: idx }).eq("id", blk.blockId);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["patient-progress-config"] });
      queryClient.invalidateQueries({ queryKey: ["patient-blocks"] });
      toast.success("Utvecklingsvy uppdaterad");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Kunde inte spara: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const enabledItems = items.filter(i => i.enabled);
  const disabledModules = items.filter(i => !i.enabled && i.type === "module");

  // Library blocks not yet added
  const addedTemplateIds = new Set(items.filter(i => i.type === "block").map(i => i.templateId));
  const availableTemplates = (blockTemplates || []).filter(t => !addedTemplateIds.has(t.id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg w-full p-0">
        <div className="p-6 pb-3">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg">Designa utvecklingsvy</SheetTitle>
            <SheetDescription className="text-sm">
              Välj template och bygg patientens vy genom att dra moduler.
            </SheetDescription>
          </SheetHeader>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 pb-6">
            {/* Template selector */}
            <div className="px-6 space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Template
              </Label>
              <Select value={template} onValueChange={handleTemplateChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Phone preview with all enabled items */}
            <div className="px-6">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Patientens vy
                </Label>
              </div>

              <div className="mx-auto max-w-[320px] border-2 border-border rounded-[2rem] bg-background shadow-lg overflow-hidden">
                <div className="h-6 bg-muted/50 flex items-center justify-center">
                  <div className="w-16 h-1 bg-muted-foreground/20 rounded-full" />
                </div>

                <div className="p-4 space-y-3 min-h-[340px]">
                  {enabledItems.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                      Inga element valda
                    </div>
                  ) : (
                    enabledItems.map((item) => {
                      const globalIdx = items.indexOf(item);
                      const isOver = overIdx === globalIdx && dragIdx !== null;

                      if (item.type === "module") {
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(globalIdx, e)}
                            onDragEnter={() => handleDragEnter(globalIdx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnd={handleDragEnd}
                            className={`
                              group relative rounded-xl border bg-card p-3 transition-all cursor-grab active:cursor-grabbing select-none
                              ${isOver ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : "border-border hover:border-primary/40"}
                            `}
                          >
                            <div className="absolute -left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
                              className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all z-10"
                            >
                              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <ModulePreview sectionValue={item.sectionValue!} label={item.label} />
                          </div>
                        );
                      }

                      // Block item — show mini BlockPreview
                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(globalIdx, e)}
                          onDragEnter={() => handleDragEnter(globalIdx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnd={handleDragEnd}
                          className={`
                            group relative rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none overflow-hidden
                            ${isOver ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : "border-primary/30 hover:border-primary/50"}
                          `}
                        >
                          <div className="absolute -left-0 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeBlockItem(item); }}
                            className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all z-10"
                          >
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <div className="transform scale-[0.85] origin-top pointer-events-none">
                            <BlockPreview
                              title={item.label}
                              description={item.description}
                              icon={item.icon || "Square"}
                              dataSource={item.dataSource || "none"}
                              dataConfig={item.dataConfig || {}}
                              displayConfig={{}}
                              blockType="progress"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="h-5 flex items-center justify-center">
                  <div className="w-24 h-1 bg-muted-foreground/20 rounded-full" />
                </div>
              </div>
            </div>

            {/* Tillgängliga element */}
            {(disabledModules.length > 0 || availableTemplates.length > 0) && (
              <div className="px-6 space-y-3">
                <Separator />
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tillgängliga element
                </Label>
                <p className="text-xs text-muted-foreground">
                  Klicka för att lägga till i vyn.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {/* Disabled standard modules */}
                  {disabledModules.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <ModulePreview sectionValue={item.sectionValue!} label={item.label} compact />
                    </button>
                  ))}

                  {/* Available library blocks */}
                  {availableTemplates.map((tmpl) => {
                    const IconComp = (Icons as any)[tmpl.icon] || Icons.Square;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => handleAddBlock(tmpl)}
                        disabled={addingBlock === tmpl.id}
                        className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-primary/10 text-primary shrink-0">
                            {addingBlock === tmpl.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <IconComp className="h-3 w-3" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium truncate">{tmpl.title}</p>
                            {tmpl.data_source !== "none" && (
                              <p className="text-[9px] text-emerald-600">Datakopplat</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
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
