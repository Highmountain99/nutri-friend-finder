import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PatientSummary {
  patient_id: string;
  assigned_at: string;
  intake_profile: {
    primary_concern_category: string | null;
    unified_concern_category: string | null;
    completed_at: string | null;
  } | null;
  latest_meal: {
    entry_date: string;
    meal_name: string | null;
  } | null;
  upcoming_appointment: {
    appointment_date: string;
    status: string;
  } | null;
}

export function useAssignedPatients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["assigned-patients", user?.id],
    queryFn: async () => {
      // Get assignments
      const { data: assignments, error } = await supabase
        .from("dietist_patient_assignments")
        .select("patient_id, created_at")
        .eq("dietist_id", user!.id);

      if (error) throw error;
      if (!assignments?.length) return [];

      const patientIds = assignments.map((a) => a.patient_id);

      // Fetch intake profiles for all patients
      const { data: intakes } = await supabase
        .from("intake_profiles")
        .select("user_id, primary_concern_category, unified_concern_category, completed_at")
        .in("user_id", patientIds);

      // Fetch latest nutrition entry per patient
      const { data: meals } = await supabase
        .from("nutrition_entries")
        .select("user_id, entry_date, meal_name")
        .in("user_id", patientIds)
        .order("entry_date", { ascending: false })
        .limit(1);

      // Fetch upcoming appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("user_id, appointment_date, status")
        .in("user_id", patientIds)
        .gte("appointment_date", new Date().toISOString())
        .eq("status", "booked")
        .order("appointment_date", { ascending: true });

      return assignments.map((a) => ({
        patient_id: a.patient_id,
        assigned_at: a.created_at,
        intake_profile: intakes?.find((i) => i.user_id === a.patient_id) ?? null,
        latest_meal: meals?.find((m) => m.user_id === a.patient_id) ?? null,
        upcoming_appointment: appointments?.find((ap) => ap.user_id === a.patient_id) ?? null,
      })) as PatientSummary[];
    },
    enabled: !!user,
  });
}
