import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePatientTreatmentPlan } from "@/hooks/usePatientTreatmentPlan";
import { Lock } from "lucide-react";
import { differenceInWeeks, parseISO } from "date-fns";

interface TreatmentJourneySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GOAL_EMOJIS = ["🎯", "🥕", "🌟", "🧠", "🔑", "💪", "🌱", "❤️"];

function getWeekRange(
  planCreatedAt: string,
  plannedStart: string | null,
  plannedEnd: string | null,
  index: number
) {
  const planStart = parseISO(planCreatedAt);
  const start = plannedStart
    ? differenceInWeeks(parseISO(plannedStart), planStart) + 1
    : index * 3 + 1;
  const end = plannedEnd
    ? differenceInWeeks(parseISO(plannedEnd), planStart) + 1
    : start + 2;
  return { start: Math.max(1, start), end: Math.max(start, end) };
}

export function TreatmentJourneySheet({ open, onOpenChange }: TreatmentJourneySheetProps) {
  const { data: plan, isLoading } = usePatientTreatmentPlan();

  const goals = plan?.goals ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl bg-[hsl(var(--background))] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-center text-lg font-bold text-foreground">
            Programöversikt
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Laddar…
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm text-center px-6">
            <p>Din dietist har inte skapat en behandlingsplan ännu.</p>
            <p className="mt-1">Kom tillbaka snart!</p>
          </div>
        ) : (
          <div className="relative py-8 px-4">
            {/* SVG dashed path connecting nodes */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              {goals.map((_, i) => {
                if (i === goals.length - 1) return null;
                const isEven = i % 2 === 0;
                const nextIsEven = (i + 1) % 2 === 0;
                const yStart = 80 + i * 160;
                const yEnd = 80 + (i + 1) * 160;
                const xStart = isEven ? "70%" : "30%";
                const xEnd = nextIsEven ? "70%" : "30%";
                return (
                  <path
                    key={i}
                    d={`M ${xStart} ${yStart} C ${xStart} ${yStart + 80}, ${xEnd} ${yEnd - 80}, ${xEnd} ${yEnd}`}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    strokeDasharray="8 6"
                  />
                );
              })}
            </svg>

            {/* Goal nodes */}
            <div className="relative flex flex-col gap-16">
              {goals.map((goal, i) => {
                const isEven = i % 2 === 0;
                const weeks = plan
                  ? getWeekRange(plan.created_at, goal.planned_start, goal.planned_end, i)
                  : { start: i * 3 + 1, end: i * 3 + 3 };
                const isCompleted = goal.status === "completed";
                const isLocked = !isCompleted && i > 0 && goals[i - 1].status !== "completed";
                const emoji = GOAL_EMOJIS[i % GOAL_EMOJIS.length];

                return (
                  <div
                    key={goal.id}
                    className={`flex items-center gap-4 ${isEven ? "flex-row-reverse self-end" : "self-start"}`}
                    style={{ maxWidth: "75%" }}
                  >
                    {/* Icon circle */}
                    <div
                      className={`relative flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center border-2 text-3xl
                        ${isCompleted
                          ? "bg-primary/10 border-primary"
                          : isLocked
                            ? "bg-muted border-border opacity-60"
                            : "bg-card border-border shadow-sm"
                        }`}
                    >
                      {isLocked ? (
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      ) : (
                        <span>{emoji}</span>
                      )}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground text-xs">✓</span>
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className={isEven ? "text-right" : "text-left"}>
                      <p className={`font-semibold leading-tight ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                        {goal.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Vecka {weeks.start}{weeks.end > weeks.start ? ` - ${weeks.end}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
