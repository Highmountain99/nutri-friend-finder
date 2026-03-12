import { Check, Circle, ChevronDown, Target, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePatientTreatmentPlan, PatientGoal } from "@/hooks/usePatientTreatmentPlan";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";

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
                  <div key={m.id} className="flex items-center gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        m.is_completed
                          ? "bg-primary text-primary-foreground"
                          : "border-2 border-muted-foreground/25"
                      }`}
                    >
                      {m.is_completed && <Check className="w-3 h-3" />}
                    </div>
                    <span
                      className={`text-sm ${
                        m.is_completed
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {m.title}
                    </span>
                  </div>
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

      {/* Overall progress */}
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

      {/* Goal cards */}
      <div className="space-y-2">
        {plan.goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </section>
  );
}
