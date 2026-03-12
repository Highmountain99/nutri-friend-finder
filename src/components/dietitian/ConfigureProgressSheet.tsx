import { useState, useEffect, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, GripVertical, Eye, EyeOff } from "lucide-react";

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

const SECTION_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: "metric_cards", label: "Mätvärden", description: "Kort med nyckeltal (vikt, blodsocker etc.)" },
  { value: "trend_chart", label: "Trendgraf", description: "Visuell graf över utvecklingen" },
  { value: "weekly_overview", label: "Veckoöversikt", description: "Aktiva dagar och loggade måltider" },
  { value: "treatment_plan", label: "Behandlingsplan", description: "Mål och delmål från planen" },
  { value: "milestones", label: "Milstolpar", description: "Automatiska milstolpar baserat på data" },
  { value: "log_button", label: "Loggningsknapp", description: "Snabbknapp för att logga mätvärden" },
  { value: "macro_progress", label: "Makroöversikt", description: "Protein, kolhydrater, fett" },
];

const ALL_SECTIONS = SECTION_OPTIONS.map(s => s.value);

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

  useEffect(() => {
    if (config) {
      setTemplate(config.concern_category_override || "auto");
      const savedSections = (config as any).visible_sections as string[] | null;
      const enabledSet = new Set(savedSections && savedSections.length > 0 ? savedSections : ALL_SECTIONS);

      // Build ordered list: enabled sections first (in saved order), then disabled ones
      const ordered: SectionItem[] = [];
      if (savedSections && savedSections.length > 0) {
        for (const val of savedSections) {
          const opt = SECTION_OPTIONS.find(s => s.value === val);
          if (opt) ordered.push({ ...opt, enabled: true });
        }
      }
      // Add any that aren't in the saved list
      for (const opt of SECTION_OPTIONS) {
        if (!ordered.find(o => o.value === opt.value)) {
          ordered.push({ ...opt, enabled: enabledSet.has(opt.value) });
        }
      }
      setOrderedSections(ordered);
    } else {
      setTemplate("auto");
      setOrderedSections(SECTION_OPTIONS.map(s => ({ ...s, enabled: true })));
    }
  }, [config]);

  const toggleSection = (value: string) => {
    setOrderedSections(prev =>
      prev.map(s => s.value === value ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const handleDragStart = useCallback((idx: number, e: React.DragEvent<HTMLDivElement>) => {
    setDragIdx(idx);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    // Make drag image semi-transparent
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

  // Touch drag support
  const touchStartY = useRef(0);
  const touchIdx = useRef<number | null>(null);

  const handleTouchStart = useCallback((idx: number, e: React.TouchEvent) => {
    touchIdx.current = idx;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchIdx.current === null) return;
    const touch = e.touches[0];
    const elements = document.querySelectorAll("[data-section-idx]");
    for (let i = 0; i < elements.length; i++) {
      const rect = elements[i].getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        setOverIdx(parseInt(elements[i].getAttribute("data-section-idx") || "0"));
        break;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const from = touchIdx.current;
    const to = overIdx;
    if (from !== null && to !== null && from !== to) {
      setOrderedSections(prev => {
        const updated = [...prev];
        const [removed] = updated.splice(from, 1);
        updated.splice(to, 0, removed);
        return updated;
      });
    }
    touchIdx.current = null;
    setOverIdx(null);
  }, [overIdx]);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Designa utvecklingsvy</SheetTitle>
          <SheetDescription>
            Välj template och dra för att ordna elementen som patienten ser.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Template selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
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

            {/* Draggable section list */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Element & ordning</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Dra för att ändra ordning. Klicka på ögat för att visa/dölja.
              </p>
              <div className="space-y-1.5">
                {orderedSections.map((section, idx) => (
                  <div
                    key={section.value}
                    data-section-idx={idx}
                    draggable
                    onDragStart={(e) => handleDragStart(idx, e)}
                    onDragEnter={() => handleDragEnter(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(idx, e)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border bg-card transition-all select-none
                      ${dragIdx === idx ? "opacity-40" : ""}
                      ${overIdx === idx && dragIdx !== null && dragIdx !== idx ? "border-primary ring-1 ring-primary/30" : "border-border"}
                      ${!section.enabled ? "opacity-50" : ""}
                    `}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{section.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{section.description}</p>
                    </div>
                    <button
                      onClick={() => toggleSection(section.value)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      {section.enabled ? (
                        <Eye className="h-4 w-4 text-primary" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Spara design
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
