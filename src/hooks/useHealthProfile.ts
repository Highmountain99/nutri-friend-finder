import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ActivityLevel = Database["public"]["Enums"]["activity_level"];

interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export interface HealthProfileData {
  weightKg?: number;
  heightCm?: number;
  activityLevel?: ActivityLevel;
  conditions: string[];
  goals: string[];
  bloodPressure?: BloodPressure;
  waistCm?: number;
}

// Mappning av diagnoser till svenska etiketter
const conditionLabels: Record<string, Record<string, string>> = {
  gut_health: {
    ibs: "IBS",
    crohns: "Crohns sjukdom",
    ulcerative_colitis: "Ulcerös kolit",
    default: "Tarmhälsa",
  },
  diabetes: {
    type1: "Typ 1-diabetes",
    type2: "Typ 2-diabetes",
    prediabetes: "Prediabetes",
    default: "Diabetes",
  },
  heart_health: {
    high_blood_pressure: "Högt blodtryck",
    high_cholesterol: "Högt kolesterol",
    default: "Hjärthälsa",
  },
  womens_health: {
    pcos: "PCOS",
    endometriosis: "Endometrios",
    menopause: "Klimakteriet",
    fertility: "Fertilitet",
    default: "Kvinnohälsa",
  },
  weight_loss: {
    default: "Viktnedgång",
  },
  eating_disorder: {
    default: "Ätstörning",
  },
  general_health: {
    default: "Allmän hälsa",
  },
};

// Mappning av mål-taggar till svenska etiketter
const goalLabels: Record<string, string> = {
  goal_weight_loss: "Gå ner i vikt",
  goal_weight_gain: "Gå upp i vikt",
  goal_energy: "Få mer energi",
  goal_muscle: "Bygga muskler",
  goal_regular_eating: "Äta mer regelbundet",
  goal_reduce_sugar: "Minska socker",
  goal_more_vegetables: "Äta mer grönsaker",
  goal_better_sleep: "Bättre sömn",
  goal_reduce_stress: "Minska stress",
};

// Mappning av aktivitetsnivå till svenska etiketter
export const activityLevelLabels: Record<ActivityLevel, string> = {
  sedentary: "Stillasittande",
  lightly_active: "Lätt aktiv",
  moderately_active: "Måttligt aktiv",
  active: "Aktiv",
  very_active: "Mycket aktiv",
};

function mapConditions(
  category: string | null,
  subcategory: string | null,
  tags: string[] | null
): string[] {
  const conditions: string[] = [];

  if (category && conditionLabels[category]) {
    const subLabel = subcategory 
      ? conditionLabels[category][subcategory] 
      : null;
    const defaultLabel = conditionLabels[category].default;
    
    if (subLabel) {
      conditions.push(subLabel);
    } else if (defaultLabel) {
      conditions.push(defaultLabel);
    }
  }

  // Lägg till concern_tags som conditions om de finns
  if (tags && tags.length > 0) {
    tags.forEach((tag) => {
      // Konvertera snake_case till läsbar text
      const readable = tag
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      if (!conditions.includes(readable)) {
        conditions.push(readable);
      }
    });
  }

  return conditions;
}

function mapGoals(preferenceTags: string[] | null): string[] {
  if (!preferenceTags) return [];
  
  return preferenceTags
    .filter((tag) => tag.startsWith("goal_"))
    .map((tag) => goalLabels[tag] || tag.replace(/^goal_/, "").replace(/_/g, " "))
    .filter(Boolean);
}

export function useHealthProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["health-profile", user?.id],
    queryFn: async (): Promise<HealthProfileData> => {
      if (!user?.id) {
        return { conditions: [], goals: [] };
      }

      // Hämta data parallellt från alla källor
      const [nutritionResult, intakeResult, bloodPressureResult] = await Promise.all([
        supabase
          .from("user_nutrition_settings")
          .select("weight_kg, height_cm")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("intake_profiles")
          .select("activity_level, unified_concern_category, primary_concern_subcategory, concern_tags, preference_tags")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("health_tracking_entries")
          .select("value, metric_type, entry_date")
          .eq("user_id", user.id)
          .in("metric_type", ["blood_pressure_systolic", "blood_pressure_diastolic", "waist_circumference"])
          .order("entry_date", { ascending: false })
          .limit(10),
      ]);

      // Bygg blodtryck från senaste entries
      let bloodPressure: BloodPressure | undefined;
      if (bloodPressureResult.data && bloodPressureResult.data.length > 0) {
        const systolicEntry = bloodPressureResult.data.find(
          (e) => e.metric_type === "blood_pressure_systolic"
        );
        const diastolicEntry = bloodPressureResult.data.find(
          (e) => e.metric_type === "blood_pressure_diastolic"
        );
        
        if (systolicEntry && diastolicEntry) {
          bloodPressure = {
            systolic: Number(systolicEntry.value),
            diastolic: Number(diastolicEntry.value),
          };
        }
      }

      // Midjemått
      const waistEntry = bloodPressureResult.data?.find(
        (e) => e.metric_type === "waist_circumference"
      );
      const waistCm = waistEntry ? Number(waistEntry.value) : undefined;

      const conditions = intakeResult.data
        ? mapConditions(
            intakeResult.data.unified_concern_category,
            intakeResult.data.primary_concern_subcategory,
            intakeResult.data.concern_tags
          )
        : [];

      const goals = intakeResult.data
        ? mapGoals(intakeResult.data.preference_tags)
        : [];

      return {
        weightKg: nutritionResult.data?.weight_kg ?? undefined,
        heightCm: nutritionResult.data?.height_cm ?? undefined,
        activityLevel: intakeResult.data?.activity_level ?? undefined,
        conditions,
        goals,
        bloodPressure,
        waistCm,
      };
    },
    enabled: !!user?.id,
  });

  const updateWeight = useMutation({
    mutationFn: async (weightKg: number) => {
      if (!user?.id) throw new Error("Ej inloggad");
      
      const { error } = await supabase
        .from("user_nutrition_settings")
        .upsert(
          { user_id: user.id, weight_kg: weightKg },
          { onConflict: "user_id" }
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-profile", user?.id] });
      toast.success("Vikt uppdaterad");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera vikt");
    },
  });

  const updateHeight = useMutation({
    mutationFn: async (heightCm: number) => {
      if (!user?.id) throw new Error("Ej inloggad");
      
      const { error } = await supabase
        .from("user_nutrition_settings")
        .upsert(
          { user_id: user.id, height_cm: heightCm },
          { onConflict: "user_id" }
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-profile", user?.id] });
      toast.success("Längd uppdaterad");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera längd");
    },
  });

  const updateBloodPressure = useMutation({
    mutationFn: async ({ systolic, diastolic }: BloodPressure) => {
      if (!user?.id) throw new Error("Ej inloggad");
      
      const today = new Date().toISOString().split("T")[0];
      
      // Upsert båda värdena
      const { error: systolicError } = await supabase
        .from("health_tracking_entries")
        .upsert(
          {
            user_id: user.id,
            metric_type: "blood_pressure_systolic",
            value: systolic,
            unit: "mmHg",
            entry_date: today,
          },
          { onConflict: "user_id,metric_type,entry_date", ignoreDuplicates: false }
        );
      
      if (systolicError) throw systolicError;

      const { error: diastolicError } = await supabase
        .from("health_tracking_entries")
        .upsert(
          {
            user_id: user.id,
            metric_type: "blood_pressure_diastolic",
            value: diastolic,
            unit: "mmHg",
            entry_date: today,
          },
          { onConflict: "user_id,metric_type,entry_date", ignoreDuplicates: false }
        );
      
      if (diastolicError) throw diastolicError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-profile", user?.id] });
      toast.success("Blodtryck uppdaterat");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera blodtryck");
    },
  });

  const updateActivityLevel = useMutation({
    mutationFn: async (level: ActivityLevel) => {
      if (!user?.id) throw new Error("Ej inloggad");
      
      const { error } = await supabase
        .from("intake_profiles")
        .update({ activity_level: level })
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-profile", user?.id] });
      toast.success("Aktivitetsnivå uppdaterad");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera aktivitetsnivå");
    },
  });

  const updateWaist = useMutation({
    mutationFn: async (waistCm: number) => {
      if (!user?.id) throw new Error("Ej inloggad");
      
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("health_tracking_entries")
        .upsert(
          {
            user_id: user.id,
            metric_type: "waist_circumference",
            value: waistCm,
            unit: "cm",
            entry_date: today,
          },
          { onConflict: "user_id,metric_type,entry_date", ignoreDuplicates: false }
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-profile", user?.id] });
      toast.success("Midjemått uppdaterat");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera midjemått");
    },
  });

  return {
    data: data ?? { conditions: [], goals: [] },
    loading: isLoading,
    updateWeight: updateWeight.mutateAsync,
    updateHeight: updateHeight.mutateAsync,
    updateBloodPressure: updateBloodPressure.mutateAsync,
    updateActivityLevel: updateActivityLevel.mutateAsync,
    updateWaist: updateWaist.mutateAsync,
    isUpdating: 
      updateWeight.isPending || 
      updateHeight.isPending || 
      updateBloodPressure.isPending || 
      updateActivityLevel.isPending ||
      updateWaist.isPending,
  };
}
