import { TrendingUp, Activity, Calendar, Target, Trophy, Plus, PieChart } from "lucide-react";

interface ModulePreviewProps {
  sectionValue: string;
  label: string;
  compact?: boolean;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  metric_cards: <Activity className="h-4 w-4" />,
  trend_chart: <TrendingUp className="h-4 w-4" />,
  weekly_overview: <Calendar className="h-4 w-4" />,
  treatment_plan: <Target className="h-4 w-4" />,
  milestones: <Trophy className="h-4 w-4" />,
  log_button: <Plus className="h-4 w-4" />,
  macro_progress: <PieChart className="h-4 w-4" />,
};

function TrendChartPreview() {
  return (
    <div className="h-16 flex items-end gap-0.5 px-2">
      {[40, 55, 45, 60, 52, 68, 58, 72, 65, 78, 70, 75].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/20 rounded-t-sm"
          style={{ height: `${h}%` }}
        />
      ))}
      <svg className="absolute inset-x-2 bottom-0 h-16 w-[calc(100%-16px)]" viewBox="0 0 120 64" preserveAspectRatio="none">
        <polyline
          points="0,38 10,29 20,35 30,25 40,31 50,20 60,27 70,18 80,22 90,14 100,19 110,16 120,16"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function MetricCardsPreview() {
  return (
    <div className="grid grid-cols-2 gap-1.5 px-1">
      {[
        { label: "Vikt", val: "78.2 kg", color: "bg-primary/10" },
        { label: "Förändring", val: "-2.1 kg", color: "bg-emerald-500/10" },
      ].map((m) => (
        <div key={m.label} className={`${m.color} rounded-lg p-2 text-center`}>
          <p className="text-[9px] text-muted-foreground">{m.label}</p>
          <p className="text-xs font-bold">{m.val}</p>
        </div>
      ))}
    </div>
  );
}

function WeeklyOverviewPreview() {
  const days = ["M", "T", "O", "T", "F", "L", "S"];
  const active = [true, true, false, true, true, false, false];
  return (
    <div className="flex justify-center gap-1.5 px-2">
      {days.map((d, i) => (
        <div key={d + i} className="flex flex-col items-center gap-1">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium ${
              active[i]
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {d}
          </div>
        </div>
      ))}
    </div>
  );
}

function TreatmentPlanPreview() {
  return (
    <div className="space-y-1.5 px-2">
      {["Minska sockerintag", "Öka proteinintag"].map((g) => (
        <div key={g} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-primary" />
          <span className="text-[10px]">{g}</span>
        </div>
      ))}
    </div>
  );
}

function MilestonePreview() {
  return (
    <div className="space-y-1.5 px-2">
      {[
        { done: true, text: "Första veckan klar" },
        { done: false, text: "5 dagar i rad" },
      ].map((m) => (
        <div key={m.text} className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              m.done ? "bg-primary" : "border-2 border-muted-foreground/30"
            }`}
          />
          <span className={`text-[10px] ${m.done ? "line-through text-muted-foreground" : ""}`}>
            {m.text}
          </span>
        </div>
      ))}
    </div>
  );
}

function LogButtonPreview() {
  return (
    <div className="px-2">
      <div className="bg-primary/10 rounded-lg py-2 text-center">
        <span className="text-[10px] font-medium text-primary">+ Logga mätvärde</span>
      </div>
    </div>
  );
}

function MacroPreview() {
  return (
    <div className="flex justify-center gap-3 px-2">
      {[
        { label: "Protein", pct: 65, color: "bg-blue-500" },
        { label: "Kolhydrater", pct: 45, color: "bg-amber-500" },
        { label: "Fett", pct: 80, color: "bg-rose-500" },
      ].map((m) => (
        <div key={m.label} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.pct}%` }} />
          </div>
          <span className="text-[8px] text-muted-foreground">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

const PREVIEW_RENDERERS: Record<string, () => React.ReactNode> = {
  trend_chart: TrendChartPreview,
  metric_cards: MetricCardsPreview,
  weekly_overview: WeeklyOverviewPreview,
  treatment_plan: TreatmentPlanPreview,
  milestones: MilestonePreview,
  log_button: LogButtonPreview,
  macro_progress: MacroPreview,
};

export function ModulePreview({ sectionValue, label, compact }: ModulePreviewProps) {
  const Renderer = PREVIEW_RENDERERS[sectionValue];
  const icon = SECTION_ICONS[sectionValue];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="relative overflow-hidden">
        {Renderer ? <Renderer /> : (
          <div className="h-10 bg-muted/50 rounded-lg flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
