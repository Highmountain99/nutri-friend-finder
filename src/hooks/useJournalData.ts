import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
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

export interface HealthMetrics {
  steps: number;
  activeEnergy: number;
}

export interface NutritionSettings {
  aiTrackingEnabled: boolean;
  aiTrackingOnboardingCompleted: boolean;
  calorieTrackingEnabled: boolean;
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
  calorieTrackingEnabled: true,
};

export function useJournalData(selectedDate: Date) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [settings, setSettings] = useState<NutritionSettings>(DEFAULT_SETTINGS);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({ steps: 0, activeEnergy: 0 });
  const [appleHealthSettings, setAppleHealthSettings] = useState<AppleHealthSettings>({ connected: false });

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
          const mappedEntries: NutritionEntry[] = entriesData.map((entry) => ({
            id: entry.id,
            mealName: entry.meal_name || "Okänd måltid",
            mealType: "Måltid",
            calories: entry.calories || 0,
            protein: Number(entry.protein) || 0,
            carbs: Number(entry.carbs) || 0,
            fat: Number(entry.fat) || 0,
            isAiEstimated: entry.is_ai_estimated || false,
            imageUrl: entry.image_url || undefined,
            createdAt: new Date(entry.created_at || Date.now()),
          }));
          setEntries(mappedEntries);
          calculateTotals(mappedEntries);
        } else {
          setEntries([]);
          setDailyTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
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
            calorieTrackingEnabled: settingsData.calorie_tracking_enabled ?? true,
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
      } catch (error) {
        console.error("Failed to load journal data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, dateKey, calculateTotals]);

  const addEntry = useCallback(
    async (entry: Omit<NutritionEntry, "id" | "createdAt">) => {
      if (!user) return;

      const { data, error } = await supabase
        .from("nutrition_entries")
        .insert({
          user_id: user.id,
          entry_date: dateKey,
          meal_name: entry.mealName,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          is_ai_estimated: entry.isAiEstimated,
          image_url: entry.imageUrl,
        })
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
      }
    },
    [user, entries, dateKey, calculateTotals]
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<NutritionEntry>) => {
      if (!user) return;

      const { error } = await supabase
        .from("nutrition_entries")
        .update({
          meal_name: updates.mealName,
          calories: updates.calories,
          protein: updates.protein,
          carbs: updates.carbs,
          fat: updates.fat,
          is_ai_estimated: updates.isAiEstimated,
          image_url: updates.imageUrl,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (!error) {
        const updatedEntries = entries.map((entry) =>
          entry.id === id ? { ...entry, ...updates } : entry
        );
        setEntries(updatedEntries);
        calculateTotals(updatedEntries);
      }
    },
    [user, entries, calculateTotals]
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
      }
    },
    [user, entries, calculateTotals]
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
        calorie_tracking_enabled: updated.calorieTrackingEnabled,
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

  return {
    isLoading,
    goals,
    dailyTotals,
    entries,
    settings,
    healthMetrics,
    appleHealthSettings,
    addEntry,
    updateEntry,
    deleteEntry,
    updateSettings,
    updateGoals,
    connectAppleHealth,
  };
}
