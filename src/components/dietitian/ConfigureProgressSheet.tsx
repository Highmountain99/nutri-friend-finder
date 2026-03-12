import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

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

export function ConfigureProgressSheet({ open, onOpenChange, patientId }: ConfigureProgressSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState("auto");
  const [sections, setSections] = useState<string[]>(ALL_SECTIONS);

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
      setSections(savedSections && savedSections.length > 0 ? savedSections : ALL_SECTIONS);
    } else {
      setTemplate("auto");
      setSections(ALL_SECTIONS);
    }
  }, [config]);

  const toggleSection = (section: string) => {
    setSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        patient_id: patientId,
        dietitian_id: user.id,
        concern_category_override: template === "auto" ? null : template,
        visible_sections: sections,
        visible_metrics: [], // Keep for future use
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
          <SheetTitle>Anpassa utvecklingsvy</SheetTitle>
          <SheetDescription>
            Välj vilken template och vilka element patienten ser på sin utvecklingssida.
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

            {/* Section toggles */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Synliga element</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Välj vilka delar som ska visas för patienten.
              </p>
              <div className="space-y-3">
                {SECTION_OPTIONS.map(opt => (
                  <div key={opt.value} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={opt.value} className="text-sm cursor-pointer">{opt.label}</Label>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                    <Switch
                      id={opt.value}
                      checked={sections.includes(opt.value)}
                      onCheckedChange={() => toggleSection(opt.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Spara
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
