import { useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Sparkles, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Meal = {
  id: string;
  meal_name: string | null;
  meal_type: string | null;
  entry_date: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  image_url: string | null;
};

type Symptom = { id: string; meal_id: string | null; description: string };

type Group = {
  name: string;
  count: number;
  percentage: number;
  examples: string[];
  color: "emerald" | "amber" | "rose" | "sky" | "violet" | "slate";
};

type AIResult = { summary: string; groups: Group[]; insights: string[] };

const colorMap: Record<Group["color"], string> = {
  emerald: "bg-emerald-100 text-emerald-900 border-emerald-200",
  amber: "bg-amber-100 text-amber-900 border-amber-200",
  rose: "bg-rose-100 text-rose-900 border-rose-200",
  sky: "bg-sky-100 text-sky-900 border-sky-200",
  violet: "bg-violet-100 text-violet-900 border-violet-200",
  slate: "bg-slate-100 text-slate-900 border-slate-200",
};

const barColorMap: Record<Group["color"], string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  slate: "bg-slate-500",
};

const mealTypeOrder = ["Frukost", "Förmiddagssnack", "Lunch", "Mellanmål", "Middag", "Kvällsmål", "Frukt"];

interface Props {
  meals: Meal[];
  symptoms: Symptom[];
}

export function DietPatternsView({ meals, symptoms }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiScope, setAiScope] = useState<"week" | "all">("week");

  const weekStart = useMemo(() => startOfWeek(addWeeks(new Date(), -weekOffset), { weekStartsOn: 1 }), [weekOffset]);
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);

  const weekMeals = useMemo(
    () => meals.filter((m) => isWithinInterval(parseISO(m.entry_date), { start: weekStart, end: weekEnd })),
    [meals, weekStart, weekEnd]
  );

  // Group meals by day, then by meal_type
  const byDay = useMemo(() => {
    const map = new Map<string, Meal[]>();
    weekMeals.forEach((m) => {
      const key = format(parseISO(m.entry_date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [weekMeals]);

  const weekTotals = useMemo(() => {
    const kcal = weekMeals.reduce((s, m) => s + (m.calories ?? 0), 0);
    const days = byDay.length;
    return {
      kcal,
      meals: weekMeals.length,
      avgKcal: days > 0 ? Math.round(kcal / days) : 0,
      days,
    };
  }, [weekMeals, byDay]);

  const runAI = async (scope: "week" | "all") => {
    const dataset = scope === "week" ? weekMeals : meals;
    if (dataset.length === 0) {
      toast.error("Inga måltider att analysera");
      return;
    }
    setAiLoading(true);
    setAiScope(scope);
    try {
      // Send only minimal fields to avoid OOM in edge function
      const slim = dataset.slice(0, 500).map((m) => ({
        meal_name: m.meal_name,
        meal_type: m.meal_type,
        calories: m.calories,
      }));
      const { data, error } = await supabase.functions.invoke("analyze-diet-patterns", {
        body: { meals: slim },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAiResult(data as AIResult);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Kunde inte analysera");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Pattern Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">AI-mönster</p>
                <p className="text-xs text-muted-foreground">
                  Gruppera vad klienten äter automatiskt
                </p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => runAI("week")} disabled={aiLoading}>
                {aiLoading && aiScope === "week" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Denna vecka"}
              </Button>
              <Button size="sm" onClick={() => runAI("all")} disabled={aiLoading}>
                {aiLoading && aiScope === "all" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Allt"}
              </Button>
            </div>
          </div>

          {aiResult && (
            <div className="space-y-3 pt-2 border-t border-primary/15">
              <p className="text-sm text-foreground italic">{aiResult.summary}</p>

              <div className="space-y-2">
                {aiResult.groups.map((g) => (
                  <div key={g.name} className={cn("rounded-lg border p-2.5 space-y-1.5", colorMap[g.color])}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{g.name}</span>
                      <span className="text-xs font-mono">
                        {g.count} st · {g.percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/50 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", barColorMap[g.color])}
                        style={{ width: `${Math.min(100, g.percentage)}%` }}
                      />
                    </div>
                    {g.examples.length > 0 && (
                      <p className="text-xs opacity-80">{g.examples.slice(0, 4).join(" · ")}</p>
                    )}
                  </div>
                ))}
              </div>

              {aiResult.insights.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold">Observationer</p>
                  </div>
                  <ul className="space-y-1">
                    {aiResult.insights.map((i, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-1">
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium">
            {format(weekStart, "d MMM", { locale: sv })} – {format(weekEnd, "d MMM yyyy", { locale: sv })}
          </p>
          <p className="text-xs text-muted-foreground">
            {weekTotals.meals} måltider · {weekTotals.kcal} kcal · ⌀ {weekTotals.avgKcal} kcal/dag
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => Math.max(0, w - 1))} disabled={weekOffset === 0}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Daily groups */}
      {byDay.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Inga måltider loggade denna vecka.</p>
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="space-y-3">
            {byDay.map(([day, items]) => {
              const sorted = [...items].sort((a, b) => {
                const ai = mealTypeOrder.indexOf(a.meal_type ?? "");
                const bi = mealTypeOrder.indexOf(b.meal_type ?? "");
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
              });
              const dayKcal = items.reduce((s, m) => s + (m.calories ?? 0), 0);
              return (
                <div key={day} className="space-y-1.5">
                  <div className="flex items-baseline justify-between px-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {format(parseISO(day), "EEEE d MMM", { locale: sv })}
                    </p>
                    <p className="text-xs text-muted-foreground">{dayKcal} kcal</p>
                  </div>
                  <div className="space-y-1.5">
                    {sorted.map((m) => {
                      const linked = symptoms.filter((s) => s.meal_id === m.id);
                      return (
                        <Tooltip key={m.id}>
                          <TooltipTrigger asChild>
                            <Card className="cursor-default hover:shadow-md transition-shadow">
                              <CardContent className="py-2.5 px-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{m.meal_name || "Måltid"}</p>
                                    <p className="text-xs text-muted-foreground">{m.meal_type}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {linked.length > 0 && (
                                      <span className="text-xs text-destructive">⚠ {linked.length}</span>
                                    )}
                                    <p className="text-xs text-muted-foreground tabular-nums">{m.calories ?? 0} kcal</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs p-0 overflow-hidden">
                            <div>
                              {m.image_url && <img src={m.image_url} alt={m.meal_name ?? ""} className="w-full h-32 object-cover" />}
                              <div className="p-3 space-y-2">
                                <p className="font-semibold text-sm">{m.meal_name || "Måltid"}</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                  <span className="text-muted-foreground">Kalorier</span>
                                  <span className="font-medium text-right">{m.calories ?? "–"} kcal</span>
                                  <span className="text-muted-foreground">Protein</span>
                                  <span className="font-medium text-right">{m.protein != null ? `${Math.round(m.protein)}g` : "–"}</span>
                                  <span className="text-muted-foreground">Kolhydrater</span>
                                  <span className="font-medium text-right">{m.carbs != null ? `${Math.round(m.carbs)}g` : "–"}</span>
                                  <span className="text-muted-foreground">Fett</span>
                                  <span className="font-medium text-right">{m.fat != null ? `${Math.round(m.fat)}g` : "–"}</span>
                                </div>
                                {linked.length > 0 && (
                                  <div className="pt-1 border-t border-border">
                                    <p className="text-xs font-semibold text-destructive mb-1">Symptom</p>
                                    {linked.map((s) => (
                                      <p key={s.id} className="text-xs text-muted-foreground">• {s.description}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
