import { useState } from "react";
import { Button } from "@/components/ui/button";

import {
  Check,
  Circle,
  TrendingDown,
  TrendingUp,
  Calendar,
  Heart,
  Target,
  Activity,
  AlertTriangle,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import * as Icons from "lucide-react";
import { ComputedBlockData } from "@/hooks/usePatientBlocks";
import { ResponsiveContainer, Area, AreaChart } from "recharts";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useMyDietitian } from "@/hooks/useMyDietitian";

/* ---------------- Shared primitives ---------------- */

const cardShadow = "shadow-[0_6px_26px_-12px_hsl(145_30%_11%/0.30)]";

function getIcon(iconName: string, className = "h-3.5 w-3.5") {
  const Icon = (Icons as any)[iconName];
  return Icon ? <Icon className={className} /> : <Icons.Square className={className} />;
}

function SourceBadge({ source }: { source: "journal" | "dietitian" | "manual" }) {
  if (source === "journal")
    return (
      <span
        className="font-mono text-[8.5px] tracking-[0.16em] uppercase px-2 py-1 rounded-full"
        style={{
          backgroundColor: "hsl(var(--primary) / 0.09)",
          color: "hsl(var(--accent))",
        }}
      >
        Från journal
      </span>
    );
  if (source === "dietitian")
    return (
      <span
        className="font-mono text-[8.5px] tracking-[0.16em] uppercase px-2 py-1 rounded-full"
        style={{
          backgroundColor: "hsl(var(--nutrient-fat) / 0.14)",
          color: "hsl(var(--nutrient-fat))",
        }}
      >
        Din coach
      </span>
    );
  return null;
}

function BlockHeader({
  icon,
  title,
  source,
  onGreen,
}: {
  icon: React.ReactNode;
  title: string;
  source: "journal" | "dietitian" | "manual";
  onGreen?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
          style={{
            backgroundColor: onGreen
              ? "hsl(var(--primary-foreground) / 0.18)"
              : "hsl(var(--primary) / 0.10)",
            color: onGreen ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))",
          }}
        >
          {icon}
        </div>
        <h3
          className="font-semibold"
          style={{
            fontSize: 13.5,
            color: onGreen ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
          }}
        >
          {title}
        </h3>
      </div>
      {!onGreen && <SourceBadge source={source} />}
    </div>
  );
}

function CardShell({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[20px] p-[18px] border ${cardShadow} ${className}`}
      style={{
        backgroundColor: "hsl(var(--secondary))",
        borderColor: "hsl(var(--foreground) / 0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------- UTVECKLING blocks (curated set) ---------------- */

const C = {
  cream: "#F5EFE2",
  green: "#1F3A2E",
  ink: "#1F2A22",
  gold: "#DCC08A",
  sage: "#B7C4A9",
  sageDark: "#8FAF7E",
  apricot: "#D9A488",
  scrim: "rgba(31,42,34,0.5)",
  soft: "rgba(31,42,34,0.6)",
  faint: "rgba(31,42,34,0.5)",
};

const cardTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: C.soft,
};

function Sparkline({ points, fill }: { points: number[]; fill: string }) {
  if (points.length < 2) {
    return (
      <div
        className="w-full flex items-center"
        style={{ height: 64, color: C.faint, fontSize: 11 }}
      >
        För lite data för en kurva
      </div>
    );
  }
  const w = 300;
  const h = 64;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => [i * step, h - 6 - ((p - min) / span) * (h - 14)]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: 64, display: "block" }}
    >
      <path d={area} fill={fill} opacity={0.45} />
      <path d={line} fill="none" stroke={C.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const RANGES = [
  { key: "1v", top: "1v", sub: "Vecka", days: 7, caption: "Senaste veckan" },
  { key: "2v", top: "2v", sub: "Veckor", days: 14, caption: "Senaste 2 veckorna" },
  { key: "1m", top: "1m", sub: "Månad", days: 30, caption: "Senaste 30 dagarna" },
  { key: "all", top: "Allt", sub: "Start", days: null as number | null, caption: "Sedan start" },
];

function TrendFocusCard({
  title,
  unit,
  points,
  chipColor,
  fillColor,
}: {
  title: string;
  unit: string;
  points: { iso?: string; date: string; value: number }[];
  chipColor: string;
  fillColor: string;
}) {
  const [focused, setFocused] = useState(false);
  const [rangeKey, setRangeKey] = useState("1m");
  const range = RANGES.find((r) => r.key === rangeKey)!;

  const cutoff = range.days
    ? new Date(Date.now() - range.days * 86400000).toISOString().slice(0, 10)
    : null;
  let selected = cutoff ? points.filter((p) => (p.iso || "") >= cutoff) : points;
  if (selected.length < 2) selected = points.slice(-Math.max(2, selected.length));

  const values = selected.map((p) => p.value);
  const latest = points.length > 0 ? points[points.length - 1].value : null;
  const diff = values.length > 1 ? values[values.length - 1] - values[0] : null;
  const caption =
    range.days === null && points[0]?.date
      ? `Sedan start · ${points[0].date}`
      : range.caption;

  const card = (
    <div
      onClick={() => setFocused(true)}
      className="relative cursor-pointer"
      style={{
        backgroundColor: C.cream,
        borderRadius: 24,
        padding: "18px 18px 14px",
        zIndex: focused ? 60 : undefined,
      }}
    >
      <div className="flex items-center justify-between">
        <span style={cardTitleStyle}>{title}</span>
        {diff !== null && (
          <span
            style={{
              backgroundColor: chipColor,
              color: C.green,
              borderRadius: 999,
              padding: "3px 10px",
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            {diff > 0 ? "+" : "−"}
            {Math.abs(diff).toFixed(1).replace(".", ",")} {unit}
          </span>
        )}
      </div>

      <div style={{ marginTop: 8, marginBottom: 6 }}>
        <span
          className="font-serif"
          style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: C.ink }}
        >
          {latest !== null ? String(latest).replace(".", ",") : "—"}
        </span>
        <span style={{ fontSize: 18, marginLeft: 4, color: C.soft }}>{unit}</span>
      </div>

      <Sparkline points={values} fill={fillColor} />

      <div
        style={{
          marginTop: 8,
          fontWeight: 600,
          fontSize: 10.5,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.faint,
        }}
      >
        {caption}
      </div>
    </div>
  );

  if (!focused) return card;

  return (
    <>
      {card}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: C.scrim }}
        onClick={() => setFocused(false)}
      />
      <div className="fixed inset-x-0 z-[60] px-4" style={{ top: "50%", transform: "translateY(-50%)" }}>
        {card}
        <div className="flex items-center justify-center gap-3 mt-4">
          {RANGES.map((r) => {
            const active = r.key === rangeKey;
            return (
              <button
                key={r.key}
                onClick={(e) => {
                  e.stopPropagation();
                  setRangeKey(r.key);
                }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  backgroundColor: active ? C.green : C.cream,
                  color: active ? C.cream : C.green,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 13 }}>{r.top}</span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 8,
                    textTransform: "uppercase",
                    opacity: 0.75,
                  }}
                >
                  {r.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function MealsWeekCard({ title, days }: { title: string; days: { letter: string; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const avg = days.length ? days.reduce((s, d) => s + d.count, 0) / days.length : 0;
  const lowest = days.reduce((min, d, i) => (d.count < days[min].count ? i : min), 0);
  return (
    <div
      style={{ backgroundColor: C.cream, borderRadius: 24, padding: 18, height: "100%" }}
      className="flex flex-col"
    >
      <span style={cardTitleStyle}>{title}</span>
      <div style={{ marginTop: 8, marginBottom: 12 }}>
        <span className="font-serif" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, color: C.ink }}>
          {avg.toFixed(1).replace(".", ",")}
        </span>
        <span style={{ fontSize: 15, marginLeft: 4, color: C.soft }}>/dag</span>
      </div>
      <div className="flex items-end mt-auto" style={{ gap: 5, height: 44 }}>
        {days.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(12, (d.count / max) * 100)}%`,
              borderRadius: 6,
              backgroundColor: i === lowest && days[lowest].count < max ? C.gold : C.green,
            }}
          />
        ))}
      </div>
      <div className="flex" style={{ gap: 5, marginTop: 6 }}>
        {days.map((d, i) => (
          <span
            key={i}
            style={{ flex: 1, textAlign: "center", fontWeight: 600, fontSize: 8.5, color: C.faint }}
          >
            {d.letter}
          </span>
        ))}
      </div>
    </div>
  );
}

function LoggedDaysCard({
  title,
  days,
  loggedCount,
}: {
  title: string;
  days: { letter: string; logged: boolean }[];
  loggedCount: number;
}) {
  return (
    <div
      style={{ backgroundColor: C.sage, borderRadius: 24, padding: 18, height: "100%" }}
      className="flex flex-col"
    >
      <span style={cardTitleStyle}>{title}</span>
      <div style={{ marginTop: 8 }}>
        <span className="font-serif" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, color: C.ink }}>
          {loggedCount}
        </span>
        <span style={{ fontSize: 15, marginLeft: 4, color: C.soft }}>/{days.length}</span>
      </div>
      <div className="flex mt-auto" style={{ gap: 5, paddingTop: 16 }}>
        {days.map((d, i) => (
          <span
            key={i}
            style={{
              width: 26,
              height: 26,
              flex: "0 0 auto",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 9.5,
              backgroundColor: d.logged ? C.green : "rgba(245,239,226,0.55)",
              color: d.logged ? C.cream : "rgba(31,42,34,0.45)",
            }}
          >
            {d.letter}
          </span>
        ))}
      </div>
    </div>
  );
}


/* --------------------------- Main --------------------------- */

interface DynamicBlockProps {
  data: ComputedBlockData;
}

export function DynamicBlock({ data }: DynamicBlockProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dietitianProfile } = useMyDietitian();
  const dietitian = dietitianProfile
    ? {
        name: [dietitianProfile.first_name, dietitianProfile.last_name].filter(Boolean).join(" "),
      }
    : null;
  const {
    block,
    computedItems,
    computedValue,
    computedTotal,
    chartData,
    chartMeta,
    renderAs,
  } = data;
  const template = block.template;
  const title = block.override_title || template.title;

  /* ── 02 · Dagens fokus ── */
  if (renderAs === "focus_card") {
    return (
      <div
        className={`relative overflow-hidden rounded-[20px] p-[18px] border ${cardShadow}`}
        style={{
          backgroundColor: "hsl(var(--nutrient-cal) / 0.08)",
          borderColor: "hsl(var(--nutrient-cal) / 0.18)",
        }}
      >
        <div
          className="absolute -right-8 -bottom-8 w-[110px] h-[110px] rounded-full"
          style={{ backgroundColor: "hsl(var(--nutrient-cal) / 0.08)" }}
          aria-hidden
        />
        <div className="relative">
          <div
            className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.16em] uppercase mb-2.5"
            style={{ color: "hsl(var(--nutrient-cal))" }}
          >
            <Heart className="w-3 h-3" strokeWidth={1.6} />
            Dagens fokus
          </div>
          <p
            className="font-serif italic leading-[1.25] m-0"
            style={{ fontSize: 22, color: "hsl(var(--primary))" }}
          >
            {data.focusText || "Varje måltid är ett steg framåt — lita på processen."}
          </p>
          <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-muted-foreground/70 mt-2.5 block">
            — {dietitian?.name || "Din coach"}
          </span>
        </div>
      </div>
    );
  }

  /* ── 03 · Vikt (weight trend, featured wide) ── */
  if (renderAs === "weight_metrics_card" && chartMeta) {
    const latest = computedValue;
    const first = chartData && chartData.length > 0 ? chartData[0].value : null;
    const diff = latest !== null && first !== null ? latest - first : null;
    const isDown = diff !== null && diff < 0;
    const goalHint = chartMeta.unit === "kg" ? "Mål 73 kg" : "";

    return (
      <div
        className={`rounded-[20px] border overflow-hidden ${cardShadow}`}
        style={{
          backgroundColor: "hsl(var(--secondary))",
          borderColor: "hsl(var(--foreground) / 0.08)",
        }}
      >
        <div className="p-[18px] pb-2">
          <BlockHeader
            icon={getIcon(template.icon)}
            title={title}
            source="journal"
          />
          <div className="flex items-end justify-between mt-1">
            <div className="flex items-baseline gap-1">
              <span
                className="font-serif tabular-nums leading-none"
                style={{ fontSize: 46, color: "hsl(var(--primary))" }}
              >
                {latest ?? "—"}
              </span>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.08em]"
                style={{ color: "hsl(var(--foreground) / 0.4)" }}
              >
                {chartMeta.unit}
              </span>
            </div>
            {diff !== null && (
              <div
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                style={{
                  backgroundColor: "hsl(var(--nutrient-pro) / 0.12)",
                  color: "hsl(var(--nutrient-pro))",
                }}
              >
                {isDown ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                <span className="font-semibold text-[12.5px] tabular-nums">
                  {diff > 0 ? "+" : ""}
                  {diff.toFixed(1)} {chartMeta.unit}
                </span>
              </div>
            )}
          </div>
        </div>

        {chartData && chartData.length > 1 && (
          <div className="h-[92px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id={`wgrad-${block.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.6}
                  fill={`url(#wgrad-${block.id})`}
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-between px-[18px] pb-[14px] pt-1">
          <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground/70">
            Senaste {chartData?.length ?? 0} veckorna
          </span>
          {goalHint && (
            <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground/70">
              {goalHint}
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ── 04b · Måltidsrytm ── */
  if (renderAs === "meal_rhythm_card" && data.mealRhythm) {
    const logged = data.mealRhythm.filter((m) => m.done).length;
    return (
      <CardShell>
        <BlockHeader icon={<Calendar className="w-3.5 h-3.5" />} title={title} source="journal" />
        <div className="space-y-2">
          {data.mealRhythm.map((meal) => (
            <div key={meal.key} className="flex items-center gap-2.5">
              <div
                className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0"
                style={
                  meal.done
                    ? { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                    : { backgroundColor: "hsl(var(--beige-3))", color: "hsl(var(--foreground) / 0.4)" }
                }
              >
                {meal.done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Circle className="w-3 h-3" />}
              </div>
              <span
                className="text-[13px] font-medium"
                style={{
                  color: meal.done
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--foreground) / 0.4)",
                }}
              >
                {meal.label}
              </span>
            </div>
          ))}
        </div>
        <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground/70 mt-3">
          {logged} av {data.mealRhythm.length} loggade
        </p>
      </CardShell>
    );
  }

  /* ── 05 · Regelbundenhet (30-day heatmap, 15 cols) ── */
  if (renderAs === "regularity_grid" && data.regularityGrid) {
    return (
      <CardShell>
        <BlockHeader icon={<Activity className="w-3.5 h-3.5" />} title={title} source="journal" />
        <div
          className="grid gap-1 mb-3"
          style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
        >
          {data.regularityGrid.slice(0, 30).map((day, i) => (
            <div
              key={i}
              className="w-full aspect-square rounded-[4px]"
              style={{
                backgroundColor: day.hasThreePlus
                  ? "hsl(var(--primary) / 0.82)"
                  : day.count > 0
                  ? "hsl(var(--primary) / 0.30)"
                  : "hsl(var(--beige-3))",
              }}
              title={`${day.date}: ${day.count} måltider`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-[3px]"
              style={{ backgroundColor: "hsl(var(--primary) / 0.82)" }}
            />
            <span className="text-[11px] text-muted-foreground">3+ måltider</span>
          </div>
          <span className="text-[13px] font-semibold tabular-nums text-foreground">
            {data.daysWithThreePlus}/30 <span className="font-normal text-muted-foreground">dagar</span>
          </span>
        </div>
      </CardShell>
    );
  }

  /* ── 06 · Symptommönster ── */
  if (renderAs === "symptom_pattern_card" && data.symptomPatterns && data.symptomPatterns.length > 0) {
    const maxCount = Math.max(...data.symptomPatterns.map((p) => p.count));
    return (
      <CardShell>
        <BlockHeader icon={<AlertTriangle className="w-3.5 h-3.5" />} title={title} source="journal" />
        <div className="space-y-2">
          {data.symptomPatterns.map((p) => (
            <div key={p.timeLabel} className="grid grid-cols-[80px_1fr_28px] items-center gap-2">
              <span className="text-[12.5px] text-foreground">{p.timeLabel}</span>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "hsl(var(--beige-3))" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((p.count / maxCount) * 100, 100)}%`,
                    backgroundColor: "hsl(var(--nutrient-cal) / 0.75)",
                  }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground text-right tabular-nums">
                {p.count}×
              </span>
            </div>
          ))}
        </div>
        <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground/70 mt-3">
          Grupperade efter tid på dygnet
        </p>
      </CardShell>
    );
  }

  /* ── 07 · Veckans sammanfattning (tinted green2) ── */
  if (renderAs === "weekly_checkin_card" && data.weeklyCheckin) {
    const stabilityLabels = {
      stabil: "Stabil vecka",
      delvis: "Delvis stabil",
      oregelbunden: "Oregelbunden",
    } as const;

    const pct = (data.weeklyCheckin.loggedDays / 7) * 100;

    return (
      <div
        className={`rounded-[20px] p-[18px] border ${cardShadow}`}
        style={{
          backgroundColor: "hsl(var(--accent) / 0.07)",
          borderColor: "hsl(var(--accent) / 0.16)",
        }}
      >
        <BlockHeader icon={<Sparkles className="w-3.5 h-3.5" />} title={title} source="journal" />
        <div className="flex items-end gap-5 mt-1 mb-3">
          <div>
            <div
              className="font-serif leading-none"
              style={{ fontSize: 30, color: "hsl(var(--primary))" }}
            >
              {data.weeklyCheckin.loggedDays}
            </div>
            <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-muted-foreground/70 mt-1">
              Loggade dagar
            </div>
          </div>
          <div>
            <div
              className="font-serif leading-none"
              style={{ fontSize: 30, color: "hsl(var(--primary))" }}
            >
              {data.weeklyCheckin.averageMealsPerDay}
            </div>
            <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-muted-foreground/70 mt-1">
              Mål/dag
            </div>
          </div>
          <div className="ml-auto text-right">
            <div
              className="font-serif italic leading-tight"
              style={{ fontSize: 19, color: "hsl(var(--accent))" }}
            >
              {stabilityLabels[data.weeklyCheckin.stability]}
            </div>
            <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-muted-foreground/70 mt-0.5">
              Bedömning
            </div>
          </div>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "hsl(var(--primary) / 0.10)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: "hsl(var(--primary))" }}
          />
        </div>
      </div>
    );
  }

  /* ── 07b · Weekly overview (fallback minimal variant) ── */
  if (renderAs === "weekly_overview_card" && data.weeklyCheckin) {
    const pct = (data.weeklyCheckin.loggedDays / 7) * 100;
    return (
      <CardShell>
        <BlockHeader icon={<Calendar className="w-3.5 h-3.5" />} title={title} source="journal" />
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div
              className="font-serif leading-none"
              style={{ fontSize: 30, color: "hsl(var(--primary))" }}
            >
              {data.weeklyCheckin.loggedDays}
            </div>
            <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-muted-foreground/70 mt-1">
              Aktiva dagar
            </div>
          </div>
          <div>
            <div
              className="font-serif leading-none"
              style={{ fontSize: 30, color: "hsl(var(--primary))" }}
            >
              {data.weeklyCheckin.averageMealsPerDay}
            </div>
            <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-muted-foreground/70 mt-1">
              Mål/dag
            </div>
          </div>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "hsl(var(--primary) / 0.10)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: "hsl(var(--primary))" }}
          />
        </div>
      </CardShell>
    );
  }

  /* ── 08 · Beteendemål (checklist with strikethrough) ── */
  if (renderAs === "behavior_goals_card" && data.milestones && data.milestones.length > 0) {
    const done = data.milestones.filter((m) => m.is_completed).length;
    const total = data.milestones.length;
    const pct = (done / total) * 100;
    return (
      <CardShell>
        <BlockHeader icon={<Target className="w-3.5 h-3.5" />} title={title} source="dietitian" />
        <div className="space-y-2 mb-3">
          {data.milestones.slice(0, 6).map((m) => (
            <div key={m.id} className="flex items-start gap-2.5">
              <div
                className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0 mt-[1px]"
                style={
                  m.is_completed
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
                {m.is_completed && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
              </div>
              <span
                className="text-[13px] leading-snug"
                style={{
                  color: m.is_completed
                    ? "hsl(var(--foreground) / 0.4)"
                    : "hsl(var(--foreground))",
                  textDecoration: m.is_completed ? "line-through" : undefined,
                }}
              >
                {m.title}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "hsl(var(--beige-3))" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: "hsl(var(--primary))" }}
            />
          </div>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
            {done}/{total}
          </span>
        </div>
      </CardShell>
    );
  }

  /* ── 09 · Nästa samtal (filled green) ── */
  if (renderAs === "follow_up_card") {
    const initials =
      dietitian?.name
        ?.split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "ES";

    return (
      <div
        className={`rounded-[20px] p-[18px] border ${cardShadow}`}
        style={{
          backgroundColor: "hsl(var(--primary))",
          borderColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
        }}
      >
        <BlockHeader
          icon={<Calendar className="w-3.5 h-3.5" />}
          title="Nästa samtal"
          source="dietitian"
          onGreen
        />
        {data.nextAppointment ? (
          <>
            <div className="flex items-center gap-3 mt-3 mb-4">
              <div
                className="w-[46px] h-[46px] rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: "hsl(var(--primary-foreground) / 0.14)",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                <span className="font-serif text-[15px]">{initials}</span>
              </div>
              <div className="min-w-0">
                <div
                  className="font-serif leading-tight"
                  style={{ fontSize: 22, color: "hsl(var(--primary-foreground))" }}
                >
                  {format(new Date(data.nextAppointment.appointment_date), "EEEE d MMM", { locale: sv })}
                </div>
                <div
                  className="text-[12px] mt-0.5"
                  style={{ color: "hsl(var(--primary-foreground) / 0.7)" }}
                >
                  kl {format(new Date(data.nextAppointment.appointment_date), "HH:mm")} · videosamtal med {dietitian?.name?.split(" ")[0] || "din coach"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/messages")}
                className="flex-1 rounded-full px-4 py-2.5 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: "hsl(var(--primary-foreground))",
                  color: "hsl(var(--primary))",
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chatta
              </button>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <p
              className="text-[13px] mb-3"
              style={{ color: "hsl(var(--primary-foreground) / 0.7)" }}
            >
              Inget planerat samtal
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ── 04a · Symptomfria dagar (moss tinted) ── */
  if (renderAs === "symptom_free_card" && computedValue !== null && computedTotal !== null) {
    const dots = Array.from({ length: computedTotal }, (_, i) => i < computedValue);
    return (
      <div
        className={`rounded-[20px] p-[18px] border ${cardShadow}`}
        style={{
          backgroundColor: "hsl(var(--nutrient-pro) / 0.10)",
          borderColor: "hsl(var(--nutrient-pro) / 0.16)",
        }}
      >
        <BlockHeader icon={<Check className="w-3.5 h-3.5" />} title="Symptomfria" source="journal" />
        <div className="flex items-baseline gap-1 mt-2">
          <span
            className="font-serif leading-none"
            style={{ fontSize: 40, color: "hsl(var(--primary))" }}
          >
            {computedValue}
          </span>
          <span className="text-[13px] text-muted-foreground">/ {computedTotal}</span>
        </div>
        <div className="flex gap-1 mt-3 mb-2">
          {dots.map((filled, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{
                backgroundColor: filled ? "hsl(var(--nutrient-pro))" : "hsl(var(--beige-3))",
              }}
            />
          ))}
        </div>
        <p className="text-[12px] text-muted-foreground leading-snug">
          ↑ Bättre än förra veckan
        </p>
      </div>
    );
  }

  /* ── Symptom count (simple metric) ── */
  if (renderAs === "symptom_count_card") {
    return (
      <CardShell>
        <BlockHeader
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          title={title}
          source="journal"
        />
        <div className="flex items-baseline gap-1.5 mt-1">
          <span
            className="font-serif leading-none tabular-nums"
            style={{ fontSize: 40, color: "hsl(var(--nutrient-cal))" }}
          >
            {computedValue || 0}
          </span>
          {data.computedLabel && (
            <span className="text-[12px] text-muted-foreground">{data.computedLabel}</span>
          )}
        </div>
      </CardShell>
    );
  }

  /* ── Generic trend chart ── */
  if ((renderAs === "trend_chart" || !renderAs) && chartData && chartData.length > 0 && chartMeta) {
    const latest = chartData[chartData.length - 1].value;
    const first = chartData[0].value;
    const diff = latest - first;
    const isDown = diff < 0;

    return (
      <div
        className={`rounded-[20px] border overflow-hidden ${cardShadow}`}
        style={{
          backgroundColor: "hsl(var(--secondary))",
          borderColor: "hsl(var(--foreground) / 0.08)",
        }}
      >
        <div className="p-[18px] pb-2">
          <BlockHeader icon={getIcon(template.icon)} title={title} source="journal" />
          <div className="flex items-end justify-between mt-1">
            <div className="flex items-baseline gap-1">
              <span
                className="font-serif tabular-nums leading-none"
                style={{ fontSize: 40, color: "hsl(var(--primary))" }}
              >
                {latest.toFixed(1)}
              </span>
              <span
                className="font-mono text-[10px] uppercase tracking-[0.08em]"
                style={{ color: "hsl(var(--foreground) / 0.4)" }}
              >
                {chartMeta.unit}
              </span>
            </div>
            <div
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums"
              style={{
                backgroundColor: isDown
                  ? "hsl(var(--nutrient-pro) / 0.12)"
                  : "hsl(var(--nutrient-carb) / 0.14)",
                color: isDown ? "hsl(var(--nutrient-pro))" : "hsl(var(--nutrient-carb))",
              }}
            >
              {isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              {diff > 0 ? "+" : ""}
              {diff.toFixed(1)} {chartMeta.unit}
            </div>
          </div>
        </div>

        <div className="h-[90px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${block.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2.6}
                fill={`url(#grad-${block.id})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between px-[18px] pb-[14px] pt-1">
          <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground/70">
            Senaste {chartData.length} {chartData.length > 7 ? "dagarna" : "mätningarna"}
          </span>
        </div>
      </div>
    );
  }

  /* ── Meal structure fallback ── */
  if (renderAs === "meal_structure_card" && data.mealStructure) {
    return (
      <CardShell>
        <BlockHeader icon={<Activity className="w-3.5 h-3.5" />} title={title} source="journal" />
        <div className="flex items-baseline gap-2 mt-1">
          <span
            className="font-serif leading-none"
            style={{ fontSize: 40, color: "hsl(var(--primary))" }}
          >
            {data.mealStructure.avgMeals}
          </span>
          <span className="text-[12px] text-muted-foreground">
            {data.mealStructure.label} · snitt/dag
          </span>
        </div>
      </CardShell>
    );
  }

  /* ── Generic checklist fallback ── */
  if (computedItems.length > 0) {
    const doneCount = computedItems.filter((i) => i.done).length;
    const total = computedItems.length;
    const pct = (doneCount / total) * 100;
    return (
      <CardShell>
        <BlockHeader icon={getIcon(template.icon)} title={title} source={data.source} />
        <div className="space-y-2 mb-3">
          {computedItems.map((item) => (
            <div key={item.key} className="flex items-center gap-2.5">
              <div
                className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0"
                style={
                  item.done
                    ? { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                    : {
                        backgroundColor: "transparent",
                        border: "1.5px solid hsl(var(--foreground) / 0.22)",
                      }
                }
              >
                {item.done && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
              </div>
              <span
                className="text-[13px]"
                style={{
                  color: item.done ? "hsl(var(--foreground) / 0.4)" : "hsl(var(--foreground))",
                  textDecoration: item.done ? "line-through" : undefined,
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "hsl(var(--beige-3))" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: "hsl(var(--primary))" }}
            />
          </div>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
            {doneCount}/{total}
          </span>
        </div>
      </CardShell>
    );
  }

  /* ── Progress metric fallback ── */
  if (computedValue !== null && computedTotal !== null) {
    const pct = Math.min((computedValue / computedTotal) * 100, 100);
    return (
      <CardShell>
        <BlockHeader icon={getIcon(template.icon)} title={title} source={data.source} />
        <div className="flex items-baseline gap-1 mb-3 mt-1">
          <span
            className="font-serif leading-none tabular-nums"
            style={{ fontSize: 40, color: "hsl(var(--primary))" }}
          >
            {computedValue}
          </span>
          <span className="text-[13px] text-muted-foreground">/ {computedTotal}</span>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "hsl(var(--beige-3))" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: "hsl(var(--primary))" }}
          />
        </div>
      </CardShell>
    );
  }

  /* ── Text / label fallback ── */
  return (
    <CardShell>
      <BlockHeader icon={getIcon(template.icon)} title={title} source={data.source} />
      {data.computedLabel && (
        <p className="text-[13px] text-muted-foreground leading-relaxed">{data.computedLabel}</p>
      )}
    </CardShell>
  );
}
