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
import { Loader2, GripVertical, Eye, EyeOff, Smartphone, Blocks } from "lucide-react";
import { ModulePreview } from "./progress-builder/ModulePreview";
import { TEMPLATE_SECTION_DEFAULTS, CATEGORY_SECTIONS, GENERIC_SECTIONS, type SectionDef } from "./progress-builder/templateDefaults";
import { BlockPickerSheet } from "./blocks/BlockPickerSheet";

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

interface SectionItem {
  value: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function ConfigureProgressSheet({ open, onOpenChange, patientId }: ConfigureProgressSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState("auto");
  const [orderedSections, setOrderedSections] = useState<SectionItem[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
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

  const buildSectionsFromTemplate = useCallback((tmpl: string, savedSections?: string[] | null) => {
    const templateSections = getSectionsForTemplate(tmpl);
    const defaults = TEMPLATE_SECTION_DEFAULTS[tmpl] || TEMPLATE_SECTION_DEFAULTS["auto"];
    
    const ordered: SectionItem[] = [];
    // Enabled first in order
    if (savedSections && savedSections.length > 0) {
      for (const val of savedSections) {
        const opt = templateSections.find(s => s.value === val);
        if (opt) ordered.push({ ...opt, enabled: true });
      }
    } else {
      for (const val of defaults) {
        const opt = templateSections.find(s => s.value === val);
        if (opt) ordered.push({ ...opt, enabled: true });
      }
    }
    // Then disabled
    for (const opt of templateSections) {
      if (!ordered.find(o => o.value === opt.value)) {
        ordered.push({ ...opt, enabled: false });
      }
    }
    return ordered;
  }, []);

  useEffect(() => {
    if (config) {
      const tmpl = config.concern_category_override || "auto";
      setTemplate(tmpl);
      const savedSections = (config as any).visible_sections as string[] | null;
      setOrderedSections(buildSectionsFromTemplate(tmpl, savedSections));
    } else {
      setTemplate("auto");
      setOrderedSections(buildSectionsFromTemplate("auto"));
    }
  }, [config, buildSectionsFromTemplate]);

  const handleTemplateChange = (newTemplate: string) => {
    setTemplate(newTemplate);
    // Reset sections to template defaults
    setOrderedSections(buildSectionsFromTemplate(newTemplate));
  };

  const toggleSection = (value: string) => {
    setOrderedSections(prev =>
      prev.map(s => s.value === value ? { ...s, enabled: !s.enabled } : s)
    );
  };

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
      setOrderedSections(prev => {
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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const enabledSections = orderedSections.filter(s => s.enabled).map(s => s.value);
      const payload = {
        patient_id: patientId,
        dietitian_id: user.id,
        concern_category_override: template === "auto" ? null : template,
        visible_sections: enabledSections,
        visible_metrics: [],
        updated_at: new Date().toISOString(),
      };

      if (config) {
        const { error } = await supabase
          .from("patient_progress_config")
          .update(payload)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("patient_progress_config")
          .insert(payload);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["patient-progress-config"] });
      toast.success("Utvecklingsvy uppdaterad");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Kunde inte spara: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const enabledSections = orderedSections.filter(s => s.enabled);
  const disabledSections = orderedSections.filter(s => !s.enabled);

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

            {/* Phone preview with active modules */}
            <div className="px-6">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Patientens vy
                </Label>
              </div>

              {/* Phone frame */}
              <div className="mx-auto max-w-[320px] border-2 border-border rounded-[2rem] bg-background shadow-lg overflow-hidden">
                {/* Status bar */}
                <div className="h-6 bg-muted/50 flex items-center justify-center">
                  <div className="w-16 h-1 bg-muted-foreground/20 rounded-full" />
                </div>

                {/* Content area */}
                <div className="p-4 space-y-4 min-h-[340px]">
                  {enabledSections.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                      Inga element valda
                    </div>
                  ) : (
                    enabledSections.map((section, idx) => (
                      <div
                        key={section.value}
                        data-section-idx={orderedSections.findIndex(s => s.value === section.value)}
                        draggable
                        onDragStart={(e) => handleDragStart(orderedSections.findIndex(s => s.value === section.value), e)}
                        onDragEnter={() => handleDragEnter(orderedSections.findIndex(s => s.value === section.value))}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={handleDragEnd}
                        className={`
                          group relative rounded-xl border bg-card p-3 transition-all cursor-grab active:cursor-grabbing select-none
                          ${overIdx === orderedSections.findIndex(s => s.value === section.value) && dragIdx !== null
                            ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
                            : "border-border hover:border-primary/40"
                          }
                        `}
                      >
                        {/* Drag handle + visibility toggle overlay */}
                        <div className="absolute -left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSection(section.value); }}
                          className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all z-10"
                        >
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>

                        <ModulePreview sectionValue={section.value} label={section.label} />
                      </div>
                    ))
                  )}
                </div>

                {/* Home indicator */}
                <div className="h-5 flex items-center justify-center">
                  <div className="w-24 h-1 bg-muted-foreground/20 rounded-full" />
                </div>
              </div>
            </div>

            {/* Disabled modules pool */}
            {disabledSections.length > 0 && (
              <div className="px-6 space-y-3">
                <Separator />
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tillgängliga element
                </Label>
                <p className="text-xs text-muted-foreground">
                  Klicka för att lägga till i vyn.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {disabledSections.map(section => (
                    <button
                      key={section.value}
                      onClick={() => toggleSection(section.value)}
                      className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <ModulePreview sectionValue={section.value} label={section.label} compact />
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
