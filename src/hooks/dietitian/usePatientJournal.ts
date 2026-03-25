import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePatientJournal(patientId: string | undefined) {
  const meals = useQuery({
    queryKey: ["patient-meals", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nutrition_entries")
        .select("*")
        .eq("user_id", patientId!)
        .order("entry_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const symptoms = useQuery({
    queryKey: ["patient-symptoms", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("symptom_entries")
        .select("*")
        .eq("user_id", patientId!)
        .order("entry_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const healthTracking = useQuery({
    queryKey: ["patient-health-tracking", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_tracking_entries")
        .select("*")
        .eq("user_id", patientId!)
        .order("entry_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const goals = useQuery({
    queryKey: ["patient-goals", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_nutrition_goals")
        .select("*")
        .eq("user_id", patientId!)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const intakeProfile = useQuery({
    queryKey: ["patient-intake", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intake_profiles")
        .select("*")
        .eq("user_id", patientId!)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const nutritionSettings = useQuery({
    queryKey: ["patient-nutrition-settings", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_nutrition_settings")
        .select("weight_kg, height_cm")
        .eq("user_id", patientId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  return {
    meals,
    symptoms,
    healthTracking,
    goals,
    intakeProfile,
    nutritionSettings,
    isLoading: meals.isLoading || symptoms.isLoading || healthTracking.isLoading,
  };
}
