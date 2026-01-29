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

export function useJournalData(selectedDate: Date) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [settings, setSettings] = useState<NutritionSettings>(DEFAULT_SETTINGS);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({ steps: 0, activeEnergy: 0 });
  const [appleHealthSettings, setAppleHealthSettings] = useState<AppleHealthSettings>({ connected: false });
  
  // Streak and days with entries
  const [streak, setStreak] = useState(0);
  const [daysWithEntries, setDaysWithEntries] = useState<string[]>([]);

  const dateKey = format(selectedDate, "yyyy-MM-dd");

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
      // Get unique dates
      const uniqueDates = [...new Set(data.map(d => d.entry_date))];
      setDaysWithEntries(uniqueDates);
      setStreak(calculateStreak(uniqueDates));
    }
  }, [user]);

  // Load data from Supabase
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);

      try {
        // Load nutrition entries for the selected date
        const { data: entriesData } = await supabase
          .from("nutrition_entries")
          .select("*")
          .eq("user_id", user.id)
          .eq("entry_date", dateKey);

        if (entriesData) {
          const mappedEntries: NutritionEntry[] = entriesData.map((entry) => {
            const entryRecord = entry as Record<string, unknown>;
            return {
              id: entry.id,
              mealName: entry.meal_name || "Okänd måltid",
              mealType: (entryRecord.meal_type as string) || getMealTypeFromTime(new Date(entry.created_at || Date.now())),
              calories: entry.calories || 0,
              protein: Number(entry.protein) || 0,
              carbs: Number(entry.carbs) || 0,
              fat: Number(entry.fat) || 0,
              isAiEstimated: entry.is_ai_estimated || false,
              imageUrl: entry.image_url || undefined,
              createdAt: new Date(entry.created_at || Date.now()),
            };
          });
          setEntries(mappedEntries);
          calculateTotals(mappedEntries);
        } else {
          setEntries([]);
          setDailyTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
        }

        // Load symptoms for the selected date
        const { data: symptomsData } = await supabase
          .from("symptom_entries")
          .select("*")
          .eq("user_id", user.id)
          .eq("entry_date", dateKey);

        if (symptomsData) {
          const mappedSymptoms: SymptomEntry[] = symptomsData.map((symptom) => ({
            id: symptom.id,
            mealId: symptom.meal_id || null,
            description: symptom.description,
            symptomTime: new Date(symptom.symptom_time),
            createdAt: new Date(symptom.created_at || Date.now()),
          }));
          setSymptoms(mappedSymptoms);
        } else {
          setSymptoms([]);
        }

        // Load nutrition settings
        const { data: settingsData } = await supabase
          .from("user_nutrition_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (settingsData) {
          setSettings({
            aiTrackingEnabled: settingsData.ai_tracking_enabled || false,
            aiTrackingOnboardingCompleted: settingsData.ai_tracking_onboarding_completed || false,
            showCalories: settingsData.show_calories ?? true,
            showProtein: settingsData.show_protein ?? true,
            showCarbs: settingsData.show_carbs ?? true,
            showFat: settingsData.show_fat ?? true,
            gender: settingsData.gender || undefined,
            heightCm: settingsData.height_cm ? Number(settingsData.height_cm) : undefined,
            weightKg: settingsData.weight_kg ? Number(settingsData.weight_kg) : undefined,
            activityLevel: settingsData.activity_level || undefined,
          });
        }

        // Load nutrition goals
        const { data: goalsData } = await supabase
          .from("user_nutrition_goals")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (goalsData) {
          setGoals({
            caloriesGoal: goalsData.calories_goal || 2000,
            proteinGoal: goalsData.protein_goal || 50,
            carbsGoal: goalsData.carbs_goal || 250,
            fatGoal: goalsData.fat_goal || 65,
            setByDietist: goalsData.set_by_dietist || false,
          });
        }

        // Load health metrics for the selected date
        const { data: metricsData } = await supabase
          .from("daily_health_metrics")
          .select("*")
          .eq("user_id", user.id)
          .eq("metric_date", dateKey)
          .maybeSingle();

        if (metricsData) {
          setHealthMetrics({
            steps: metricsData.steps || 0,
            activeEnergy: Number(metricsData.active_energy_kcal) || 0,
          });
        } else {
          setHealthMetrics({ steps: 0, activeEnergy: 0 });
        }

        // Load Apple Health settings
        const { data: appleHealthData } = await supabase
          .from("apple_health_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (appleHealthData) {
          setAppleHealthSettings({
            connected: appleHealthData.connected || false,
            lastSyncAt: appleHealthData.last_sync_at ? new Date(appleHealthData.last_sync_at) : undefined,
          });
        }

        // Load entry dates for streak
        await loadEntryDates();
      } catch (error) {
        console.error("Failed to load journal data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, dateKey, calculateTotals, loadEntryDates]);

  const addEntry = useCallback(
    async (entry: Omit<NutritionEntry, "id" | "createdAt">) => {
      if (!user) return;

      // Use type assertion to include meal_type which was added via migration
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
        const newEntry: NutritionEntry = {
          id: data.id,
          mealName: data.meal_name || "Okänd måltid",
          mealType: entry.mealType,
          calories: data.calories || 0,
          protein: Number(data.protein) || 0,
          carbs: Number(data.carbs) || 0,
          fat: Number(data.fat) || 0,
          isAiEstimated: data.is_ai_estimated || false,
          imageUrl: data.image_url || undefined,
          ingredients: entry.ingredients,
          createdAt: new Date(data.created_at || Date.now()),
        };
        const updatedEntries = [...entries, newEntry];
        setEntries(updatedEntries);
        calculateTotals(updatedEntries);
        
        // Reload entry dates to update streak
        await loadEntryDates();
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

      const updated = { ...goals, ...newGoals };
      setGoals(updated);

      // Upsert goals
      await supabase.from("user_nutrition_goals").upsert({
        user_id: user.id,
        calories_goal: updated.caloriesGoal,
        protein_goal: updated.proteinGoal,
        carbs_goal: updated.carbsGoal,
        fat_goal: updated.fatGoal,
        set_by_dietist: updated.setByDietist,
      });
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
