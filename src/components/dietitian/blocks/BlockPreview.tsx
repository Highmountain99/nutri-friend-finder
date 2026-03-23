import { Card } from "@/components/ui/card";
import { Check, Circle, Flame, TrendingUp, TrendingDown, Minus, Calendar, Clock, Video, Heart } from "lucide-react";
import * as Icons from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";

interface BlockPreviewProps {
  title: string;
  description?: string;
  icon: string;
  dataSource: string;
  dataConfig: Record<string, any>;
  displayConfig?: Record<string, any>;
  blockType?: string;
  compact?: boolean;
}

function getIcon(iconName: string, className = "h-4 w-4") {
  const Icon = (Icons as any)[iconName];
  return Icon ? <Icon className={className} /> : <Icons.Square className={className} />;
}

const SAMPLE_CHART_DATA: Record<string, { date: string; value: number }[]> = {
  weight: [
    { date: "1 mar", value: 92 }, { date: "5 mar", value: 91.2 }, { date: "10 mar", value: 90.5 },
    { date: "14 mar", value: 89.8 }, { date: "18 mar", value: 89 }, { date: "22 mar", value: 88.4 },
    { date: "26 mar", value: 87.6 }, { date: "30 mar", value: 86.5 },
  ],
  waist: [
    { date: "1 mar", value: 98 }, { date: "8 mar", value: 97 }, { date: "15 mar", value: 95.5 },
    { date: "22 mar", value: 94 }, { date: "30 mar", value: 92 },
  ],
  blood_pressure_systolic: [
    { date: "1 mar", value: 145 }, { date: "8 mar", value: 140 }, { date: "15 mar", value: 136 },
    { date: "22 mar", value: 133 }, { date: "30 mar", value: 130 },
  ],
  blood_pressure_diastolic: [
    { date: "1 mar", value: 95 }, { date: "8 mar", value: 92 }, { date: "15 mar", value: 89 },
    { date: "22 mar", value: 87 }, { date: "30 mar", value: 85 },
  ],
  bmi: [
    { date: "1 mar", value: 30.1 }, { date: "8 mar", value: 29.6 }, { date: "15 mar", value: 29.1 },
    { date: "22 mar", value: 28.7 }, { date: "30 mar", value: 28.3 },
  ],
  blood_sugar_fasting: [
    { date: "1 mar", value: 7.8 }, { date: "8 mar", value: 7.4 }, { date: "15 mar", value: 7.1 },
    { date: "22 mar", value: 6.8 }, { date: "30 mar", value: 6.5 },
  ],
};

const METRIC_UNITS: Record<string, string> = {
  weight: "kg", waist: "cm", blood_pressure_systolic: "mmHg",
  blood_pressure_diastolic: "mmHg", bmi: "", blood_sugar_fasting: "mmol/L",
};

// ─── Reusable mini-components ───

function TrendBadge({ first, last, unit }: { first: number; last: number; unit: string }) {
  const diff = last - first;
  const isDown = diff < 0;
  const isStable = Math.abs(diff) < 0.3;
  return (
    <div className={`flex items-center gap-1 text-xs font-semibold tabular-nums ${
      isStable ? "text-muted-foreground" : isDown ? "text-emerald-600" : "text-amber-600"
    }`}>
      {isStable ? <Minus className="h-3 w-3" /> : isDown ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {diff > 0 ? "+" : ""}{diff.toFixed(1)} {unit}
    </div>
  );
}

function MiniAreaChart({ data, id }: { data: { date: string; value: number }[]; id: string }) {
  return (
    <div className="h-[72px] w-full -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={`prev-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill={`url(#prev-grad-${id})`} dot={false} activeDot={{ r: 3, fill: "hsl(var(--primary))" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function HeatmapGrid({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="flex flex-wrap gap-[3px]">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${i < filled ? "bg-primary/70" : "bg-muted"}`} />
      ))}
    </div>
  );
}

// ─── Main Preview ───

export function BlockPreview({ title, description, icon, dataSource, dataConfig, displayConfig = {}, blockType = "action", compact = false }: BlockPreviewProps) {
  const metric = dataConfig.metric || "";
  const progression = dataConfig.progression || "none";
  const progressionTarget = dataConfig.progression_target || 7;

  const renderContent = () => {
    // ── Trend chart (health_tracking) ──
    if (metric === "trend_chart") {
      const hm = dataConfig.health_metric || "weight";
      const chartData = SAMPLE_CHART_DATA[hm] || SAMPLE_CHART_DATA.weight;
      const unit = METRIC_UNITS[hm] || "kg";
      const first = chartData[0]?.value || 0;
      const last = chartData[chartData.length - 1]?.value || 0;

      return (
        <div className="mt-2 space-y-1">
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold tabular-nums text-foreground">{last}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span></span>
            <TrendBadge first={first} last={last} unit={unit} />
          </div>
          <MiniAreaChart data={chartData} id={`preview-${hm}`} />
          <p className="text-[10px] text-muted-foreground text-center">Senaste 30 dagarna</p>
        </div>
      );
    }

    // ── Latest value ──
    if (metric === "latest_value") {
      const hm = dataConfig.health_metric || "weight";
      const chartData = SAMPLE_CHART_DATA[hm] || SAMPLE_CHART_DATA.weight;
      const unit = METRIC_UNITS[hm] || "kg";
      const first = chartData[0]?.value || 0;
      const last = chartData[chartData.length - 1]?.value || 0;

      return (
        <div className="flex items-end justify-between mt-2">
          <span className="text-3xl font-bold tabular-nums text-foreground">{last}</span>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-muted-foreground">{unit}</span>
            <TrendBadge first={first} last={last} unit={unit} />
          </div>
        </div>
      );
    }

    // ── Metric cards (weight metrics, blood sugar metrics) ──
    if (metric === "metric_cards") {
      const hm = dataConfig.health_metric || "weight";
      const unit = METRIC_UNITS[hm] || "kg";
      const chartData = SAMPLE_CHART_DATA[hm] || SAMPLE_CHART_DATA.weight;
      const current = chartData[chartData.length - 1]?.value || 0;
      const start = chartData[0]?.value || 0;
      const change = current - start;

      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-[10px] text-muted-foreground">Nuvarande</p>
            <p className="text-lg font-bold tabular-nums text-foreground">{current}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span></p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-[10px] text-muted-foreground">Förändring</p>
            <p className={`text-lg font-bold tabular-nums ${change < 0 ? "text-emerald-600" : "text-amber-600"}`}>
              {change > 0 ? "+" : ""}{change.toFixed(1)}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>
            </p>
          </div>
        </div>
      );
    }

    // ── Meal rhythm checklist ──
    if (metric === "meal_rhythm") {
      const meals = [
        { label: "Frukost", time: "07:45", done: true },
        { label: "Lunch", time: "12:15", done: true },
        { label: "Middag", time: "—", done: false },
        { label: "Mellanmål", time: "—", done: false },
      ];
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {meals.map((m) => (
            <div key={m.label} className={`flex items-center gap-2 p-2 rounded-lg ${m.done ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/50"}`}>
              {m.done ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />}
              <div className="min-w-0">
                <p className={`text-xs font-medium ${m.done ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
                {m.done && <p className="text-[10px] text-muted-foreground">{m.time}</p>}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // ── Meals per day ──
    if (metric === "meals_per_day") {
      return (
        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold tabular-nums text-foreground">3</span>
            <span className="text-sm text-muted-foreground ml-1.5">måltider</span>
          </div>
          <div className="flex gap-1">
            {[true, true, true, false, false].map((filled, i) => (
              <div key={i} className={`w-3 h-8 rounded-full ${filled ? "bg-primary/70" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      );
    }

    // ── Regularity 30d ──
    if (metric === "regularity_30d") {
      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold tabular-nums text-foreground">22<span className="text-sm font-normal text-muted-foreground ml-0.5">/30</span></span>
            <span className="text-xs text-emerald-600 font-medium">73%</span>
          </div>
          <HeatmapGrid filled={22} total={30} />
          <p className="text-[10px] text-muted-foreground">Dagar med {dataConfig.threshold || 3}+ måltider</p>
        </div>
      );
    }

    // ── Meal structure 7d ──
    if (metric === "structure_7d") {
      const days = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
      const mealCounts = [3, 4, 3, 2, 3, 4, 3];
      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tabular-nums text-foreground">3.1</span>
            <span className="text-xs text-muted-foreground">mål/dag i snitt</span>
          </div>
          <div className="flex gap-1 items-end h-[40px]">
            {days.map((d, i) => (
              <div key={d} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                <div className={`w-full rounded-t ${mealCounts[i] >= 3 ? "bg-primary/60" : "bg-amber-400/60"}`}
                     style={{ height: `${(mealCounts[i] / 5) * 100}%` }} />
                <span className="text-[8px] text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── Weekly checkin ──
    if (metric === "weekly_checkin") {
      const days = ["M", "T", "O", "T", "F", "L", "S"];
      const logged = [true, true, true, true, false, true, false];
      const loggedCount = logged.filter(Boolean).length;
      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold tabular-nums text-foreground">{loggedCount}<span className="text-sm font-normal text-muted-foreground ml-0.5">/7 dagar</span></span>
            <span className="text-xs text-emerald-600 font-medium">Stabil</span>
          </div>
          <div className="flex gap-1.5">
            {days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
                  logged[i] ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}>{d}</div>
                {logged[i] && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── Weekly overview ──
    if (metric === "weekly_overview") {
      const days = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
      const active = [true, true, false, true, true, false, true];
      const activeCount = active.filter(Boolean).length;
      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold tabular-nums text-foreground">{activeCount}<span className="text-sm font-normal text-muted-foreground ml-0.5">/7</span></span>
            <span className="text-xs text-muted-foreground">aktiva dagar</span>
          </div>
          <div className="flex gap-1">
            {days.map((d, i) => (
              <div key={i} className={`flex-1 py-1.5 rounded-md text-center text-[9px] font-medium ${
                active[i] ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              }`}>{d}</div>
            ))}
          </div>
        </div>
      );
    }

    // ── Symptom count / by time / after meal / pattern_by_time ──
    if (metric === "symptom_count" || metric === "symptom_by_time" || metric === "symptom_after_meal" || metric === "pattern_by_time") {
      const bars = [
        { label: "Mån", h: 0 }, { label: "Tis", h: 1 }, { label: "Ons", h: 0 },
        { label: "Tor", h: 2 }, { label: "Fre", h: 0 }, { label: "Lör", h: 1 }, { label: "Sön", h: 0 },
      ];
      const maxH = 3;
      return (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold tabular-nums text-foreground">4</span>
            <span className="text-xs text-muted-foreground">symptom / 7d</span>
          </div>
          <div className="flex items-end gap-1 h-[40px]">
            {bars.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className={`w-full rounded-t ${b.h > 0 ? "bg-amber-400/70" : "bg-muted"}`} style={{ height: `${Math.max((b.h / maxH) * 100, 8)}%` }} />
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {bars.map((b, i) => (
              <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{b.label}</span>
            ))}
          </div>
        </div>
      );
    }

    // ── Symptom free days ──
    if (metric === "symptom_free_days") {
      const period = dataConfig.period_days || 7;
      const freeDays = 5;
      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold tabular-nums text-foreground">{freeDays}<span className="text-sm font-normal text-muted-foreground ml-0.5">/{period}</span></span>
            <span className="text-xs text-emerald-600 font-medium">{Math.round((freeDays / period) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-emerald-500 rounded-full h-2 transition-all" style={{ width: `${(freeDays / period) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground">symptomfria dagar</p>
        </div>
      );
    }

    // ── Milestone progress / milestones ──
    if (metric === "milestone_progress" || metric === "milestones") {
      const milestones = [
        { label: "Regelbunden frukost", done: true },
        { label: "3 mål/dag i 5 dagar", done: true },
        { label: "Prova nytt mellanmål", done: false },
      ];
      const doneCount = milestones.filter(m => m.done).length;
      return (
        <div className="mt-3 space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              {m.done
                ? <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><Check className="h-3 w-3 text-emerald-600" /></div>
                : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/20" />
              }
              <span className={`text-xs ${m.done ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>{m.label}</span>
            </div>
          ))}
          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
            <div className="bg-primary rounded-full h-1.5" style={{ width: `${(doneCount / milestones.length) * 100}%` }} />
          </div>
        </div>
      );
    }

    // ── Macro value ──
    if (metric === "macro_value") {
      return (
        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold tabular-nums text-foreground">68</span>
            <span className="text-sm text-muted-foreground ml-1">g protein</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Mål: 80g</p>
            <div className="w-16 bg-muted rounded-full h-1.5 mt-1">
              <div className="bg-primary rounded-full h-1.5" style={{ width: "85%" }} />
            </div>
          </div>
        </div>
      );
    }

    // ── Plan description (focus card) ──
    if (metric === "plan_description") {
      return (
        <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-foreground leading-relaxed">
            {description || "Fokus denna vecka: bygg en trygg måltidsrutin med tre huvudmål"}
          </p>
        </div>
      );
    }

    // ── Next appointment ──
    if (metric === "next_appointment") {
      return (
        <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="p-2 rounded-lg bg-primary/10">
            <Video className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Tis 25 mar, 10:00</p>
            <p className="text-[10px] text-muted-foreground">Videosamtal · 30 min</p>
          </div>
        </div>
      );
    }

    // ── Custom text / manual / fallback ──
    if (metric === "custom_text" || !metric) {
      return (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {description || "Innehåll sätts per patient av dietisten"}
        </p>
      );
    }

    // Catch-all fallback
    return (
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
        {description || "Innehåll sätts per patient av dietisten"}
      </p>
    );
  };

  return (
    <div className={compact ? "overflow-hidden" : ""}>
      <Card className={`bg-card overflow-hidden ${compact ? "p-3 border-0 shadow-none" : "p-4 border border-border shadow-sm"}`}>
        {/* Header: icon + title */}
        <div className="flex items-center gap-2">
          <div className={`rounded-lg bg-primary/8 text-primary shrink-0 ${compact ? "p-1" : "p-1.5"}`}>
            {getIcon(icon, compact ? "h-3 w-3" : "h-4 w-4")}
          </div>
          <h4 className={`font-semibold truncate ${compact ? "text-xs" : "text-sm"}`}>{title || "Namnlöst block"}</h4>
        </div>

      {/* Visual content */}
      {renderContent()}

      {/* Progression footer */}
      {progression !== "none" && (
        <div className="mt-3 pt-2.5 border-t border-border/50">
          {progression === "streak" && (
            <div className="flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-medium tabular-nums">4 dagar i rad</span>
              <div className="flex gap-0.5 ml-auto">
                {Array.from({ length: Math.min(progressionTarget, 10) }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i < 4 ? "bg-orange-400" : "bg-muted"}`} />
                ))}
              </div>
            </div>
          )}
          {progression === "weekly_goal" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium tabular-nums">3/{progressionTarget} dagar</span>
              <div className="flex gap-0.5 ml-auto">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i < 3 ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>
            </div>
          )}
          {progression === "daily_check" && (
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">Avklarat idag</span>
            </div>
          )}
          {progression === "time_limited" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tabular-nums">Dag 2 av {progressionTarget}</span>
                <span className="text-[10px] text-muted-foreground">{Math.round((2 / progressionTarget) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary rounded-full h-1.5" style={{ width: `${(2 / progressionTarget) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
      </Card>
    </div>
  );
}