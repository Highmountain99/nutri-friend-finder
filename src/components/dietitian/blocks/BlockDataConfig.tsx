import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

const METRIC_OPTIONS: Record<string, { value: string; label: string }[]> = {
  meal_log: [
    { value: "meal_rhythm", label: "Måltidsrytm (vilka måltider loggats)" },
    { value: "meals_per_day", label: "Antal måltider per dag" },
    { value: "regularity_30d", label: "Regelbundenhet (30 dagar)" },
  ],
  meal_times: [
    { value: "meal_rhythm", label: "Måltidsrytm idag" },
    { value: "meals_per_day", label: "Antal måltider per dag" },
  ],
  symptom_log: [
    { value: "symptom_count", label: "Antal symptom" },
    { value: "symptom_by_time", label: "Symptom per tidpunkt" },
  ],
  treatment_goals: [
    { value: "milestone_progress", label: "Milstolpar genomförda" },
  ],
  macro_data: [
    { value: "macro_value", label: "Makrovärde (protein, etc.)" },
  ],
};

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
  rules?: Rule[];
  empty_text?: string;
}

interface BlockDataConfigProps {
  dataSource: string;
  config: DataConfig;
  onChange: (config: DataConfig) => void;
}

export function BlockDataConfig({ dataSource, config, onChange }: BlockDataConfigProps) {
  if (dataSource === "none") {
    return (
      <p className="text-sm text-muted-foreground italic">
        Manuellt block — inget data hämtas automatiskt.
      </p>
    );
  }

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
      {metrics.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Vad ska visas</Label>
          <Select value={config.metric || ""} onValueChange={(v) => onChange({ ...config, metric: v })}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Välj mätvärde" />
            </SelectTrigger>
            <SelectContent>
              {metrics.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Tidsperiod</Label>
        <Select value={String(config.period_days || 1)} onValueChange={(v) => onChange({ ...config, period_days: parseInt(v) })}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
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
            className="rounded-xl"
          />
        </div>
      )}

      {/* Rules */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Villkorsregler (max 3)</Label>
          {(config.rules || []).length < 3 && (
            <Button variant="ghost" size="sm" onClick={addRule} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Lägg till
            </Button>
          )}
        </div>
        {(config.rules || []).map((rule, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Select value={rule.condition} onValueChange={(v) => updateRule(idx, "condition", v)}>
              <SelectTrigger className="w-20 h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
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
              className="w-16 h-8 text-xs rounded-lg"
            />
            <Input
              placeholder="Visa text..."
              value={rule.label}
              onChange={(e) => updateRule(idx, "label", e.target.value)}
              className="flex-1 h-8 text-xs rounded-lg"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeRule(idx)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Text vid tom data</Label>
        <Textarea
          value={config.empty_text || ""}
          onChange={(e) => onChange({ ...config, empty_text: e.target.value })}
          placeholder="Ingen data att visa ännu"
          className="rounded-xl text-sm min-h-[60px]"
        />
      </div>
    </div>
  );
}
