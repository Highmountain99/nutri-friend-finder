import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadMessages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: async () => {
      // Get assigned patients
      const { data: assignments } = await supabase
        .from("dietist_patient_assignments")
        .select("patient_id")
        .eq("dietist_id", user!.id);

      if (!assignments?.length) return { total: 0, byPatient: {} as Record<string, number> };

      const patientIds = assignments.map((a) => a.patient_id);

      // Get unread messages (sent by patient/ai, no read_at)
      const { data: unread } = await supabase
        .from("chat_messages")
        .select("user_id")
        .in("user_id", patientIds)
        .neq("sender", "dietitian")
        .is("read_at" as any, null);

      const byPatient: Record<string, number> = {};
      (unread ?? []).forEach((m) => {
        byPatient[m.user_id] = (byPatient[m.user_id] || 0) + 1;
      });

      return { total: unread?.length ?? 0, byPatient };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
