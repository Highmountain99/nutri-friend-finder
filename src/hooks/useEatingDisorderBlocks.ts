import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";

export interface MealRhythm {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snack: boolean;
}

export interface DayEntry {
  date: string;
  count: number;
  hasThreePlus: boolean;
}

export interface SymptomPattern {
  timeLabel: string;
  count: number;
}

export interface WeeklyCheckin {
  loggedDays: number;
  totalDays: 7;
  averageMealsPerDay: number;
  stability: "stabil" | "delvis" | "oregelbunden";
}

export function useEatingDisorderBlocks(userId: string | undefined) {
  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const fourteenDaysAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");

  const { data: nutritionEntries } = useQuery({
    queryKey: ["ed-nutrition", userId, thirtyDaysAgo],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("nutrition_entries")
        .select("id, entry_date, meal_type, created_at")
        .eq("user_id", userId!)
        .gte("entry_date", thirtyDaysAgo)
        .order("entry_date", { ascending: true });
      return data || [];
    },
  });

  const { data: symptomEntries } = useQuery({
    queryKey: ["ed-symptoms", userId, fourteenDaysAgo],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("symptom_entries")
        .select("id, entry_date, symptom_time, description, meal_id")
        .eq("user_id", userId!)
        .gte("entry_date", fourteenDaysAgo);
      return data || [];
    },
  });

  const { data: nextAppointment } = useQuery({
    queryKey: ["ed-next-appointment", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, appointment_date, notes")
        .eq("user_id", userId!)
        .eq("status", "booked")
        .gt("appointment_date", new Date().toISOString())
        .order("appointment_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: activePlan } = useQuery({
    queryKey: ["ed-treatment-plan", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: plan } = await supabase
        .from("treatment_plans")
        .select("id, title, description")
        .eq("patient_id", userId!)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!plan) return null;

      const { data: goals } = await supabase
        .from("treatment_goals")
        .select("id, title, status")
        .eq("plan_id", plan.id)
        .order("sort_order");

      const goalIds = (goals || []).map((g) => g.id);
      let milestones: any[] = [];
      if (goalIds.length > 0) {
        const { data: ms } = await supabase
          .from("treatment_milestones")
          .select("id, title, is_completed, completed_at, goal_id")
          .in("goal_id", goalIds)
          .order("sort_order");
        milestones = ms || [];
      }

      return { ...plan, goals: goals || [], milestones };
    },
  });

  // Computed: meal rhythm today
  const mealRhythm: MealRhythm = (() => {
    const todayEntries = (nutritionEntries || []).filter((e) => e.entry_date === today);
    const types = todayEntries.map((e) => (e.meal_type || "").toLowerCase());
    return {
      breakfast: types.some((t) => t.includes("frukost") || t === "breakfast"),
      lunch: types.some((t) => t.includes("lunch")),
      dinner: types.some((t) => t.includes("middag") || t === "dinner"),
      snack: types.some((t) => t.includes("mellanmål") || t === "snack"),
    };
  })();

  // Computed: 30-day regularity grid
  const regularityGrid: DayEntry[] = (() => {
    const grid: DayEntry[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const count = (nutritionEntries || []).filter((e) => e.entry_date === d).length;
      grid.push({ date: d, count, hasThreePlus: count >= 3 });
    }
    return grid;
  })();

  const daysWithThreePlus = regularityGrid.filter((d) => d.hasThreePlus).length;

  // Computed: 7d meal structure
  const mealStructure: { label: string; avgMeals: number } = (() => {
    const last7 = regularityGrid.slice(-7);
    const daysLogged = last7.filter((d) => d.count > 0).length;
    const totalMeals = last7.reduce((sum, d) => sum + d.count, 0);
    const avg = daysLogged > 0 ? totalMeals / daysLogged : 0;
    let label = "Oregelbunden";
    if (avg >= 3.5) label = "Regelbunden (3+ mål/dag)";
    else if (avg >= 2.5) label = "Delvis regelbunden";
    return { label, avgMeals: Math.round(avg * 10) / 10 };
  })();

  // Computed: weekly checkin
  const weeklyCheckin: WeeklyCheckin = (() => {
    const last7 = regularityGrid.slice(-7);
    const loggedDays = last7.filter((d) => d.count > 0).length;
    const totalMeals = last7.reduce((sum, d) => sum + d.count, 0);
    const avg = loggedDays > 0 ? totalMeals / loggedDays : 0;
    let stability: WeeklyCheckin["stability"] = "oregelbunden";
    if (loggedDays >= 6 && avg >= 3) stability = "stabil";
    else if (loggedDays >= 4) stability = "delvis";
    return { loggedDays, totalDays: 7, averageMealsPerDay: Math.round(avg * 10) / 10, stability };
  })();

  // Computed: symptom patterns
  const symptomPatterns: SymptomPattern[] = (() => {
    if (!symptomEntries || symptomEntries.length === 0) return [];
    const buckets: Record<string, number> = {};
    for (const s of symptomEntries) {
      const hour = new Date(s.symptom_time).getHours();
      let label = "Morgon";
      if (hour >= 11 && hour < 14) label = "Lunch";
      else if (hour >= 14 && hour < 17) label = "Eftermiddag";
      else if (hour >= 17 && hour < 21) label = "Kväll";
      else if (hour >= 21) label = "Natt";
      buckets[label] = (buckets[label] || 0) + 1;
    }
    return Object.entries(buckets)
      .map(([timeLabel, count]) => ({ timeLabel, count }))
      .sort((a, b) => b.count - a.count);
  })();

  return {
    mealRhythm,
    regularityGrid,
    daysWithThreePlus,
    mealStructure,
    weeklyCheckin,
    symptomPatterns,
    nextAppointment,
    activePlan,
    isLoading: !nutritionEntries,
  };
}
