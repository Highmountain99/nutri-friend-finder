import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Circle, TrendingDown, TrendingUp, Minus, Calendar, Heart, Target, Activity, AlertTriangle, Sparkles, MessageSquare } from "lucide-react";
import * as Icons from "lucide-react";
import { ComputedBlockData } from "@/hooks/usePatientBlocks";
import { ResponsiveContainer, Area, AreaChart, XAxis, YAxis, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

function getIcon(iconName: string) {
  const Icon = (Icons as any)[iconName];
  return Icon ? <Icon className="h-4 w-4" /> : <Icons.Square className="h-4 w-4" />;
}

function SourceBadge({ source }: { source: "journal" | "dietitian" | "manual" }) {
  if (source === "journal")
    return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal bg-primary/10 text-primary border-0">Från journal</Badge>;
  if (source === "dietitian")
    return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal bg-accent/60 text-accent-foreground border-0">Din dietist</Badge>;
  return null;
}

function BlockHeader({ icon, title, source }: { icon: React.ReactNode; title: string; source: "journal" | "dietitian" | "manual" }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <SourceBadge source={source} />
    </div>
  );
}

interface DynamicBlockProps {
  data: ComputedBlockData;
}

export function DynamicBlock({ data }: DynamicBlockProps) {
  const navigate = useNavigate();
  const { block, computedItems, computedValue, computedTotal, chartData, chartMeta, renderAs } = data;
  const template = block.template;
  const title = block.override_title || template.title;

  // ── Focus card (treatment plan description) ──
  if (renderAs === "focus_card") {
    return (
      <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-5">
          <BlockHeader icon={<Heart className="w-4 h-4" />} title="Dagens fokus" source="dietitian" />
          <p className="text-base font-semibold text-foreground italic text-center leading-relaxed">
            "{data.focusText || block.manual_content || "Varje måltid är ett steg framåt"}"
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Meal rhythm card ──
  if (renderAs === "meal_rhythm_card" && data.mealRhythm) {
    const logged = data.mealRhythm.filter(m => m.done).length;
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={<Calendar className="w-4 h-4" />} title={title} source="journal" />
          <div className="space-y-2.5">
            {data.mealRhythm.map((meal) => (
              <div key={meal.key} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  meal.done ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/60 text-muted-foreground"
                }`}>
                  {meal.done ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </div>
                <span className={`text-sm font-medium ${meal.done ? "text-foreground" : "text-muted-foreground"}`}>
                  {meal.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">{logged} av 4 loggade</p>
        </CardContent>
      </Card>
    );
  }

  // ── Meal structure card ──
  if (renderAs === "meal_structure_card" && data.mealStructure) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={<Activity className="w-4 h-4" />} title={title} source="journal" />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{data.mealStructure.avgMeals}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{data.mealStructure.label}</p>
              <p className="text-xs text-muted-foreground">Genomsnitt måltider/dag</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Regularity grid card ──
  if (renderAs === "regularity_grid" && data.regularityGrid) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={<Activity className="w-4 h-4" />} title={title} source="journal" />
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {data.regularityGrid.map((day, i) => (
              <div
                key={i}
                className={`w-full aspect-square rounded-md transition-colors ${
                  day.hasThreePlus ? "bg-primary/80" : day.count > 0 ? "bg-primary/30" : "bg-muted/50"
                }`}
                title={`${day.date}: ${day.count} måltider`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary/80" />
              <span className="text-muted-foreground text-xs">3+ måltider</span>
            </div>
            <span className="font-semibold text-foreground">{data.daysWithThreePlus}/30 dagar</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Behavior goals card ──
  if (renderAs === "behavior_goals_card" && data.milestones && data.milestones.length > 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={<Target className="w-4 h-4" />} title={title} source="dietitian" />
          <div className="space-y-2.5">
            {data.milestones.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  m.is_completed ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"
                }`}>
                  {m.is_completed && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-sm ${m.is_completed ? "text-muted-foreground line-through" : "font-medium text-foreground"}`}>
                  {m.title}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Symptom pattern card ──
  if (renderAs === "symptom_pattern_card" && data.symptomPatterns && data.symptomPatterns.length > 0) {
    const maxCount = Math.max(...data.symptomPatterns.map(p => p.count));
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={<AlertTriangle className="w-4 h-4" />} title={title} source="journal" />
          <div className="space-y-2">
            {data.symptomPatterns.map((p) => (
              <div key={p.timeLabel} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{p.timeLabel}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-destructive/60 rounded-full" style={{ width: `${Math.min((p.count / maxCount) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">{p.count}x</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Grupperade efter tid på dygnet</p>
        </CardContent>
      </Card>
    );
  }

  // ── Weekly checkin card ──
  if (renderAs === "weekly_checkin_card" && data.weeklyCheckin) {
    const stabilityColors = {
      stabil: "text-primary",
      delvis: "text-amber-600",
      oregelbunden: "text-muted-foreground",
    };
    const stabilityLabels = {
      stabil: "Stabil vecka",
      delvis: "Delvis stabil",
      oregelbunden: "Oregelbunden",
    };

    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={<Sparkles className="w-4 h-4" />} title={title} source="journal" />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{data.weeklyCheckin.loggedDays}</p>
              <p className="text-[10px] text-muted-foreground">Loggade dagar</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{data.weeklyCheckin.averageMealsPerDay}</p>
              <p className="text-[10px] text-muted-foreground">Mål/dag snitt</p>
            </div>
            <div>
              <p className={`text-sm font-semibold ${stabilityColors[data.weeklyCheckin.stability]}`}>
                {stabilityLabels[data.weeklyCheckin.stability]}
              </p>
              <p className="text-[10px] text-muted-foreground">Bedömning</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Weekly overview card ──
  if (renderAs === "weekly_overview_card" && data.weeklyCheckin) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={<Calendar className="w-4 h-4" />} title={title} source="journal" />
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{data.weeklyCheckin.loggedDays}</p>
              <p className="text-xs text-muted-foreground">Aktiva dagar</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.weeklyCheckin.averageMealsPerDay}</p>
              <p className="text-xs text-muted-foreground">Mål/dag</p>
            </div>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2 mt-3">
            <div
              className="bg-primary rounded-full h-2 transition-all duration-500"
              style={{ width: `${(data.weeklyCheckin.loggedDays / 7) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Follow-up card ──
  if (renderAs === "follow_up_card") {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={<Calendar className="w-4 h-4" />} title={title} source="dietitian" />
          {data.nextAppointment ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {format(new Date(data.nextAppointment.appointment_date), "EEEE d MMM 'kl' HH:mm", { locale: sv })}
                  </p>
                  <p className="text-sm text-muted-foreground">Videosamtal med din dietist</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-full border-border/60 font-medium" onClick={() => navigate("/booking")}>
                  Boka om
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-full border-border/60 font-medium" onClick={() => navigate("/messages")}>
                  <MessageSquare className="w-4 h-4" /> Chatta
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-3">
              <p className="text-sm text-muted-foreground mb-3">Inget bokat samtal</p>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate("/booking")}>
                Boka samtal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Symptom free days card ──
  if (renderAs === "symptom_free_card" && computedValue !== null && computedTotal !== null) {
    const pct = (computedValue / computedTotal) * 100;
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={<Check className="w-4 h-4" />} title={title} source="journal" />
          <div className="flex items-end gap-1 mb-2">
            <span className="text-3xl font-bold tabular-nums text-primary">{computedValue}</span>
            <span className="text-sm text-muted-foreground mb-1">/ {computedTotal} dagar</span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2.5">
            <div className="bg-emerald-500 rounded-full h-2.5 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Symptomfria dagar</p>
        </CardContent>
      </Card>
    );
  }

  // ── Symptom count card ──
  if (renderAs === "symptom_count_card") {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={<AlertTriangle className="w-4 h-4" />} title={title} source="journal" />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <span className="text-sm font-bold text-destructive">{computedValue || 0}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{data.computedLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Trend chart (area chart for health metrics) ──
  if ((renderAs === "trend_chart" || !renderAs) && chartData && chartData.length > 0 && chartMeta) {
    const latest = chartData[chartData.length - 1].value;
    const first = chartData[0].value;
    const diff = latest - first;
    const isDown = diff < 0;
    const isFlat = Math.abs(diff) < 0.1;

    return (
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {getIcon(template.icon)}
              </div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </div>
            <div className="flex items-center gap-1.5 text-right">
              <span className="text-lg font-bold tabular-nums">{latest.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">{chartMeta.unit}</span>
            </div>
          </div>

          <div className="h-[100px] w-full -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`grad-${block.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(v: number) => [`${v} ${chartMeta.unit}`, ""]}
                  labelStyle={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill={`url(#grad-${block.id})`} dot={false} activeDot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {chartData.length > 7 ? "Senaste 30 dagarna" : `${chartData.length} mätningar`}
            </span>
            {!isFlat ? (
              <div className="flex items-center gap-1">
                {isDown ? <TrendingDown className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingUp className="h-3.5 w-3.5 text-amber-500" />}
                <span className={`text-xs font-semibold tabular-nums ${isDown ? "text-emerald-600" : "text-amber-600"}`}>
                  {diff > 0 ? "+" : ""}{diff.toFixed(1)} {chartMeta.unit}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Stabil</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Checklist block (meal rhythm fallback) ──
  if (computedItems.length > 0) {
    const doneCount = computedItems.filter(i => i.done).length;
    const total = computedItems.length;
    const pct = (doneCount / total) * 100;

    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={getIcon(template.icon)} title={title} source={data.source} />
          <div className="w-full bg-muted/50 rounded-full h-2 mb-3">
            <div className="bg-primary rounded-full h-2 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {computedItems.map((item) => (
              <div key={item.key} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${item.done ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/30"}`}>
                {item.done ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/25 shrink-0" />}
                <span className={`text-xs font-medium ${item.done ? "text-foreground" : "text-muted-foreground/60"}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Progress bar block ──
  if (computedValue !== null && computedTotal !== null) {
    const pct = Math.min((computedValue / computedTotal) * 100, 100);
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <BlockHeader icon={getIcon(template.icon)} title={title} source={data.source} />
          <div className="flex items-end gap-1 mb-2">
            <span className="text-3xl font-bold tabular-nums text-primary">{computedValue}</span>
            <span className="text-sm text-muted-foreground mb-1">/ {computedTotal}</span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2.5">
            <div className="bg-primary rounded-full h-2.5 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Simple label / manual block ──
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <BlockHeader icon={getIcon(template.icon)} title={title} source={data.source} />
        {data.computedLabel && (
          <p className="text-sm text-muted-foreground leading-relaxed">{data.computedLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
