import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PatientMilestone {
  id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface PatientGoal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  sort_order: number;
  planned_start: string | null;
  planned_end: string | null;
  completed_at: string | null;
  milestones: PatientMilestone[];
}

export interface PatientTreatmentPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  end_goal: string | null;
  end_goal_target_date: string | null;
  goals: PatientGoal[];
}

export function usePatientTreatmentPlan() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-treatment-plan", user?.id],
    queryFn: async () => {
      // Fetch the active plan for this patient
      const { data: plan, error } = await supabase
        .from("treatment_plans")
        .select("*")
        .eq("patient_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!plan) return null;

      // Fetch goals
      const { data: goals, error: goalsErr } = await supabase
        .from("treatment_goals")
        .select("*")
        .eq("plan_id", (plan as any).id)
        .order("sort_order", { ascending: true });

      if (goalsErr) throw goalsErr;

      // Fetch milestones
      const goalIds = (goals ?? []).map((g: any) => g.id);
      let milestones: any[] = [];
      if (goalIds.length > 0) {
        const { data } = await supabase
          .from("treatment_milestones")
          .select("*")
          .in("goal_id", goalIds)
          .order("sort_order", { ascending: true });
        milestones = data ?? [];
      }

      return {
        ...(plan as any),
        goals: (goals ?? []).map((g: any) => ({
          ...g,
          milestones: milestones.filter((m: any) => m.goal_id === g.id),
        })),
      } as PatientTreatmentPlan;
    },
    enabled: !!user,
  });
}
