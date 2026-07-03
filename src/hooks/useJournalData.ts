import { useState, useEffect, useCallback } from "react";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Types for journal data
export interface NutritionGoals {
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  setByDietist: boolean;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Ingredient {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  dataSource?: "livsmedelsverket" | "ai_estimation";
}

export interface NutritionEntry {
  id: string;
  mealName: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isAiEstimated: boolean;
  imageUrl?: string;
  ingredients?: Ingredient[];
  createdAt: Date;
}

export interface SymptomEntry {
  id: string;
  mealId: string | null;
  description: string;
  symptomTime: Date;
  createdAt: Date;
}

export interface HealthMetrics {
  steps: number;
  activeEnergy: number;
}

export interface NutritionSettings {
  aiTrackingEnabled: boolean;
  aiTrackingOnboardingCompleted: boolean;
  showCalories: boolean;
  showProtein: boolean;
  showCarbs: boolean;
  showFat: boolean;
  gender?: "male" | "female" | "other";
  heightCm?: number;
  weightKg?: number;
  activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "active" | "very_active";
}

export interface AppleHealthSettings {
  connected: boolean;
  lastSyncAt?: Date;
}

// Default values
const DEFAULT_GOALS: NutritionGoals = {
  caloriesGoal: 2000,
  proteinGoal: 50,
  carbsGoal: 250,
  fatGoal: 65,
  setByDietist: false,
};

const DEFAULT_SETTINGS: NutritionSettings = {
  aiTrackingEnabled: false,
  aiTrackingOnboardingCompleted: false,
  showCalories: true,
  showProtein: true,
  showCarbs: true,
  showFat: true,
};

// Helper to get meal type based on time
function getMealTypeFromTime(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return "Frukost";
  if (hour >= 10 && hour < 12) return "Förmiddagssnack";
  if (hour >= 12 && hour < 14) return "Lunch";
  if (hour >= 14 && hour < 17) return "Mellanmål";
  if (hour >= 17 && hour < 21) return "Middag";
  return "Kvällssnack";
}

// Calculate streak from an array of date strings
function calculateStreak(datesWithEntries: string[]): number {
  if (datesWithEntries.length === 0) return 0;

  // Sort dates in descending order (newest first)
  const sortedDates = [...datesWithEntries].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = subDays(today, 1);
  yesterday.setHours(0, 0, 0, 0);

  // Check if there's an entry today or yesterday to start the streak
  const mostRecentDate = parseISO(sortedDates[0]);
  mostRecentDate.setHours(0, 0, 0, 0);

  const hasEntryToday = isSameDay(mostRecentDate, today);
  const hasEntryYesterday = isSameDay(mostRecentDate, yesterday);

  // If no entry today or yesterday, streak is 0
  if (!hasEntryToday && !hasEntryYesterday) return 0;

  // Start counting from the most recent entry
  let streak = 1;
  let expectedDate = hasEntryToday ? subDays(today, 1) : subDays(yesterday, 1);

  for (let i = 1; i < sortedDates.length; i++) {
    const entryDate = parseISO(sortedDates[i]);
    entryDate.setHours(0, 0, 0, 0);

    if (isSameDay(entryDate, expectedDate)) {
      streak++;
      expectedDate = subDays(expectedDate, 1);
    } else if (entryDate < expectedDate) {
      // Gap in the streak
      break;
    }
    // If entryDate > expectedDate, it's a duplicate day, skip it
  }

  return streak;
}

// Module-level cache so returning to /journal shows previous data instantly
// while a fresh fetch runs in the background.
interface DayCache {
  entries: NutritionEntry[];
  symptoms: SymptomEntry[];
  totals: DailyTotals;
  healthMetrics: HealthMetrics;
}
interface UserCache {
  settings?: NutritionSettings;
  goals?: NutritionGoals;
  appleHealth?: AppleHealthSettings;
  daysWithEntries?: string[];
  streak?: number;
  days: Map<string, DayCache>;
  prefetchedAt?: number; // timestamp of last bulk prefetch
}
const journalCache = new Map<string, UserCache>();
const PREFETCH_TTL_MS = 60_000; // refresh bulk prefetch at most once per minute
const PREFETCH_DAYS = 30;
function getUserCache(userId: string): UserCache {
  let c = journalCache.get(userId);
  if (!c) {
    c = { days: new Map() };
    journalCache.set(userId, c);
  }
  return c;
}

function mapEntry(entry: Record<string, unknown>): NutritionEntry {
  return {
    id: entry.id as string,
    mealName: (entry.meal_name as string) || "Okänd måltid",
    mealType: (entry.meal_type as string) || getMealTypeFromTime(new Date((entry.created_at as string) || Date.now())),
    calories: (entry.calories as number) || 0,
    protein: Number(entry.protein) || 0,
    carbs: Number(entry.carbs) || 0,
    fat: Number(entry.fat) || 0,
    isAiEstimated: (entry.is_ai_estimated as boolean) || false,
    imageUrl: (entry.image_url as string) || undefined,
    createdAt: new Date((entry.created_at as string) || Date.now()),
  };
}

function mapSymptom(symptom: Record<string, unknown>): SymptomEntry {
  return {
    id: symptom.id as string,
    mealId: (symptom.meal_id as string) || null,
    description: symptom.description as string,
    symptomTime: new Date(symptom.symptom_time as string),
    createdAt: new Date((symptom.created_at as string) || Date.now()),
  };
}

function sumTotals(entries: NutritionEntry[]): DailyTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// Columns to select for list views — exclude `image_url` because meal photos
// are often stored as huge base64 blobs that would hang bulk/day queries and
// prevent historical logging from ever loading.
const ENTRY_LIST_COLUMNS =
  "id, entry_date, meal_name, meal_type, calories, protein, carbs, fat, is_ai_estimated, created_at";



export function useJournalData(selectedDate: Date) {
  const { user } = useAuth();
  const dateKey = format(selectedDate, "yyyy-MM-dd");

  // Hydrate initial state from cache to avoid empty-flash on remount
  const cached = user ? getUserCache(user.id) : undefined;
  const cachedDay = cached?.days.get(dateKey);

  const [isLoading, setIsLoading] = useState(!cachedDay);
  const [goals, setGoals] = useState<NutritionGoals>(cached?.goals ?? DEFAULT_GOALS);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>(cachedDay?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [entries, setEntries] = useState<NutritionEntry[]>(cachedDay?.entries ?? []);
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(cachedDay?.symptoms ?? []);
  const [settings, setSettings] = useState<NutritionSettings>(cached?.settings ?? DEFAULT_SETTINGS);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>(cachedDay?.healthMetrics ?? { steps: 0, activeEnergy: 0 });
  const [appleHealthSettings, setAppleHealthSettings] = useState<AppleHealthSettings>(cached?.appleHealth ?? { connected: false });
  const [streak, setStreak] = useState(cached?.streak ?? 0);
  const [daysWithEntries, setDaysWithEntries] = useState<string[]>(cached?.daysWithEntries ?? []);

  const calculateTotals = useCallback((entries: NutritionEntry[]) => {
    const totals = entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    setDailyTotals(totals);
    return totals;
  }, []);

  // Load all entry dates for streak calculation and calendar markers
  const loadEntryDates = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("nutrition_entries")
      .select("entry_date")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false });

    if (data) {
      const uniqueDates = [...new Set(data.map(d => d.entry_date))];
      const s = calculateStreak(uniqueDates);
      setDaysWithEntries(uniqueDates);
      setStreak(s);
      const uc = getUserCache(user.id);
      uc.daysWithEntries = uniqueDates;
      uc.streak = s;
    }
  }, [user]);

  // USER-LEVEL data (settings, goals, apple health, entry-dates).
  // These don't change with selectedDate — load once per user.
  useEffect(() => {
    if (!user) return;
    const uc = getUserCache(user.id);

    (async () => {
      const [settingsRes, goalsRes, appleHealthRes] = await Promise.all([
        supabase.from("user_nutrition_settings").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_nutrition_goals").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("apple_health_settings").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (settingsRes.data) {
        const s = settingsRes.data;
        const next: NutritionSettings = {
          aiTrackingEnabled: s.ai_tracking_enabled || false,
          aiTrackingOnboardingCompleted: s.ai_tracking_onboarding_completed || false,
          showCalories: s.show_calories ?? true,
          showProtein: s.show_protein ?? true,
          showCarbs: s.show_carbs ?? true,
          showFat: s.show_fat ?? true,
          gender: s.gender || undefined,
          heightCm: s.height_cm ? Number(s.height_cm) : undefined,
          weightKg: s.weight_kg ? Number(s.weight_kg) : undefined,
          activityLevel: s.activity_level || undefined,
        };
        setSettings(next);
        uc.settings = next;
      }

      if (goalsRes.data) {
        const g = goalsRes.data;
        const nextGoals: NutritionGoals = {
          caloriesGoal: g.calories_goal || 2000,
          proteinGoal: g.protein_goal || 50,
          carbsGoal: g.carbs_goal || 250,
          fatGoal: g.fat_goal || 65,
          setByDietist: g.set_by_dietist || false,
        };
        setGoals(nextGoals);
        uc.goals = nextGoals;
      }

      if (appleHealthRes.data) {
        const ah: AppleHealthSettings = {
          connected: appleHealthRes.data.connected || false,
          lastSyncAt: appleHealthRes.data.last_sync_at ? new Date(appleHealthRes.data.last_sync_at) : undefined,
        };
        setAppleHealthSettings(ah);
        uc.appleHealth = ah;
      }

      loadEntryDates();

      // Bulk-prefetch last PREFETCH_DAYS days of entries/symptoms/metrics
      // so date switches within that window are instant (no network).
      if (!uc.prefetchedAt || Date.now() - uc.prefetchedAt > PREFETCH_TTL_MS) {
        const today = new Date();
        const fromDate = format(subDays(today, PREFETCH_DAYS - 1), "yyyy-MM-dd");

        const [entriesBulk, symptomsBulk, metricsBulk] = await Promise.all([
          supabase.from("nutrition_entries").select(ENTRY_LIST_COLUMNS).eq("user_id", user.id).gte("entry_date", fromDate),
          supabase.from("symptom_entries").select("*").eq("user_id", user.id).gte("entry_date", fromDate),
          supabase.from("daily_health_metrics").select("*").eq("user_id", user.id).gte("metric_date", fromDate),
        ]);

        // Group by date
        const byDate = new Map<string, { entries: NutritionEntry[]; symptoms: SymptomEntry[]; metrics?: HealthMetrics }>();
        const ensure = (d: string) => {
          let b = byDate.get(d);
          if (!b) { b = { entries: [], symptoms: [] }; byDate.set(d, b); }
          return b;
        };
        (entriesBulk.data ?? []).forEach((row: Record<string, unknown>) => {
          ensure(row.entry_date as string).entries.push(mapEntry(row));
        });
        (symptomsBulk.data ?? []).forEach((row: Record<string, unknown>) => {
          ensure(row.entry_date as string).symptoms.push(mapSymptom(row));
        });
        (metricsBulk.data ?? []).forEach((row: Record<string, unknown>) => {
          ensure(row.metric_date as string).metrics = {
            steps: (row.steps as number) || 0,
            activeEnergy: Number(row.active_energy_kcal) || 0,
          };
        });

        byDate.forEach((b, d) => {
          uc.days.set(d, {
            entries: b.entries,
            symptoms: b.symptoms,
            totals: sumTotals(b.entries),
            healthMetrics: b.metrics ?? { steps: 0, activeEnergy: 0 },
          });
        });
        uc.prefetchedAt = Date.now();

        // If current selected date got fresh data, push to state
        const dc = uc.days.get(dateKey);
        if (dc) {
          setEntries(dc.entries);
          setSymptoms(dc.symptoms);
          setDailyTotals(dc.totals);
          setHealthMetrics(dc.healthMetrics);
        }
      }
    })();
  }, [user, loadEntryDates, dateKey]);

  // DAY-LEVEL data — only fetches when the date is NOT already in the cache.
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const uc = getUserCache(user.id);
    const dc = uc.days.get(dateKey);

    // Cache hit → render instantly, no network
    if (dc) {
      setEntries(dc.entries);
      setSymptoms(dc.symptoms);
      setDailyTotals(dc.totals);
      setHealthMetrics(dc.healthMetrics);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let cancelled = false;

    (async () => {
      try {
        const [entriesRes, symptomsRes, metricsRes] = await Promise.all([
          supabase.from("nutrition_entries").select(ENTRY_LIST_COLUMNS).eq("user_id", user.id).eq("entry_date", dateKey),
          supabase.from("symptom_entries").select("*").eq("user_id", user.id).eq("entry_date", dateKey),
          supabase.from("daily_health_metrics").select("*").eq("user_id", user.id).eq("metric_date", dateKey).maybeSingle(),
        ]);
        if (cancelled) return;

        const nextEntries = (entriesRes.data ?? []).map((r) => mapEntry(r as Record<string, unknown>));
        setEntries(nextEntries);
        const nextTotals = sumTotals(nextEntries);
        setDailyTotals(nextTotals);

        const nextSymptoms = (symptomsRes.data ?? []).map((r) => mapSymptom(r as Record<string, unknown>));
        setSymptoms(nextSymptoms);

        const nextMetrics: HealthMetrics = metricsRes.data
          ? { steps: metricsRes.data.steps || 0, activeEnergy: Number(metricsRes.data.active_energy_kcal) || 0 }
          : { steps: 0, activeEnergy: 0 };
        setHealthMetrics(nextMetrics);

        uc.days.set(dateKey, {
          entries: nextEntries,
          symptoms: nextSymptoms,
          totals: nextTotals,
          healthMetrics: nextMetrics,
        });
      } catch (error) {
        console.error("Failed to load journal data:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, dateKey]);


  // Keep per-day cache in sync with local mutations
  useEffect(() => {
    if (!user) return;
    const uc = getUserCache(user.id);
    uc.days.set(dateKey, { entries, symptoms, totals: dailyTotals, healthMetrics });
  }, [user, dateKey, entries, symptoms, dailyTotals, healthMetrics]);




  const addEntry = useCallback(
    async (entry: Omit<NutritionEntry, "id" | "createdAt">) => {
      if (!user) return;

      // Optimistic update — render the meal immediately with a temp id
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticEntry: NutritionEntry = {
        id: tempId,
        mealName: entry.mealName,
        mealType: entry.mealType,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        isAiEstimated: entry.isAiEstimated,
        imageUrl: entry.imageUrl,
        ingredients: entry.ingredients,
        createdAt: new Date(),
      };
      const optimisticEntries = [...entries, optimisticEntry];
      setEntries(optimisticEntries);
      calculateTotals(optimisticEntries);

      const insertData = {
        user_id: user.id,
        entry_date: dateKey,
        meal_name: entry.mealName,
        meal_type: entry.mealType,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        is_ai_estimated: entry.isAiEstimated,
        image_url: entry.imageUrl,
      };

      const { data, error } = await supabase
        .from("nutrition_entries")
        .insert(insertData as typeof insertData & { meal_type: string })
        .select()
        .single();

      if (data && !error) {
        // Reconcile temp id with real server id
        setEntries((prev) =>
          prev.map((e) =>
            e.id === tempId
              ? {
                  ...e,
                  id: data.id,
                  createdAt: new Date(data.created_at || Date.now()),
                }
              : e
          )
        );
        // Fire-and-forget: refresh streak markers without blocking UI
        loadEntryDates();
      } else if (error) {
        // Roll back optimistic update
        const rolledBack = entries;
        setEntries(rolledBack);
        calculateTotals(rolledBack);
      }
    },
    [user, entries, dateKey, calculateTotals, loadEntryDates]
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<NutritionEntry> & { mealTime?: Date }) => {
      if (!user) return;

      // Calculate new entry_date if mealTime changed
      const newEntryDate = updates.mealTime 
        ? format(updates.mealTime, "yyyy-MM-dd") 
        : undefined;
      
      const newCreatedAt = updates.mealTime?.toISOString();

      const { error } = await supabase
        .from("nutrition_entries")
        .update({
          meal_name: updates.mealName,
          meal_type: updates.mealType,
          calories: updates.calories,
          protein: updates.protein,
          carbs: updates.carbs,
          fat: updates.fat,
          is_ai_estimated: updates.isAiEstimated,
          image_url: updates.imageUrl,
          ...(newEntryDate && { entry_date: newEntryDate }),
          ...(newCreatedAt && { created_at: newCreatedAt }),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (!error) {
        // If date changed, remove from current entries list
        const dateChanged = newEntryDate && newEntryDate !== dateKey;
        
        if (dateChanged) {
          const updatedEntries = entries.filter((entry) => entry.id !== id);
          setEntries(updatedEntries);
          calculateTotals(updatedEntries);
        } else {
          const updatedEntries = entries.map((entry) =>
            entry.id === id 
              ? { 
                  ...entry, 
                  ...updates,
                  createdAt: updates.mealTime || entry.createdAt,
                } 
              : entry
          );
          setEntries(updatedEntries);
          calculateTotals(updatedEntries);
        }
        
        // Reload entry dates to update calendar markers
        await loadEntryDates();
      }
    },
    [user, entries, dateKey, calculateTotals, loadEntryDates]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!user) return;

      const { error } = await supabase
        .from("nutrition_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (!error) {
        const updatedEntries = entries.filter((entry) => entry.id !== id);
        setEntries(updatedEntries);
        calculateTotals(updatedEntries);
        
        // Reload entry dates to update streak
        await loadEntryDates();
      }
    },
    [user, entries, calculateTotals, loadEntryDates]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<NutritionSettings>) => {
      if (!user) return;

      const updated = { ...settings, ...newSettings };
      setSettings(updated);

      // Upsert settings
      await supabase.from("user_nutrition_settings").upsert({
        user_id: user.id,
        ai_tracking_enabled: updated.aiTrackingEnabled,
        ai_tracking_onboarding_completed: updated.aiTrackingOnboardingCompleted,
        show_calories: updated.showCalories,
        show_protein: updated.showProtein,
        show_carbs: updated.showCarbs,
        show_fat: updated.showFat,
        gender: updated.gender,
        height_cm: updated.heightCm,
        weight_kg: updated.weightKg,
        activity_level: updated.activityLevel,
      });
    },
    [user, settings]
  );

  const updateGoals = useCallback(
    async (newGoals: Partial<NutritionGoals>) => {
      if (!user) return;

      const wasSetByDietist = goals.setByDietist;
      const updated = { ...goals, ...newGoals, setByDietist: false };
      setGoals(updated);

      // Upsert goals
      await supabase.from("user_nutrition_goals").upsert({
        user_id: user.id,
        calories_goal: updated.caloriesGoal,
        protein_goal: updated.proteinGoal,
        carbs_goal: updated.carbsGoal,
        fat_goal: updated.fatGoal,
        set_by_dietist: false,
      }, { onConflict: "user_id" });

      // If the goals were set by a dietist, notify them
      if (wasSetByDietist) {
        const { data: assignment } = await supabase
          .from("dietist_patient_assignments")
          .select("dietist_id")
          .eq("patient_id", user.id)
          .limit(1)
          .maybeSingle();

        if (assignment) {
          await supabase.from("dietitian_notifications").insert({
            dietitian_id: assignment.dietist_id,
            patient_id: user.id,
            notification_type: "goal_override",
            message: "Patienten har ändrat sina näringsmål som du tidigare satt.",
          });
        }
      }
    },
    [user, goals]
  );

  const connectAppleHealth = useCallback(async () => {
    if (!user) return;

    const updated: AppleHealthSettings = { connected: true, lastSyncAt: new Date() };
    setAppleHealthSettings(updated);

    await supabase.from("apple_health_settings").upsert({
      user_id: user.id,
      connected: true,
      last_sync_at: new Date().toISOString(),
    });
  }, [user]);

  // Symptom CRUD operations
  const addSymptom = useCallback(
    async (symptom: { mealId: string | null; description: string; symptomTime: Date }) => {
      if (!user) return;

      const { data, error } = await supabase
        .from("symptom_entries")
        .insert({
          user_id: user.id,
          meal_id: symptom.mealId,
          entry_date: dateKey,
          symptom_time: symptom.symptomTime.toISOString(),
          description: symptom.description,
        })
        .select()
        .single();

      if (data && !error) {
        const newSymptom: SymptomEntry = {
          id: data.id,
          mealId: data.meal_id || null,
          description: data.description,
          symptomTime: new Date(data.symptom_time),
          createdAt: new Date(data.created_at || Date.now()),
        };
        setSymptoms((prev) => [...prev, newSymptom]);
      }
    },
    [user, dateKey]
  );

  const updateSymptom = useCallback(
    async (id: string, updates: Partial<SymptomEntry>) => {
      if (!user) return;

      const { error } = await supabase
        .from("symptom_entries")
        .update({
          meal_id: updates.mealId,
          description: updates.description,
          symptom_time: updates.symptomTime?.toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (!error) {
        setSymptoms((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
        );
      }
    },
    [user]
  );

  const deleteSymptom = useCallback(
    async (id: string) => {
      if (!user) return;

      const { error } = await supabase
        .from("symptom_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (!error) {
        setSymptoms((prev) => prev.filter((s) => s.id !== id));
      }
    },
    [user]
  );

  return {
    isLoading,
    goals,
    dailyTotals,
    entries,
    symptoms,
    settings,
    healthMetrics,
    appleHealthSettings,
    streak,
    daysWithEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    addSymptom,
    updateSymptom,
    deleteSymptom,
    updateSettings,
    updateGoals,
    connectAppleHealth,
  };
}
