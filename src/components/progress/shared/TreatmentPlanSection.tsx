import { Check, Target, ChevronDown, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePatientTreatmentPlan, PatientGoal } from "@/hooks/usePatientTreatmentPlan";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: "Ej påbörjat", color: "text-muted-foreground", bg: "bg-muted" },
  in_progress: { label: "Pågår", color: "text-primary", bg: "bg-primary" },
  completed: { label: "Klart", color: "text-primary", bg: "bg-primary" },
};

function GoalCard({ goal }: { goal: PatientGoal }) {
  const [open, setOpen] = useState(goal.status === "in_progress");
  const config = STATUS_CONFIG[goal.status] || STATUS_CONFIG.not_started;
  const completedMilestones = goal.milestones.filter((m) => m.is_completed).length;
  const totalMilestones = goal.milestones.length;
  const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  const queryClient = useQueryClient();

  const toggleMilestone = useMutation({
    mutationFn: async ({ milestoneId, completed }: { milestoneId: string; completed: boolean }) => {
      const { error } = await supabase
        .from("treatment_milestones")
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", milestoneId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-treatment-plan"] });
    },
    onError: () => {
      toast.error("Kunde inte uppdatera delmålet");
    },
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-muted/20 transition-colors">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  goal.status === "completed"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : goal.status === "in_progress"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                {goal.status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground text-sm truncate">{goal.title}</h3>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge
                    variant={goal.status === "completed" ? "default" : "secondary"}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {config.label}
                  </Badge>
                  {totalMilestones > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {completedMilestones}/{totalMilestones} delmål
                    </span>
                  )}
                </div>
                {totalMilestones > 0 && (
                  <Progress value={milestoneProgress} className="h-1.5 mt-2.5 rounded-full" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
            {goal.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{goal.description}</p>
            )}
            {(goal.planned_start || goal.planned_end) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {goal.planned_start &&
                    format(new Date(goal.planned_start), "d MMM", { locale: sv })}
                  {goal.planned_start && goal.planned_end && " – "}
                  {goal.planned_end &&
                    format(new Date(goal.planned_end), "d MMM yyyy", { locale: sv })}
                </span>
              </div>
            )}
            {goal.milestones.length > 0 && (
              <div className="space-y-2.5">
                {goal.milestones.map((m) => (
                  <label key={m.id} className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={m.is_completed}
                      onCheckedChange={(checked) =>
                        toggleMilestone.mutate({ milestoneId: m.id, completed: !!checked })
                      }
                      className="rounded-full"
                    />
                    <span
                      className={`text-sm ${
                        m.is_completed
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {m.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function TreatmentPlanSection() {
  const { data: plan, isLoading } = usePatientTreatmentPlan();

  if (isLoading || !plan) return null;

  const completedGoals = plan.goals.filter((g) => g.status === "completed").length;
  const totalGoals = plan.goals.length;
  const overallProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          🎯 Behandlingsplan
        </h2>
        <span className="text-xs text-muted-foreground font-medium">
          {completedGoals}/{totalGoals} mål klara
        </span>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-foreground">{plan.title}</span>
            <span className="text-sm font-bold text-primary">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2.5 rounded-full" />
          {plan.description && (
            <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">{plan.description}</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {plan.goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </section>
  );
}
