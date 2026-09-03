import { Check, Circle, Calendar, Target, Heart, Activity, AlertTriangle, MessageSquare, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import type { MealRhythm, DayEntry, SymptomPattern, WeeklyCheckin } from "@/hooks/useEatingDisorderBlocks";

function SourceBadge({ source }: { source: "journal" | "dietist" | "ai" }) {
  if (source === "journal")
    return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal bg-primary/10 text-primary border-0">Från journal</Badge>;
  if (source === "dietist")
    return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal bg-accent/60 text-accent-foreground border-0">Din coach</Badge>;
  return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal bg-muted text-amber-700 border-0">✨ AI-förslag</Badge>;
}

function BlockHeader({ icon, title, source }: { icon: React.ReactNode; title: string; source: "journal" | "dietist" | "ai" }) {
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

export function FocusBlock({ title, description }: { title?: string; description?: string }) {
  return (
    <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-5">
        <BlockHeader icon={<Heart className="w-4 h-4" />} title="Dagens fokus" source="dietist" />
        <p className="text-base font-semibold text-foreground italic text-center leading-relaxed">
          "{title || "Varje måltid är ett steg framåt"}"
        </p>
        {description && <p className="text-xs text-muted-foreground text-center mt-2">{description}</p>}
      </CardContent>
    </Card>
  );
}

export function MealRhythmBlock({ rhythm }: { rhythm: MealRhythm }) {
  const meals = [
    { key: "breakfast", label: "Frukost", done: rhythm.breakfast },
    { key: "lunch", label: "Lunch", done: rhythm.lunch },
    { key: "dinner", label: "Middag", done: rhythm.dinner },
    { key: "snack", label: "Mellanmål", done: rhythm.snack },
  ];
  const logged = meals.filter((m) => m.done).length;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <BlockHeader icon={<Calendar className="w-4 h-4" />} title="Måltidsrytm idag" source="journal" />
        <div className="space-y-2.5">
          {meals.map((meal) => (
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

export function MealStructureBlock({ label, avgMeals }: { label: string; avgMeals: number }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <BlockHeader icon={<Activity className="w-4 h-4" />} title="Måltidsstruktur (7d)" source="journal" />
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{avgMeals}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">Genomsnitt måltider/dag</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RegularityGridBlock({ grid, daysWithThreePlus }: { grid: DayEntry[]; daysWithThreePlus: number }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <BlockHeader icon={<Activity className="w-4 h-4" />} title="Regelbundenhet (30d)" source="journal" />
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {grid.map((day, i) => (
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
          <span className="font-semibold text-foreground">{daysWithThreePlus}/30 dagar</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function BehaviorGoalsBlock({ milestones }: { milestones: any[] }) {
  if (!milestones || milestones.length === 0) return null;
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <BlockHeader icon={<Target className="w-4 h-4" />} title="Beteendemål" source="dietist" />
        <div className="space-y-2.5">
          {milestones.slice(0, 5).map((m) => (
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

export function SymptomPatternBlock({ patterns }: { patterns: SymptomPattern[] }) {
  if (patterns.length === 0) return null;
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <BlockHeader icon={<AlertTriangle className="w-4 h-4" />} title="Symptommönster (14d)" source="journal" />
        <div className="space-y-2">
          {patterns.map((p) => (
            <div key={p.timeLabel} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{p.timeLabel}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-destructive/60 rounded-full" style={{ width: `${Math.min((p.count / Math.max(...patterns.map((x) => x.count))) * 100, 100)}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{p.count}x</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Symptom senaste 14 dagarna grupperade efter tid på dygnet</p>
      </CardContent>
    </Card>
  );
}

export function WeeklyCheckinBlock({ checkin }: { checkin: WeeklyCheckin }) {
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
        <BlockHeader icon={<Sparkles className="w-4 h-4" />} title="Veckoöversikt (7d)" source="journal" />
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{checkin.loggedDays}</p>
            <p className="text-[10px] text-muted-foreground">Loggade dagar</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{checkin.averageMealsPerDay}</p>
            <p className="text-[10px] text-muted-foreground">Mål/dag snitt</p>
          </div>
          <div>
            <p className={`text-sm font-semibold ${stabilityColors[checkin.stability]}`}>{stabilityLabels[checkin.stability]}</p>
            <p className="text-[10px] text-muted-foreground">Bedömning</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FollowUpBlock({ appointment }: { appointment: { appointment_date: string; notes?: string | null } | null }) {
  const navigate = useNavigate();

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <BlockHeader icon={<Calendar className="w-4 h-4" />} title="Nästa samtal" source="dietist" />
        {appointment ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {format(new Date(appointment.appointment_date), "EEEE d MMM 'kl' HH:mm", { locale: sv })}
                </p>
                <p className="text-sm text-muted-foreground">Videosamtal med din coach</p>
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
