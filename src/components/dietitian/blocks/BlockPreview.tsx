import {
  Check,
  Circle,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Video,
  Heart,
  Calendar,
} from "lucide-react";
import * as Icons from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { DynamicBlock } from "@/components/progress/shared/DynamicBlock";
import type { ComputedBlockData, WeekDayEntry } from "@/hooks/usePatientBlocks";

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

function getIcon(iconName: string, className = "h-3.5 w-3.5") {
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

/* ---------- shared primitives (matched to DynamicBlock) ---------- */

const cardShadow = "shadow-[0_6px_26px_-12px_hsl(145_30%_11%/0.30)]";

function DeltaPill({ diff, unit }: { diff: number; unit: string }) {
  const isDown = diff < 0;
  const isFlat = Math.abs(diff) < 0.1;
  if (isFlat) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        <Minus className="w-3 h-3" /> Stabil
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
      style={{
        backgroundColor: isDown
          ? "hsl(var(--nutrient-pro) / 0.12)"
          : "hsl(var(--nutrient-carb) / 0.16)",
        color: isDown ? "hsl(var(--nutrient-pro))" : "hsl(var(--nutrient-carb))",
      }}
    >
      {isDown ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
      {diff > 0 ? "+" : ""}
      {diff.toFixed(1)} {unit}
    </span>
  );
}

function MiniAreaChart({ data, id }: { data: { date: string; value: number }[]; id: string }) {
  return (
    <div className="h-[64px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={`prev-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2.4}
            fill={`url(#prev-grad-${id})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MonoLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground/70 ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------- New design preview (reuses the real client renderer) ---------- */

const NEW_RENDERERS = new Set([
  "weight_trend_card",
  "waist_trend_card",
  "meals_week_card",
  "logged_days_card",
]);

const PREVIEW_WEEK_DAYS: WeekDayEntry[] = [
  { letter: "M", count: 3, logged: true },
  { letter: "T", count: 2, logged: true },
  { letter: "O", count: 0, logged: false },
  { letter: "T", count: 4, logged: true },
  { letter: "F", count: 3, logged: true },
  { letter: "L", count: 0, logged: false },
  { letter: "S", count: 2, logged: true },
];

function buildPreviewData(
  title: string,
  icon: string,
  dataSource: string,
  dataConfig: Record<string, any>,
  displayConfig: Record<string, any>,
  blockType: string,
): ComputedBlockData {
  const renderAs = displayConfig.render_as as string;
  const isWaist = renderAs === "waist_trend_card";
  const sample = isWaist ? SAMPLE_CHART_DATA.waist : SAMPLE_CHART_DATA.weight;

  return {
    block: {
      id: "preview",
      patient_id: "preview",
      block_template_id: "preview",
      dietitian_id: "preview",
      sort_order: 0,
      is_active: true,
      override_title: null,
      manual_content: null,
      created_at: new Date().toISOString(),
      template: {
        id: "preview",
        title,
        description: "",
        icon,
        block_type: blockType,
        category: "system",
        data_source: dataSource,
        data_config: dataConfig,
        display_config: displayConfig,
      },
    },
    computedLabel: null,
    computedItems: [],
    computedValue: sample[sample.length - 1].value,
    computedTotal: null,
    chartData: sample.map((p, i) => ({
      ...p,
      iso: new Date(Date.now() - (sample.length - 1 - i) * 4 * 86400000)
        .toISOString()
        .slice(0, 10),
    })),
    chartMeta: { label: title, unit: isWaist ? "cm" : "kg" },
    source: "journal",
    weekDays: PREVIEW_WEEK_DAYS,
    renderAs,
  };
}

/* ---------- Main preview ---------- */

export function BlockPreview({
  title,
  icon,
  dataSource,
  dataConfig,
  displayConfig = {},
  blockType = "action",
  compact = false,
}: BlockPreviewProps) {
  const metric = dataConfig.metric || "";
  const progression = dataConfig.progression || "none";
  const progressionTarget = dataConfig.progression_target || 7;

  if (NEW_RENDERERS.has(displayConfig.render_as)) {
    return (
      <div className="pointer-events-none">
        <DynamicBlock
          data={buildPreviewData(title, icon, dataSource, dataConfig, displayConfig, blockType)}
        />
      </div>
    );
  }


  /* ---------- source badge (small, always journal-ish in preview) ---------- */
  const sourceBadge = (
    <span
      className="font-mono text-[8.5px] tracking-[0.16em] uppercase px-1.5 py-0.5 rounded-full"
      style={{
        backgroundColor: "hsl(var(--primary) / 0.09)",
        color: "hsl(var(--accent))",
      }}
    >
      Preview
    </span>
  );

  const renderContent = () => {
    /* ── Trend chart (health_tracking) ── */
    if (metric === "trend_chart") {
      const hm = dataConfig.health_metric || "weight";
      const periodDays = dataConfig.period_days || 30;
      const chartData = SAMPLE_CHART_DATA[hm] || SAMPLE_CHART_DATA.weight;
      const sliced =
        periodDays === "all" || periodDays >= 30
          ? chartData
          : chartData.slice(-Math.ceil(chartData.length * (periodDays / 30)));
      const unit = METRIC_UNITS[hm] || "kg";
      const first = sliced[0]?.value || 0;
      const last = sliced[sliced.length - 1]?.value || 0;
      const periodLabel =
        periodDays === "all" ? "Sedan start" : `Senaste ${periodDays} dagarna`;

      return (
        <div className="mt-2 -mx-[18px]">
          <div className="px-[18px] flex items-end justify-between mb-1">
            <div className="flex items-baseline gap-1">
              <span
                className="font-serif tabular-nums leading-none"
                style={{ fontSize: 36, color: "hsl(var(--primary))" }}
              >
                {last}
              </span>
              <MonoLabel>{unit}</MonoLabel>
            </div>
            <DeltaPill diff={last - first} unit={unit} />
          </div>
          <MiniAreaChart data={sliced} id={`preview-${hm}`} />
          <div className="px-[18px] pt-1">
            <MonoLabel>{periodLabel}</MonoLabel>
          </div>
        </div>
      );
    }

    /* ── Latest value ── */
    if (metric === "latest_value") {
      const hm = dataConfig.health_metric || "weight";
      const chartData = SAMPLE_CHART_DATA[hm] || SAMPLE_CHART_DATA.weight;
      const unit = METRIC_UNITS[hm] || "kg";
      const first = chartData[0]?.value || 0;
      const last = chartData[chartData.length - 1]?.value || 0;
      return (
        <div className="mt-2 flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span
              className="font-serif tabular-nums leading-none"
              style={{ fontSize: 36, color: "hsl(var(--primary))" }}
            >
              {last}
            </span>
            <MonoLabel>{unit}</MonoLabel>
          </div>
          <DeltaPill diff={last - first} unit={unit} />
        </div>
      );
    }

    /* ── Metric cards (current + change) ── */
    if (metric === "metric_cards") {
      const hm = dataConfig.health_metric || "weight";
      const unit = METRIC_UNITS[hm] || "kg";
      const chartData = SAMPLE_CHART_DATA[hm] || SAMPLE_CHART_DATA.weight;
      const current = chartData[chartData.length - 1]?.value || 0;
      const start = chartData[0]?.value || 0;
      const change = current - start;

      return (
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span
                className="font-serif tabular-nums leading-none"
                style={{ fontSize: 36, color: "hsl(var(--primary))" }}
              >
                {current}
              </span>
              <MonoLabel>{unit}</MonoLabel>
            </div>
            <MonoLabel className="mt-1 block">Nuvarande</MonoLabel>
          </div>
          <DeltaPill diff={change} unit={unit} />
        </div>
      );
    }

    /* ── Meal rhythm checklist ── */
    if (metric === "meal_rhythm") {
      const meals = [
        { label: "Frukost", done: true },
        { label: "Lunch", done: true },
        { label: "Middag", done: false },
        { label: "Mellanmål", done: false },
      ];
      return (
        <div className="mt-2 space-y-1.5">
          {meals.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <div
                className="w-[20px] h-[20px] rounded-md flex items-center justify-center flex-shrink-0"
                style={
                  m.done
                    ? { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                    : { backgroundColor: "hsl(var(--beige-3))", color: "hsl(var(--foreground) / 0.4)" }
                }
              >
                {m.done ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <Circle className="w-2.5 h-2.5" />}
              </div>
              <span
                className="text-[12px] font-medium"
                style={{
                  color: m.done
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--foreground) / 0.4)",
                }}
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>
      );
    }

    /* ── Meals per day ── */
    if (metric === "meals_per_day") {
      return (
        <div className="mt-2 flex items-end justify-between">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-serif tabular-nums leading-none"
              style={{ fontSize: 36, color: "hsl(var(--primary))" }}
            >
              3
            </span>
            <MonoLabel>måltider</MonoLabel>
          </div>
          <div className="flex gap-1">
            {[true, true, true, false, false].map((filled, i) => (
              <div
                key={i}
                className="w-2 h-7 rounded-full"
                style={{
                  backgroundColor: filled
                    ? "hsl(var(--primary))"
                    : "hsl(var(--beige-3))",
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    /* ── Regularity 30d — 15-col heatmap ── */
    if (metric === "regularity_30d") {
      const pattern = [
        1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1,
      ];
      const filled = pattern.filter(Boolean).length;
      return (
        <div className="mt-2 space-y-2">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span
                className="font-serif tabular-nums leading-none"
                style={{ fontSize: 30, color: "hsl(var(--primary))" }}
              >
                {filled}
              </span>
              <span className="text-[12px] text-muted-foreground">/30</span>
            </div>
            <MonoLabel>{Math.round((filled / 30) * 100)}%</MonoLabel>
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
          >
            {pattern.map((v, i) => (
              <div
                key={i}
                className="w-full aspect-square rounded-[3px]"
                style={{
                  backgroundColor: v
                    ? "hsl(var(--primary) / 0.82)"
                    : "hsl(var(--beige-3))",
                }}
              />
            ))}
          </div>
          <MonoLabel>Dagar med {dataConfig.threshold || 3}+ måltider</MonoLabel>
        </div>
      );
    }

    /* ── Meal structure 7d ── */
    if (metric === "structure_7d") {
      const days = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
      const mealCounts = [3, 4, 3, 2, 3, 4, 3];
      return (
        <div className="mt-2 space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-serif tabular-nums leading-none"
              style={{ fontSize: 30, color: "hsl(var(--primary))" }}
            >
              3.1
            </span>
            <MonoLabel>snitt/dag</MonoLabel>
          </div>
          <div className="flex gap-1 items-end h-[36px]">
            {days.map((d, i) => (
              <div key={d} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${(mealCounts[i] / 5) * 100}%`,
                    backgroundColor:
                      mealCounts[i] >= 3
                        ? "hsl(var(--primary) / 0.75)"
                        : "hsl(var(--nutrient-carb) / 0.6)",
                  }}
                />
                <MonoLabel>{d}</MonoLabel>
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ── Weekly checkin ── */
    if (metric === "weekly_checkin") {
      const logged = [true, true, true, true, false, true, false];
      const loggedCount = logged.filter(Boolean).length;
      return (
        <div className="mt-2 space-y-3">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span
                className="font-serif tabular-nums leading-none"
                style={{ fontSize: 30, color: "hsl(var(--primary))" }}
              >
                {loggedCount}
              </span>
              <span className="text-[12px] text-muted-foreground">/7 dagar</span>
            </div>
            <span
              className="font-serif italic text-[15px]"
              style={{ color: "hsl(var(--accent))" }}
            >
              Stabil vecka
            </span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "hsl(var(--primary) / 0.10)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${(loggedCount / 7) * 100}%`,
                backgroundColor: "hsl(var(--primary))",
              }}
            />
          </div>
        </div>
      );
    }

    /* ── Weekly overview ── */
    if (metric === "weekly_overview" || metric === "weekly_bars") {
      const days = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
      const active = [true, true, false, true, true, false, true];
      const activeCount = active.filter(Boolean).length;
      return (
        <div className="mt-2 space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-serif tabular-nums leading-none"
              style={{ fontSize: 30, color: "hsl(var(--primary))" }}
            >
              {activeCount}
            </span>
            <span className="text-[12px] text-muted-foreground">/7 aktiva</span>
          </div>
          <div className="flex gap-1">
            {days.map((d, i) => (
              <div
                key={i}
                className="flex-1 py-1 rounded-md text-center font-mono text-[8.5px] tracking-[0.12em] uppercase"
                style={{
                  backgroundColor: active[i]
                    ? "hsl(var(--primary) / 0.14)"
                    : "hsl(var(--beige-3))",
                  color: active[i]
                    ? "hsl(var(--primary))"
                    : "hsl(var(--foreground) / 0.4)",
                }}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ── Symptom count / pattern (terra bars) ── */
    if (
      metric === "symptom_count" ||
      metric === "symptom_by_time" ||
      metric === "symptom_after_meal" ||
      metric === "pattern_by_time"
    ) {
      const bars = [
        { label: "Mån", h: 0 },
        { label: "Tis", h: 1 },
        { label: "Ons", h: 0 },
        { label: "Tor", h: 2 },
        { label: "Fre", h: 0 },
        { label: "Lör", h: 1 },
        { label: "Sön", h: 0 },
      ];
      const maxH = 3;
      const total = bars.reduce((s, b) => s + b.h, 0);
      return (
        <div className="mt-2 space-y-2">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-serif tabular-nums leading-none"
                style={{ fontSize: 30, color: "hsl(var(--nutrient-cal))" }}
              >
                {total}
              </span>
              <MonoLabel>symptom / 7d</MonoLabel>
            </div>
          </div>
          <div className="flex items-end gap-1 h-[36px]">
            {bars.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.max((b.h / maxH) * 100, 6)}%`,
                    backgroundColor:
                      b.h > 0 ? "hsl(var(--nutrient-cal) / 0.75)" : "hsl(var(--beige-3))",
                  }}
                />
                <MonoLabel>{b.label}</MonoLabel>
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ── Symptom free days (moss tinted feel) ── */
    if (metric === "symptom_free_days") {
      const period = dataConfig.period_days || 7;
      const freeDays = 5;
      return (
        <div className="mt-2 space-y-2">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span
                className="font-serif tabular-nums leading-none"
                style={{ fontSize: 34, color: "hsl(var(--primary))" }}
              >
                {freeDays}
              </span>
              <span className="text-[12px] text-muted-foreground">/{period}</span>
            </div>
            <MonoLabel>{Math.round((freeDays / period) * 100)}%</MonoLabel>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: period }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{
                  backgroundColor:
                    i < freeDays
                      ? "hsl(var(--nutrient-pro))"
                      : "hsl(var(--beige-3))",
                }}
              />
            ))}
          </div>
          <MonoLabel>Symptomfria dagar</MonoLabel>
        </div>
      );
    }

    /* ── Milestones / behavior goals ── */
    if (metric === "milestone_progress" || metric === "milestones") {
      const milestones = [
        { label: "Ät fibrer 3 gånger denna veckan", done: true },
        { label: "Logga alla måltider i 5 dagar", done: true },
        { label: "Prova ett nytt mellanmål", done: false },
      ];
      const doneCount = milestones.filter((m) => m.done).length;
      return (
        <div className="mt-2 space-y-2">
          <MonoLabel>Aktuell fas</MonoLabel>
          <div className="space-y-1.5">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="w-[20px] h-[20px] rounded-md flex items-center justify-center flex-shrink-0 mt-[1px]"
                  style={
                    m.done
                      ? {
                          backgroundColor: "hsl(var(--primary))",
                          color: "hsl(var(--primary-foreground))",
                        }
                      : {
                          backgroundColor: "transparent",
                          border: "1.5px solid hsl(var(--foreground) / 0.22)",
                        }
                  }
                >
                  {m.done && <Check className="w-3 h-3" strokeWidth={2.5} />}
                </div>
                <span
                  className="text-[12px] leading-snug"
                  style={{
                    color: m.done
                      ? "hsl(var(--foreground) / 0.4)"
                      : "hsl(var(--foreground))",
                    textDecoration: m.done ? "line-through" : undefined,
                  }}
                >
                  {m.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "hsl(var(--beige-3))" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(doneCount / milestones.length) * 100}%`,
                  backgroundColor: "hsl(var(--primary))",
                }}
              />
            </div>
            <MonoLabel>
              {doneCount}/{milestones.length}
            </MonoLabel>
          </div>
        </div>
      );
    }

    /* ── Macro value ── */
    if (metric === "macro_value") {
      return (
        <div className="mt-2 flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span
              className="font-serif tabular-nums leading-none"
              style={{ fontSize: 36, color: "hsl(var(--primary))" }}
            >
              68
            </span>
            <MonoLabel>g protein</MonoLabel>
          </div>
          <div className="text-right">
            <MonoLabel>Mål 80g</MonoLabel>
            <div
              className="w-16 h-1.5 rounded-full overflow-hidden mt-1"
              style={{ backgroundColor: "hsl(var(--beige-3))" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: "85%", backgroundColor: "hsl(var(--primary))" }}
              />
            </div>
          </div>
        </div>
      );
    }

    /* ── Plan description (focus card, tinted terra) ── */
    if (metric === "plan_description") {
      return (
        <div
          className="mt-2 rounded-[14px] p-3 border relative overflow-hidden"
          style={{
            backgroundColor: "hsl(var(--nutrient-cal) / 0.08)",
            borderColor: "hsl(var(--nutrient-cal) / 0.18)",
          }}
        >
          <div
            className="flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.16em] uppercase mb-1.5"
            style={{ color: "hsl(var(--nutrient-cal))" }}
          >
            <Heart className="w-2.5 h-2.5" strokeWidth={1.8} />
            Dagens fokus
          </div>
          <p
            className="font-serif italic leading-snug"
            style={{ fontSize: 15, color: "hsl(var(--primary))" }}
          >
            "Du gör framsteg varje dag — lyssna på din kropp."
          </p>
          <MonoLabel className="mt-1.5 block">Från behandlingsplanen</MonoLabel>
        </div>
      );
    }

    /* ── Next appointment (filled green) ── */
    if (metric === "next_appointment") {
      return (
        <div
          className="mt-2 rounded-[14px] p-3"
          style={{
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "hsl(var(--primary-foreground) / 0.16)" }}
            >
              <Video className="w-4 h-4" style={{ color: "hsl(var(--primary-foreground))" }} />
            </div>
            <div className="min-w-0">
              <div
                className="font-serif leading-tight"
                style={{ fontSize: 16, color: "hsl(var(--primary-foreground))" }}
              >
                Tis 25 mar
              </div>
              <div
                className="font-mono text-[9px] tracking-[0.14em] uppercase mt-0.5"
                style={{ color: "hsl(var(--primary-foreground) / 0.7)" }}
              >
                kl 10:00 · videosamtal
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ── Fallback ── */
    return (
      <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2">
        Innehåll sätts per patient av coachen
      </p>
    );
  };

  return (
    <div
      className={`rounded-[18px] border ${cardShadow} ${
        compact ? "p-[14px]" : "p-[18px]"
      }`}
      style={{
        backgroundColor: "hsl(var(--secondary))",
        borderColor: "hsl(var(--foreground) / 0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.10)",
              color: "hsl(var(--primary))",
            }}
          >
            {getIcon(icon, "h-3.5 w-3.5")}
          </div>
          <h4
            className="font-semibold truncate"
            style={{ fontSize: 13, color: "hsl(var(--foreground))" }}
          >
            {title || "Namnlöst block"}
          </h4>
        </div>
        {sourceBadge}
      </div>

      {renderContent()}

      {/* Progression footer */}
      {progression !== "none" && (
        <div
          className="mt-3 pt-2.5 border-t"
          style={{ borderColor: "hsl(var(--foreground) / 0.08)" }}
        >
          {progression === "streak" && (
            <div className="flex items-center gap-2">
              <Flame className="h-3.5 w-3.5" style={{ color: "hsl(var(--nutrient-cal))" }} />
              <span className="text-[11px] font-medium tabular-nums text-foreground">
                4 dagar i rad
              </span>
              <div className="flex gap-0.5 ml-auto">
                {Array.from({ length: Math.min(progressionTarget, 10) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        i < 4
                          ? "hsl(var(--nutrient-cal))"
                          : "hsl(var(--beige-3))",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {progression === "weekly_goal" && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium tabular-nums text-foreground">
                3/{progressionTarget} dagar
              </span>
              <div className="flex gap-0.5 ml-auto">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        i < 3 ? "hsl(var(--primary))" : "hsl(var(--beige-3))",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {progression === "daily_check" && (
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" style={{ color: "hsl(var(--nutrient-pro))" }} />
              <span
                className="text-[11px] font-medium"
                style={{ color: "hsl(var(--nutrient-pro))" }}
              >
                Avklarat idag
              </span>
            </div>
          )}
          {progression === "time_limited" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <MonoLabel>
                  Dag 2 av {progressionTarget}
                </MonoLabel>
                <MonoLabel>
                  {Math.round((2 / progressionTarget) * 100)}%
                </MonoLabel>
              </div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "hsl(var(--beige-3))" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(2 / progressionTarget) * 100}%`,
                    backgroundColor: "hsl(var(--primary))",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
