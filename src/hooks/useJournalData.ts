import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";

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

// Mock data for demo purposes - will be replaced with Supabase queries when auth is implemented
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
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [settings, setSettings] = useState<NutritionSettings>(DEFAULT_SETTINGS);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({ steps: 0, activeEnergy: 0 });
  const [appleHealthSettings, setAppleHealthSettings] = useState<AppleHealthSettings>({ connected: false });

  const dateKey = format(selectedDate, "yyyy-MM-dd");

  // Load data for selected date
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate loading from database
    // In production, this would fetch from Supabase based on user and date
    const timer = setTimeout(() => {
      // Load from localStorage for demo
      const storedEntries = localStorage.getItem(`nutrition_entries_${dateKey}`);
      const storedSettings = localStorage.getItem("nutrition_settings");
      const storedGoals = localStorage.getItem("nutrition_goals");
      const storedAppleHealth = localStorage.getItem("apple_health_settings");
      
      if (storedEntries) {
        const parsed = JSON.parse(storedEntries) as NutritionEntry[];
        setEntries(parsed);
        calculateTotals(parsed);
      } else {
        setEntries([]);
        setDailyTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      }
      
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
      
      if (storedGoals) {
        setGoals(JSON.parse(storedGoals));
      }
      
      if (storedAppleHealth) {
        setAppleHealthSettings(JSON.parse(storedAppleHealth));
      }
      
      // Mock health metrics
      setHealthMetrics({
        steps: Math.floor(Math.random() * 10000) + 2000,
        activeEnergy: Math.floor(Math.random() * 500) + 100,
      });
      
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [dateKey]);

  const calculateTotals = (entries: NutritionEntry[]) => {
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
  };

  const addEntry = useCallback((entry: Omit<NutritionEntry, "id" | "createdAt">) => {
    const newEntry: NutritionEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    calculateTotals(updatedEntries);
    
    // Save to localStorage
    localStorage.setItem(`nutrition_entries_${dateKey}`, JSON.stringify(updatedEntries));
  }, [entries, dateKey]);

  const updateEntry = useCallback((id: string, updates: Partial<NutritionEntry>) => {
    const updatedEntries = entries.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    );
    setEntries(updatedEntries);
    calculateTotals(updatedEntries);
    localStorage.setItem(`nutrition_entries_${dateKey}`, JSON.stringify(updatedEntries));
  }, [entries, dateKey]);

  const deleteEntry = useCallback((id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    calculateTotals(updatedEntries);
    localStorage.setItem(`nutrition_entries_${dateKey}`, JSON.stringify(updatedEntries));
  }, [entries, dateKey]);

  const updateSettings = useCallback((newSettings: Partial<NutritionSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("nutrition_settings", JSON.stringify(updated));
  }, [settings]);

  const updateGoals = useCallback((newGoals: Partial<NutritionGoals>) => {
    const updated = { ...goals, ...newGoals };
    setGoals(updated);
    localStorage.setItem("nutrition_goals", JSON.stringify(updated));
  }, [goals]);

  const connectAppleHealth = useCallback(() => {
    const updated: AppleHealthSettings = { connected: true, lastSyncAt: new Date() };
    setAppleHealthSettings(updated);
    localStorage.setItem("apple_health_settings", JSON.stringify(updated));
  }, []);

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
