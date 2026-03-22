import {
  TrendingUp, Activity, Calendar, Target, Trophy, Plus, PieChart,
  Scale, Droplets, Heart, AlertCircle, Check, Circle, Leaf, Fish,
  Sparkles, Flame, Dumbbell, MessageSquare
} from "lucide-react";

interface ModulePreviewProps {
  sectionValue: string;
  label: string;
  compact?: boolean;
}

// ─── Generic previews ───────────────────────────────────────

function TrendChartPreview() {
  return (
    <div className="h-14 flex items-end gap-px px-1 relative">
      {[40, 55, 45, 60, 52, 68, 58, 72, 65, 78, 70, 75].map((h, i) => (
        <div key={i} className="flex-1 bg-primary/15 rounded-t-sm" style={{ height: `${h}%` }} />
      ))}
      <svg className="absolute inset-x-1 bottom-0 h-14 w-[calc(100%-8px)]" viewBox="0 0 120 56" preserveAspectRatio="none">
        <polyline points="0,38 10,29 20,35 30,25 40,31 50,20 60,27 70,18 80,22 90,14 100,19 110,16 120,16" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function MetricCardsPreview() {
  return (
    <div className="grid grid-cols-2 gap-1.5 px-1">
      {[{ label: "Vikt", val: "78.2 kg", color: "bg-primary/10" }, { label: "Förändring", val: "-2.1 kg", color: "bg-emerald-500/10" }].map((m) => (
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
        <div key={d + i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium ${active[i] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {d}
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
      {[{ done: true, text: "Första veckan klar" }, { done: false, text: "5 dagar i rad" }].map((m) => (
        <div key={m.text} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${m.done ? "bg-primary" : "border-2 border-muted-foreground/30"}`} />
          <span className={`text-[10px] ${m.done ? "line-through text-muted-foreground" : ""}`}>{m.text}</span>
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
      {[{ label: "Protein", pct: 65, color: "bg-primary" }, { label: "Kolhydrater", pct: 45, color: "bg-amber-500" }, { label: "Fett", pct: 80, color: "bg-rose-500" }].map((m) => (
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

// ─── Category-specific previews ─────────────────────────────

function BloodSugarPreview() {
  return (
    <div className="grid grid-cols-2 gap-1.5 px-1">
      <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
        <p className="text-[9px] text-muted-foreground">Fastesocker</p>
        <p className="text-xs font-bold">5.8 <span className="text-[8px] font-normal">mmol/L</span></p>
        <p className="text-[8px] text-emerald-600">✓ I mål</p>
      </div>
      <div className="bg-amber-500/10 rounded-lg p-2 text-center">
        <p className="text-[9px] text-muted-foreground">Efter mat</p>
        <p className="text-xs font-bold">8.2 <span className="text-[8px] font-normal">mmol/L</span></p>
        <p className="text-[8px] text-amber-600">⚠ Utanför mål</p>
      </div>
    </div>
  );
}

function TimeInRangePreview() {
  return (
    <div className="px-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground">4-10 mmol/L</span>
        <span className="text-xs font-bold">72%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: "72%" }} />
      </div>
      <p className="text-[8px] text-muted-foreground">Baserat på 24 mätningar</p>
    </div>
  );
}

function CarbIntakePreview() {
  return (
    <div className="px-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <Target className="w-3 h-3 text-primary" />
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: "80%" }} />
        </div>
        <span className="text-[9px] font-medium">145g / 180g</span>
      </div>
      <p className="text-[8px] text-muted-foreground">Kolhydratintag idag</p>
    </div>
  );
}

function DiabetesFocusPreview() {
  return (
    <div className="space-y-1.5 px-2">
      {["Håll kolhydrater jämna", "Logga blodsocker efter mat"].map((t) => (
        <div key={t} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-primary/10 flex items-center justify-center">
            <Target className="w-2.5 h-2.5 text-primary" />
          </div>
          <span className="text-[10px]">{t}</span>
        </div>
      ))}
    </div>
  );
}

function FODMAPPhasesPreview() {
  const phases = [
    { name: "Eliminering", active: false, done: true },
    { name: "Återintroduktion", active: true, done: false },
    { name: "Personalisering", active: false, done: false },
  ];
  return (
    <div className="flex gap-1 px-1">
      {phases.map((p) => (
        <div key={p.name} className={`flex-1 rounded-full px-2 py-1 text-center text-[8px] font-medium ${p.active ? "bg-primary text-primary-foreground" : p.done ? "bg-muted text-muted-foreground" : "border border-border text-muted-foreground"}`}>
          {p.done && "✓ "}{p.name}
        </div>
      ))}
    </div>
  );
}

function FODMAPTriggersPreview() {
  return (
    <div className="space-y-1.5 px-2">
      {[{ name: "Fruktos", status: "trigger" }, { name: "Polyoler", status: "safe" }, { name: "Laktos", status: "testing" }].map((g) => (
        <div key={g.name} className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {g.status === "trigger" && <AlertCircle className="w-3 h-3 text-amber-500" />}
            {g.status === "safe" && <Check className="w-3 h-3 text-primary" />}
            {g.status === "testing" && <Circle className="w-3 h-3 text-primary" />}
            <span className="text-[10px] font-medium">{g.name}</span>
          </div>
          <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${g.status === "trigger" ? "bg-destructive/10 text-destructive" : g.status === "safe" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
            {g.status === "trigger" ? "Trigger" : g.status === "safe" ? "OK" : "Testar"}
          </span>
        </div>
      ))}
    </div>
  );
}

function SymptomFreeDaysPreview() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <span className="text-sm font-bold text-primary">5</span>
      </div>
      <div>
        <p className="text-[10px] font-medium">av 7 dagar denna vecka</p>
        <p className="text-[8px] text-muted-foreground">↑ Bättre än förra veckan!</p>
      </div>
    </div>
  );
}

function CholesterolBPPreview() {
  return (
    <div className="grid grid-cols-2 gap-1.5 px-1">
      <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
        <p className="text-[9px] text-muted-foreground">Kolesterol</p>
        <p className="text-xs font-bold">4.8 <span className="text-[8px] font-normal">mmol/L</span></p>
        <p className="text-[8px] text-emerald-600">✓ Under mål</p>
      </div>
      <div className="bg-primary/10 rounded-lg p-2 text-center">
        <p className="text-[9px] text-muted-foreground">Blodtryck</p>
        <p className="text-xs font-bold">128/82</p>
        <p className="text-[8px] text-muted-foreground">mmHg</p>
      </div>
    </div>
  );
}

function MediterraneanScorePreview() {
  return (
    <div className="px-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground">Medelhavspoäng</span>
        <span className="text-xs font-bold">78/100</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: "78%" }} />
      </div>
      <p className="text-[8px] text-muted-foreground">↑ +5 jämfört med förra veckan</p>
    </div>
  );
}

function HeartHealthyChoicesPreview() {
  return (
    <div className="space-y-1.5 px-2">
      {[{ name: "Fet fisk", val: "4/2", ok: true }, { name: "Grönsaker", val: "12/14", ok: false }, { name: "Fullkorn", val: "5/7", ok: false }].map((c) => (
        <div key={c.name} className="flex items-center gap-2">
          <span className="text-[10px] font-medium flex-1">{c.name}</span>
          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${c.ok ? "bg-primary" : "bg-amber-500"}`} style={{ width: c.ok ? "100%" : "70%" }} />
          </div>
          <span className="text-[8px] text-muted-foreground w-8 text-right">{c.val}</span>
        </div>
      ))}
    </div>
  );
}

function AffirmationPreview() {
  return (
    <div className="px-2">
      <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 text-center">
        <p className="text-[10px] italic text-foreground leading-relaxed">
          "Varje måltid är ett steg framåt"
        </p>
      </div>
    </div>
  );
}

function MealRhythmPreview() {
  const meals = [
    { name: "Frukost", done: true },
    { name: "Lunch", done: true },
    { name: "Middag", done: false },
    { name: "Mellanmål", done: false },
  ];
  return (
    <div className="space-y-1 px-2">
      {meals.map((m) => (
        <div key={m.name} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-md flex items-center justify-center ${m.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {m.done ? <Check className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />}
          </div>
          <span className={`text-[10px] ${m.done ? "font-medium" : "text-muted-foreground"}`}>{m.name}</span>
        </div>
      ))}
    </div>
  );
}

function MealRegularityPreview() {
  return (
    <div className="px-2 space-y-1.5">
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} className={`aspect-square rounded-sm ${i % 5 !== 0 ? "bg-primary/70" : "bg-muted/50"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-primary/70" />
          <span className="text-[8px] text-muted-foreground">3+ måltider</span>
        </div>
        <span className="text-[9px] font-medium">22/30 dagar</span>
      </div>
    </div>
  );
}

function WomensMetricsPreview() {
  return (
    <div className="grid grid-cols-2 gap-1.5 px-1">
      <div className="bg-primary/10 rounded-lg p-2 text-center">
        <p className="text-[9px] text-muted-foreground">Vikt</p>
        <p className="text-xs font-bold">68.5 kg</p>
        <p className="text-[8px] text-emerald-600">↓ 1.2 kg</p>
      </div>
      <div className="bg-pink-500/10 rounded-lg p-2 text-center">
        <p className="text-[9px] text-muted-foreground">Midjemått</p>
        <p className="text-xs font-bold">78 cm</p>
        <p className="text-[8px] text-emerald-600">✓ Under 80</p>
      </div>
    </div>
  );
}

function FocusAreasPreview() {
  return (
    <div className="space-y-1.5 px-2">
      {["Insulinkänslighet", "Hormonbalans"].map((a) => (
        <div key={a} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-pink-500/10 flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-pink-500" />
          </div>
          <span className="text-[10px] font-medium">{a}</span>
        </div>
      ))}
    </div>
  );
}

function CalorieMacroPreview() {
  return (
    <div className="grid grid-cols-2 gap-1.5 px-1">
      <div className="bg-amber-500/10 rounded-lg p-2 text-center">
        <p className="text-[9px] text-muted-foreground">Kalorier</p>
        <p className="text-xs font-bold">1 850 <span className="text-[8px] font-normal">kcal</span></p>
      </div>
      <div className="bg-primary/10 rounded-lg p-2 text-center">
        <p className="text-[9px] text-muted-foreground">Aktiva dagar</p>
        <p className="text-xs font-bold">5 / 7</p>
      </div>
    </div>
  );
}

function NextAppointmentPreview() {
  return (
    <div className="px-2">
      <div className="flex items-center gap-2 bg-muted/40 rounded-lg p-2">
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
          <Calendar className="w-3 h-3 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-medium">Ons 5 feb kl 14:00</p>
          <p className="text-[8px] text-muted-foreground">Videosamtal</p>
        </div>
      </div>
    </div>
  );
}

function HeartTipPreview() {
  return (
    <div className="px-2">
      <div className="bg-destructive/5 rounded-lg p-2 flex items-start gap-2">
        <Heart className="w-3.5 h-3.5 text-destructive/60 mt-0.5 shrink-0" />
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          Ersätt rött kött med fisk 2 ggr/vecka. Olivolja istället för smör.
        </p>
      </div>
    </div>
  );
}

// ─── Section icon map ────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ReactNode> = {
  metric_cards: <Activity className="h-3.5 w-3.5" />,
  trend_chart: <TrendingUp className="h-3.5 w-3.5" />,
  weekly_overview: <Calendar className="h-3.5 w-3.5" />,
  treatment_plan: <Target className="h-3.5 w-3.5" />,
  milestones: <Trophy className="h-3.5 w-3.5" />,
  log_button: <Plus className="h-3.5 w-3.5" />,
  macro_progress: <PieChart className="h-3.5 w-3.5" />,
  // Diabetes
  blood_sugar_metrics: <Droplets className="h-3.5 w-3.5" />,
  time_in_range: <Target className="h-3.5 w-3.5" />,
  carb_intake: <PieChart className="h-3.5 w-3.5" />,
  diabetes_focus: <Target className="h-3.5 w-3.5" />,
  // Gut health
  fodmap_phases: <Leaf className="h-3.5 w-3.5" />,
  fodmap_triggers: <AlertCircle className="h-3.5 w-3.5" />,
  symptom_free_days: <Calendar className="h-3.5 w-3.5" />,
  // Heart health
  cholesterol_bp: <Heart className="h-3.5 w-3.5" />,
  mediterranean_score: <Fish className="h-3.5 w-3.5" />,
  heart_healthy_choices: <Check className="h-3.5 w-3.5" />,
  heart_tip: <Heart className="h-3.5 w-3.5" />,
  // Eating disorder
  ed_focus: <Heart className="h-3.5 w-3.5" />,
  ed_meal_rhythm: <Calendar className="h-3.5 w-3.5" />,
  ed_meal_structure: <Activity className="h-3.5 w-3.5" />,
  ed_regularity_30d: <Activity className="h-3.5 w-3.5" />,
  ed_behavior_goals: <Target className="h-3.5 w-3.5" />,
  ed_symptom_patterns: <AlertCircle className="h-3.5 w-3.5" />,
  ed_weekly_checkin: <Calendar className="h-3.5 w-3.5" />,
  ed_follow_up: <Calendar className="h-3.5 w-3.5" />,
  // Women's health
  womens_metrics: <Scale className="h-3.5 w-3.5" />,
  focus_areas: <Sparkles className="h-3.5 w-3.5" />,
  // General
  calorie_macro: <Flame className="h-3.5 w-3.5" />,
};

// ─── Preview renderer map ────────────────────────────────────

const PREVIEW_RENDERERS: Record<string, () => React.ReactNode> = {
  // Generic
  trend_chart: TrendChartPreview,
  metric_cards: MetricCardsPreview,
  weekly_overview: WeeklyOverviewPreview,
  treatment_plan: TreatmentPlanPreview,
  milestones: MilestonePreview,
  log_button: LogButtonPreview,
  macro_progress: MacroPreview,
  // Diabetes
  blood_sugar_metrics: BloodSugarPreview,
  time_in_range: TimeInRangePreview,
  carb_intake: CarbIntakePreview,
  diabetes_focus: DiabetesFocusPreview,
  // Gut health
  fodmap_phases: FODMAPPhasesPreview,
  fodmap_triggers: FODMAPTriggersPreview,
  symptom_free_days: SymptomFreeDaysPreview,
  // Heart health
  cholesterol_bp: CholesterolBPPreview,
  mediterranean_score: MediterraneanScorePreview,
  heart_healthy_choices: HeartHealthyChoicesPreview,
  heart_tip: HeartTipPreview,
  // Eating disorder
  affirmation: AffirmationPreview,
  meal_rhythm: MealRhythmPreview,
  meal_regularity: MealRegularityPreview,
  next_appointment: NextAppointmentPreview,
  // Women's health
  womens_metrics: WomensMetricsPreview,
  focus_areas: FocusAreasPreview,
  // General
  calorie_macro: CalorieMacroPreview,
};

export function ModulePreview({ sectionValue, label, compact }: ModulePreviewProps) {
  const Renderer = PREVIEW_RENDERERS[sectionValue];
  const icon = SECTION_ICONS[sectionValue];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="relative overflow-hidden">
        {Renderer ? <Renderer /> : (
          <div className="h-8 bg-muted/50 rounded-lg flex items-center justify-center">
            <span className="text-[9px] text-muted-foreground">{label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
