import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMyDietitian() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-dietitian", user?.id],
    queryFn: async () => {
      // Find the assignment
      const { data: assignment, error } = await supabase
        .from("dietist_patient_assignments")
        .select("dietist_id")
        .eq("patient_id", user!.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!assignment) return null;

      // Get dietitian profile by user_id
      const { data: profile, error: profErr } = await supabase
        .from("dietitian_profiles")
        .select("id, user_id, first_name, last_name, title, bio, avatar_url, specializations, languages, is_available, created_at, updated_at")
        .eq("user_id", assignment.dietist_id)
        .single();

      if (profErr) throw profErr;
      return profile;
    },
    enabled: !!user,
  });
}
