import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, format, startOfWeek } from "date-fns";

export interface WeeklyReportComment {
  id: string;
  patient_id: string;
  dietitian_id: string;
  week_start: string;
  comment: string;
  updated_at: string;
}

/** Måndag i den vecka rapporten gäller (yyyy-MM-dd). */
export function currentWeekStart(date = new Date()) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

/** Sammanfattningen publiceras måndagen efter veckans slut, deadline är söndagen innan. */
export function weekDeadlines(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00`);
  return {
    deadline: addDays(start, 6), // söndag
    publish: addDays(start, 7), // måndag
  };
}

/** Coachens vy: kommentaren för en klient och en specifik vecka. */
export function useCoachWeeklyComment(patientId?: string, weekStart?: string) {
  return useQuery({
    queryKey: ["weekly-report-comment", patientId, weekStart],
    enabled: !!patientId && !!weekStart,
    queryFn: async (): Promise<WeeklyReportComment | null> => {
      const { data, error } = await supabase
        .from("weekly_report_comments")
        .select("id, patient_id, dietitian_id, week_start, comment, updated_at")
        .eq("patient_id", patientId!)
        .eq("week_start", weekStart!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveWeeklyComment(patientId?: string, weekStart?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comment: string) => {
      const { error } = await supabase.from("weekly_report_comments").upsert(
        {
          patient_id: patientId!,
          dietitian_id: user!.id,
          week_start: weekStart!,
          comment,
        },
        { onConflict: "patient_id,week_start" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-report-comment", patientId, weekStart] });
    },
  });
}

/** Klientens vy: senast publicerade kommentar. */
export function usePublishedWeeklyComment() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["published-weekly-comment", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WeeklyReportComment | null> => {
      const { data, error } = await supabase
        .from("weekly_report_comments")
        .select("id, patient_id, dietitian_id, week_start, comment, updated_at")
        .eq("patient_id", user!.id)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
