import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TreatmentMilestone {
  id: string;
  goal_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface TreatmentGoal {
  id: string;
  plan_id: string;
  title: string;
  description: string | null;
  status: string;
  sort_order: number;
  planned_start: string | null;
  planned_end: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  milestones?: TreatmentMilestone[];
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  dietitian_id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  end_goal: string | null;
  end_goal_target_date: string | null;
  goals?: TreatmentGoal[];
}

export function useTreatmentPlan(patientId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const qk = ["treatment-plans", patientId];

  const plans = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data: plansData, error } = await supabase
        .from("treatment_plans")
        .select("*")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (!plansData?.length) return [] as TreatmentPlan[];

      const planIds = plansData.map((p: any) => p.id);
      const { data: goalsData } = await supabase
        .from("treatment_goals")
        .select("*")
        .in("plan_id", planIds)
        .order("sort_order", { ascending: true });

      const goalIds = (goalsData ?? []).map((g: any) => g.id);
      let milestonesData: any[] = [];
      if (goalIds.length > 0) {
        const { data } = await supabase
          .from("treatment_milestones")
          .select("*")
          .in("goal_id", goalIds)
          .order("sort_order", { ascending: true });
        milestonesData = data ?? [];
      }

      return plansData.map((plan: any) => ({
        ...plan,
        goals: (goalsData ?? [])
          .filter((g: any) => g.plan_id === plan.id)
          .map((g: any) => ({
            ...g,
            milestones: milestonesData.filter((m: any) => m.goal_id === g.id),
          })),
      })) as TreatmentPlan[];
    },
    enabled: !!patientId,
  });

  const activePlan = plans.data?.find((p) => p.status === "active");
  const archivedPlans = plans.data?.filter((p) => p.status === "archived") ?? [];

  const createPlan = useMutation({
    mutationFn: async (data: { title: string; description?: string; end_goal?: string; end_goal_target_date?: string; goals: { title: string; description?: string; planned_start?: string; planned_end?: string; milestones: string[] }[] }) => {
      const { data: plan, error } = await supabase
        .from("treatment_plans")
        .insert({
          patient_id: patientId!,
          dietitian_id: user!.id,
          title: data.title,
          description: data.description ?? null,
          end_goal: data.end_goal?.trim() || null,
          end_goal_target_date: data.end_goal_target_date || null,
        } as any)
        .select()
        .single();
      if (error) throw error;

      for (let i = 0; i < data.goals.length; i++) {
        const g = data.goals[i];
        const { data: goal, error: gErr } = await supabase
          .from("treatment_goals")
          .insert({ plan_id: (plan as any).id, title: g.title, description: g.description ?? null, sort_order: i, planned_start: g.planned_start ?? null, planned_end: g.planned_end ?? null } as any)
          .select()
          .single();
        if (gErr) throw gErr;

        if (g.milestones.length > 0) {
          const milestoneRows = g.milestones.map((m, j) => ({
            goal_id: (goal as any).id,
            title: m,
            sort_order: j,
          }));
          const { error: mErr } = await supabase.from("treatment_milestones").insert(milestoneRows as any);
          if (mErr) throw mErr;
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const updatePlan = useMutation({
    mutationFn: async (data: { planId: string; title?: string; description?: string | null; end_goal?: string | null; end_goal_target_date?: string | null }) => {
      const patch: any = {};
      if (data.title !== undefined) patch.title = data.title;
      if (data.description !== undefined) patch.description = data.description;
      if (data.end_goal !== undefined) patch.end_goal = data.end_goal;
      if (data.end_goal_target_date !== undefined) patch.end_goal_target_date = data.end_goal_target_date;
      const { error } = await supabase.from("treatment_plans").update(patch).eq("id", data.planId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const updateGoal = useMutation({
    mutationFn: async (data: { goalId: string; title?: string; description?: string | null; planned_start?: string | null; planned_end?: string | null; notes?: string | null }) => {
      const patch: any = {};
      for (const k of ["title", "description", "planned_start", "planned_end", "notes"] as const) {
        if ((data as any)[k] !== undefined) patch[k] = (data as any)[k];
      }
      const { error } = await supabase.from("treatment_goals").update(patch).eq("id", data.goalId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      await supabase.from("treatment_milestones").delete().eq("goal_id", goalId);
      const { error } = await supabase.from("treatment_goals").delete().eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const addGoal = useMutation({
    mutationFn: async (data: { planId: string; title: string; description?: string; planned_start?: string; planned_end?: string; sort_order: number }) => {
      const { error } = await supabase.from("treatment_goals").insert({
        plan_id: data.planId,
        title: data.title,
        description: data.description ?? null,
        planned_start: data.planned_start ?? null,
        planned_end: data.planned_end ?? null,
        sort_order: data.sort_order,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const addMilestone = useMutation({
    mutationFn: async (data: { goalId: string; title: string; sort_order: number }) => {
      const { error } = await supabase.from("treatment_milestones").insert({
        goal_id: data.goalId,
        title: data.title,
        sort_order: data.sort_order,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const updateMilestone = useMutation({
    mutationFn: async (data: { milestoneId: string; title: string }) => {
      const { error } = await supabase.from("treatment_milestones").update({ title: data.title } as any).eq("id", data.milestoneId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const deleteMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      const { error } = await supabase.from("treatment_milestones").delete().eq("id", milestoneId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const updateGoalStatus = useMutation({
    mutationFn: async ({ goalId, status }: { goalId: string; status: string }) => {
      const { error } = await supabase
        .from("treatment_goals")
        .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null } as any)
        .eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const toggleMilestone = useMutation({
    mutationFn: async ({ milestoneId, completed }: { milestoneId: string; completed: boolean }) => {
      const { error } = await supabase
        .from("treatment_milestones")
        .update({ is_completed: completed, completed_at: completed ? new Date().toISOString() : null } as any)
        .eq("id", milestoneId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const archivePlan = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from("treatment_plans")
        .update({ status: "archived", archived_at: new Date().toISOString() } as any)
        .eq("id", planId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  return { plans, activePlan, archivedPlans, createPlan, updateGoalStatus, toggleMilestone, archivePlan };
}
