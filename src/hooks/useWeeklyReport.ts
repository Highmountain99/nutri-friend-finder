import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, endOfWeek, format, getISOWeek, differenceInCalendarDays } from "date-fns";
import { sv } from "date-fns/locale";

export interface WeeklyReportData {
  weekStart: string;
  weekNumber: number;
  rangeLabel: string;
  // Veckan i korthet
  completeDays: number;
  mealsLogged: number;
  planFollowedPct: number;
  highlight: string;
  // Energi & näring
  caloriesAvg: number;
  caloriesMin: number;
  caloriesMax: number;
  macros: { protein: number; carbs: number; fat: number };
  fiberAvg: number;
  fiberGoal: number;
  daysInGoal: { energy: boolean[]; protein: boolean[]; fiber: boolean[] };
  // Måltidsmönster
  mealsPerDay: number;
  mealPoints: { pct: number; size: number; tone: "gold" | "sage" | "apricot" }[];
  patternInsights: { tone: "sage" | "gold" | "terracotta"; bold: string; text: string }[];
  // Matkvalitet
  quality: { label: string; value: string; pct: number; tone: "sage" | "gold" | "apricot" }[];
  qualityNote: string;
  // Hunger
  hasWellbeingData: boolean;
  scales: { label: string; value: string; level: number }[];
  cravingNote: string | null;
  // Samband
  correlations: string[];
  // Hemkort
  symptomFreeDays: number;
  weightChange: number | null;
  loggedDays: number;
}

const SWEET_WORDS = ["glass", "godis", "choklad", "kaka", "bulle", "vin", "öl", "cider", "dessert", "läsk"];

export function useWeeklyReport(targetUserId?: string) {
  const { user } = useAuth();
  const userId = targetUserId ?? user?.id;

  return useQuery({
    queryKey: ["weekly-report", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<WeeklyReportData> => {
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      const startStr = format(start, "yyyy-MM-dd");
      const endStr = format(end, "yyyy-MM-dd");

      const [mealsRes, goalsRes, symptomRes, weightRes] = await Promise.all([
        supabase
          .from("nutrition_entries")
          .select("id, entry_date, meal_name, meal_type, calories, protein, carbs, fat, fiber, created_at")
          .eq("user_id", userId!)
          .gte("entry_date", startStr)
          .lte("entry_date", endStr),
        supabase
          .from("user_nutrition_goals")
          .select("calories_goal, protein_goal, carbs_goal, fat_goal")
          .eq("user_id", userId!)
          .maybeSingle(),
        supabase
          .from("symptom_entries")
          .select("entry_date")
          .eq("user_id", userId!)
          .gte("entry_date", startStr)
          .lte("entry_date", endStr),
        supabase
          .from("health_tracking_entries")
          .select("entry_date, value")
          .eq("user_id", userId!)
          .eq("metric_type", "weight")
          .gte("entry_date", startStr)
          .lte("entry_date", endStr)
          .order("entry_date", { ascending: true }),
      ]);

      const meals = mealsRes.data ?? [];
      const caloriesGoal = goalsRes.data?.calories_goal ?? 2000;
      const proteinGoal = goalsRes.data?.protein_goal ?? 50;
      const fiberGoal = 30;

      // Per dag
      const dayKeys = Array.from({ length: 7 }, (_, i) =>
        format(new Date(start.getTime() + i * 86400000), "yyyy-MM-dd"),
      );
      const perDay = dayKeys.map((d) => {
        const list = meals.filter((m) => m.entry_date === d);
        return {
          date: d,
          count: list.length,
          calories: list.reduce((s, m) => s + (m.calories ?? 0), 0),
          protein: list.reduce((s, m) => s + Number(m.protein ?? 0), 0),
          carbs: list.reduce((s, m) => s + Number(m.carbs ?? 0), 0),
          fat: list.reduce((s, m) => s + Number(m.fat ?? 0), 0),
          fiber: list.reduce((s, m) => s + Number(m.fiber ?? 0), 0),
        };
      });

      const elapsedDays = Math.min(7, differenceInCalendarDays(now, start) + 1);
      const activeDays = perDay.filter((d) => d.count > 0);
      const completeDays = perDay.filter((d) => d.count >= 3).length;
      const mealsLogged = meals.length;

      const cals = activeDays.map((d) => d.calories).filter((c) => c > 0);
      const caloriesAvg = cals.length ? Math.round(cals.reduce((a, b) => a + b, 0) / cals.length) : 0;
      const caloriesMin = cals.length ? Math.min(...cals) : 0;
      const caloriesMax = cals.length ? Math.max(...cals) : 0;

      const totP = activeDays.reduce((s, d) => s + d.protein, 0);
      const totC = activeDays.reduce((s, d) => s + d.carbs, 0);
      const totF = activeDays.reduce((s, d) => s + d.fat, 0);
      const kcalP = totP * 4;
      const kcalC = totC * 4;
      const kcalF = totF * 9;
      const kcalSum = kcalP + kcalC + kcalF;
      const macros = kcalSum
        ? {
            protein: Math.round((kcalP / kcalSum) * 100),
            carbs: Math.round((kcalC / kcalSum) * 100),
            fat: Math.round((kcalF / kcalSum) * 100),
          }
        : { protein: 0, carbs: 0, fat: 0 };

      const fiberAvg = activeDays.length
        ? Math.round(activeDays.reduce((s, d) => s + d.fiber, 0) / activeDays.length)
        : 0;

      const daysInGoal = {
        energy: perDay.map((d) => d.count > 0 && Math.abs(d.calories - caloriesGoal) <= caloriesGoal * 0.15),
        protein: perDay.map((d) => d.count > 0 && d.protein >= proteinGoal * 0.9),
        fiber: perDay.map((d) => d.count > 0 && d.fiber >= fiberGoal * 0.8),
      };

      const planFollowedPct = activeDays.length
        ? Math.round((daysInGoal.energy.filter(Boolean).length / Math.max(1, elapsedDays)) * 100)
        : 0;

      // Måltidsmönster
      const mealsPerDay = activeDays.length
        ? Math.round((mealsLogged / activeDays.length) * 10) / 10
        : 0;

      const hours = meals
        .map((m) => (m.created_at ? new Date(m.created_at).getHours() : null))
        .filter((h): h is number => h !== null);
      const buckets = [
        { from: 5, to: 10, tone: "gold" as const },
        { from: 10, to: 14, tone: "sage" as const },
        { from: 14, to: 17, tone: "apricot" as const },
        { from: 17, to: 23, tone: "sage" as const },
      ];
      const mealPoints = buckets
        .map((b) => {
          const n = hours.filter((h) => h >= b.from && h < b.to).length;
          const mid = (b.from + b.to) / 2;
          const pct = Math.max(4, Math.min(94, ((mid - 6) / 16) * 100));
          return { pct, size: n === 0 ? 0 : Math.min(22, 10 + n * 1.5), tone: b.tone };
        })
        .filter((p) => p.size > 0);

      const skippedLunch = perDay.filter(
        (d) =>
          d.count > 0 &&
          !meals.some(
            (m) =>
              m.entry_date === d.date &&
              (m.meal_type ?? "").toLowerCase().includes("lunch"),
          ),
      ).length;


      const patternInsights: WeeklyReportData["patternInsights"] = [];
      if (activeDays.length >= 3) {
        patternInsights.push({
          tone: "sage",
          bold: "Vardagar:",
          text: `${mealsPerDay} måltider per dag i snitt`,
        });
      }
      const weekendMeals = perDay.slice(5).reduce((s, d) => s + d.count, 0);
      patternInsights.push({
        tone: "gold",
        bold: "Helg:",
        text: weekendMeals ? `${weekendMeals} loggade måltider under lördag–söndag` : "inga loggade måltider ännu",
      });
      if (skippedLunch > 0) {
        patternInsights.push({
          tone: "terracotta",
          bold: `Lunch saknas ${skippedLunch} ${skippedLunch === 1 ? "dag" : "dagar"}`,
          text: "— dagar med loggning men utan lunchpost",
        });
      }

      // Matkvalitet
      const names = meals.map((m) => (m.meal_name ?? "").toLowerCase());
      const distinct = new Set(names.filter(Boolean)).size;
      const fiberDays = daysInGoal.fiber.filter(Boolean).length;
      const proteinDays = daysInGoal.protein.filter(Boolean).length;
      const sweets = names.filter((n) => SWEET_WORDS.some((w) => n.includes(w))).length;
      const quality: WeeklyReportData["quality"] = [
        {
          label: "Fullkorn & fiberrikt",
          value: `${fiberDays} av 7 dagar`,
          pct: (fiberDays / 7) * 100,
          tone: "sage",
        },
        {
          label: "Proteinmål nått",
          value: `${proteinDays} av 7 dagar`,
          pct: (proteinDays / 7) * 100,
          tone: "sage",
        },
        {
          label: "Variation i råvaror",
          value: `${distinct} olika`,
          pct: Math.min(100, (distinct / 20) * 100),
          tone: "gold",
        },
        {
          label: "Måltider loggade",
          value: `${mealsLogged} st`,
          pct: Math.min(100, (mealsLogged / 21) * 100),
          tone: "gold",
        },
        {
          label: "Sötsaker & alkohol",
          value: `${sweets} tillfällen`,
          pct: Math.min(100, sweets * 20),
          tone: "apricot",
        },
      ];
      const qualityNote =
        fiberAvg < fiberGoal
          ? `Fiberintaget låg på ${fiberAvg} g/dag i snitt — bra att väva in fler baljväxter och fullkorn i nästa veckas planering.`
          : "Fiberintaget låg i nivå med målet — fint underlag att bygga vidare på nästa vecka.";

      // Hunger & mående (ingen datakälla ännu)
      const hasWellbeingData = false;
      const scales: WeeklyReportData["scales"] = [];
      const cravingNote = hours.filter((h) => h >= 20).length
        ? `Sena måltider loggades ${hours.filter((h) => h >= 20).length} gånger, framför allt kvällar utan mellanmål`
        : null;

      // Symptomfria dagar
      const symptomDates = new Set((symptomRes.data ?? []).map((s) => s.entry_date));
      const symptomFreeDays = dayKeys.slice(0, elapsedDays).filter((d) => !symptomDates.has(d)).length;

      // Vikt
      const weights = weightRes.data ?? [];
      const weightChange =
        weights.length >= 2
          ? Math.round((Number(weights[weights.length - 1].value) - Number(weights[0].value)) * 10) / 10
          : null;

      // Samband (regelstyrt, max 3)
      const correlations: string[] = [];
      if (fiberDays >= 3)
        correlations.push(`Du nådde fibermålet ${fiberDays} av veckans dagar.`);
      if (completeDays >= 3)
        correlations.push(`Regelbundenheten höll i sig — ${completeDays} dagar med tre eller fler måltider.`);
      if (skippedLunch > 0)
        correlations.push(
          `Lunch saknades ${skippedLunch} ${skippedLunch === 1 ? "dag" : "dagar"} med annan loggning.`,
        );
      if (correlations.length === 0)
        correlations.push("Logga några fler dagar så hittar vi mönster i din vecka.");

      const highlight =
        fiberDays >= 3
          ? `Fibermålet nått ${fiberDays} av veckans dagar`
          : completeDays >= 3
            ? `${completeDays} kompletta dagar den här veckan`
            : "Fortsätt logga — varje dag ger tydligare mönster";


      return {
        weekStart: startStr,
        weekNumber: getISOWeek(now),
        rangeLabel: `${format(start, "d MMM", { locale: sv })} – ${format(end, "d MMM", { locale: sv })}`,
        completeDays,
        mealsLogged,
        planFollowedPct,
        highlight,
        caloriesAvg,
        caloriesMin,
        caloriesMax,
        macros,
        fiberAvg,
        fiberGoal,
        daysInGoal,
        mealsPerDay,
        mealPoints,
        patternInsights,
        quality,
        qualityNote,
        hasWellbeingData,
        scales,
        cravingNote,
        correlations: correlations.slice(0, 3),
        symptomFreeDays,
        weightChange,
        loggedDays: activeDays.length,
      };
    },
  });
}
