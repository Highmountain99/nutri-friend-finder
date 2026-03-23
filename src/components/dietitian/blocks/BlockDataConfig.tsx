import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

const DATA_SOURCE_OPTIONS = [
  { value: "meal_log", label: "Kostlogg", desc: "Loggade måltider och portioner" },
  { value: "meal_times", label: "Måltidstider", desc: "När patienten äter" },
  { value: "symptom_log", label: "Symptomlogg", desc: "Symptom kopplade till måltider" },
  { value: "macro_data", label: "Makro-/näringsdata", desc: "Protein, kolhydrater, fett" },
  { value: "treatment_goals", label: "Behandlingsmål", desc: "Milstolpar och mål" },
  { value: "treatment_plan", label: "Behandlingsplan", desc: "Aktiv plan, fokus och beskrivning" },
  { value: "progression", label: "Progression", desc: "Mönster och trender över tid" },
  { value: "health_tracking", label: "Hälsomätvärden", desc: "Vikt, blodtryck, midjemått etc." },
  { value: "appointments", label: "Bokningar", desc: "Kommande och tidigare samtal" },
];

const METRIC_OPTIONS: Record<string, { value: string; label: string; desc: string }[]> = {
  meal_log: [
    { value: "meal_rhythm", label: "Måltider idag", desc: "Visar vilka måltider som loggats" },
    { value: "meals_per_day", label: "Antal måltider per dag", desc: "Räknar loggade måltider" },
    { value: "regularity_30d", label: "Regelbundenhet", desc: "Dagar med tillräcklig struktur" },
  ],
  meal_times: [
    { value: "meal_rhythm", label: "Måltidsrytm idag", desc: "Vilka måltider loggats idag" },
    { value: "meals_per_day", label: "Antal måltider per dag", desc: "Totalt antal" },
  ],
  symptom_log: [
    { value: "symptom_count", label: "Antal symptom", desc: "Under vald tidsperiod" },
    { value: "symptom_by_time", label: "Symptom per tidpunkt", desc: "Mönster: efter lunch, kväll etc." },
    { value: "symptom_after_meal", label: "Symptom efter måltid", desc: "Kopplade till specifika måltider" },
  ],
  treatment_goals: [
    { value: "milestone_progress", label: "Milstolpar genomförda", desc: "Antal avklarade av totalt" },
  ],
  macro_data: [
    { value: "macro_value", label: "Makrovärde", desc: "Specifikt värde (protein etc.)" },
  ],
  progression: [
    { value: "regularity_30d", label: "Regelbundenhet 30 dagar", desc: "Grid med daglig status" },
    { value: "meals_per_day", label: "Mönster per dag", desc: "Trend i antal måltider" },
  ],
  health_tracking: [
    { value: "trend_chart", label: "Trendgraf", desc: "Linjediagram över tid (vikt, midjemått etc.)" },
    { value: "latest_value", label: "Senaste värde", desc: "Visar senast loggade mätvärde" },
  ],
};

const INTERPRETATION_OPTIONS = [
  { value: "raw", label: "Visa rå data", desc: "Exakt värde utan tolkning" },
  { value: "summary", label: "Visa sammanfattning", desc: "Kort text som beskriver läget" },
  { value: "trend", label: "Visa trend", desc: "Jämfört med föregående period" },
  { value: "status", label: "Visa status", desc: "Bra / på väg / saknas" },
];

const PERIOD_OPTIONS = [
  { value: "1", label: "Idag" },
  { value: "7", label: "Senaste 7 dagarna" },
  { value: "14", label: "Senaste 14 dagarna" },
  { value: "30", label: "Senaste 30 dagarna" },
];

interface Rule {
  condition: string;
  value: number;
  label: string;
}

interface DataConfig {
  metric?: string;
  period_days?: number;
  threshold?: number;
  interpretation?: string;
  rules?: Rule[];
  empty_text?: string;
  has_manual_text?: boolean;
  progression?: string;
  progression_target?: number;
  health_metric?: string;
}

interface BlockDataConfigProps {
  dataSource: string;
  config: DataConfig;
  onChange: (config: DataConfig) => void;
  onSourceChange?: (source: string) => void;
}

export function BlockDataConfig({ dataSource, config, onChange, onSourceChange }: BlockDataConfigProps) {
  const metrics = METRIC_OPTIONS[dataSource] || [];

  const addRule = () => {
    const rules = config.rules || [];
    if (rules.length >= 3) return;
    onChange({ ...config, rules: [...rules, { condition: "gte", value: 0, label: "" }] });
  };

  const updateRule = (idx: number, field: string, value: any) => {
    const rules = [...(config.rules || [])];
    rules[idx] = { ...rules[idx], [field]: value };
    onChange({ ...config, rules });
  };

  const removeRule = (idx: number) => {
    const rules = [...(config.rules || [])];
    rules.splice(idx, 1);
    onChange({ ...config, rules });
  };

  return (
    <div className="space-y-4">
      {/* Data source selection as cards */}
      {onSourceChange && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Datakälla</Label>
          <div className="grid grid-cols-2 gap-2">
            {DATA_SOURCE_OPTIONS.map((src) => (
              <button
                key={src.value}
                onClick={() => { onSourceChange(src.value); onChange({ ...config, metric: undefined }); }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  dataSource === src.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <span className="text-xs font-medium">{src.label}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{src.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metric selection as descriptive cards */}
      {metrics.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Vad ska blocket visa?</Label>
          <div className="grid gap-2">
            {metrics.map((m) => (
              <button
                key={m.value}
                onClick={() => onChange({ ...config, metric: m.value })}
                className={`flex items-start gap-3 p-2.5 rounded-xl border text-left transition-all ${
                  config.metric === m.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                  config.metric === m.value ? "border-primary" : "border-muted-foreground/30"
                }`}>
                  {config.metric === m.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
                <div>
                  <span className="text-sm font-medium">{m.label}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Health metric type selector */}
      {dataSource === "health_tracking" && config.metric === "trend_chart" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Vilket mätvärde?</Label>
          <Select value={config.health_metric || "weight"} onValueChange={(v) => onChange({ ...config, health_metric: v })}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weight">Vikt (kg)</SelectItem>
              <SelectItem value="waist">Midjemått (cm)</SelectItem>
              <SelectItem value="blood_pressure_systolic">Blodtryck systoliskt</SelectItem>
              <SelectItem value="blood_pressure_diastolic">Blodtryck diastoliskt</SelectItem>
              <SelectItem value="bmi">BMI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {dataSource === "health_tracking" && config.metric === "latest_value" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Vilket mätvärde?</Label>
          <Select value={config.health_metric || "weight"} onValueChange={(v) => onChange({ ...config, health_metric: v })}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weight">Vikt (kg)</SelectItem>
              <SelectItem value="waist">Midjemått (cm)</SelectItem>
              <SelectItem value="blood_pressure_systolic">Blodtryck systoliskt</SelectItem>
              <SelectItem value="blood_pressure_diastolic">Blodtryck diastoliskt</SelectItem>
              <SelectItem value="bmi">BMI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Interpretation */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Tolkning</Label>
        <p className="text-[10px] text-muted-foreground">Hur ska datan presenteras?</p>
        <div className="grid grid-cols-2 gap-2">
          {INTERPRETATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...config, interpretation: opt.value })}
              className={`p-2 rounded-xl border text-left transition-all ${
                (config.interpretation || "summary") === opt.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Period */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Tidsperiod</Label>
        <Select value={String(config.period_days || 1)} onValueChange={(v) => onChange({ ...config, period_days: parseInt(v) })}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config.metric === "regularity_30d" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Minsta antal måltider per dag</Label>
          <Input
            type="number"
            value={config.threshold || 3}
            onChange={(e) => onChange({ ...config, threshold: parseInt(e.target.value) || 3 })}
            className="rounded-xl w-24"
          />
        </div>
      )}

      {/* Conditional rules */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs font-medium">Villkorsregler</Label>
            <p className="text-[10px] text-muted-foreground">När ska blocket reagera?</p>
          </div>
          {(config.rules || []).length < 3 && (
            <Button variant="ghost" size="sm" onClick={addRule} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Lägg till
            </Button>
          )}
        </div>
        {(config.rules || []).map((rule, idx) => (
          <div key={idx} className="p-2.5 rounded-xl border border-border space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">OM</Badge>
              <span>värdet är</span>
              <Select value={rule.condition} onValueChange={(v) => updateRule(idx, "condition", v)}>
                <SelectTrigger className="w-16 h-7 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gte">≥</SelectItem>
                  <SelectItem value="lt">&lt;</SelectItem>
                  <SelectItem value="eq">=</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={rule.value}
                onChange={(e) => updateRule(idx, "value", parseInt(e.target.value) || 0)}
                className="w-14 h-7 text-xs rounded-lg"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-auto" onClick={() => removeRule(idx)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">DÅ</Badge>
              <Input
                placeholder="Visa: Bra struktur idag!"
                value={rule.label}
                onChange={(e) => updateRule(idx, "label", e.target.value)}
                className="flex-1 h-7 text-xs rounded-lg"
              />
            </div>
          </div>
        ))}
        {(config.rules || []).length === 0 && (
          <p className="text-xs text-muted-foreground italic">Inga regler — blocket visar alltid data</p>
        )}
      </div>

      {/* Empty state text */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Text vid tom data</Label>
        <Input
          value={config.empty_text || ""}
          onChange={(e) => onChange({ ...config, empty_text: e.target.value })}
          placeholder="Ingen data att visa ännu"
          className="rounded-xl text-sm"
        />
      </div>
    </div>
  );
}
