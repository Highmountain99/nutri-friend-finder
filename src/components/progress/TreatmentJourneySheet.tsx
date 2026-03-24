import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePatientTreatmentPlan } from "@/hooks/usePatientTreatmentPlan";
import { Lock, Flag } from "lucide-react";
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

// Generates a winding S-curve path through goal nodes
function generatePath(goalCount: number): string {
  if (goalCount < 2) return "";
  
  const nodeSpacing = 140;
  const centerX = 195; // ~center of 390px viewport
  const amplitude = 70;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < goalCount; i++) {
    const isEven = i % 2 === 0;
    const x = centerX + (isEven ? amplitude : -amplitude);
    const y = 48 + i * nodeSpacing;
    points.push({ x, y });
  }

  // Add finish point
  points.push({ x: centerX, y: 48 + goalCount * nodeSpacing });

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midY = (curr.y + next.y) / 2;
    d += ` C ${curr.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y}`;
  }
  return d;
}

export function TreatmentJourneySheet({ open, onOpenChange }: TreatmentJourneySheetProps) {
  const { data: plan, isLoading } = usePatientTreatmentPlan();

  const goals = plan?.goals ?? [];
  const nodeSpacing = 140;
  const centerX = 195;
  const amplitude = 70;
  const totalHeight = 48 + goals.length * nodeSpacing + 60;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl bg-[hsl(var(--background))] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-center text-lg font-bold text-foreground">
            Din resa
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
          <div className="relative px-2 pt-6 pb-12">
            <svg
              width="100%"
              height={totalHeight}
              viewBox={`0 0 390 ${totalHeight}`}
              className="absolute inset-0 pointer-events-none"
              preserveAspectRatio="xMidYMin meet"
            >
              {/* Background trail (wider, faded) */}
              <path
                d={generatePath(goals.length)}
                fill="none"
                stroke="hsl(var(--primary) / 0.08)"
                strokeWidth="24"
                strokeLinecap="round"
              />
              {/* Dotted path */}
              <path
                d={generatePath(goals.length)}
                fill="none"
                stroke="hsl(var(--primary) / 0.25)"
                strokeWidth="3"
                strokeDasharray="6 8"
                strokeLinecap="round"
              />
              {/* Completed portion - solid */}
              {(() => {
                const completedCount = goals.filter(g => g.status === "completed").length;
                if (completedCount === 0) return null;
                const points: { x: number; y: number }[] = [];
                for (let i = 0; i <= completedCount && i < goals.length; i++) {
                  const isEven = i % 2 === 0;
                  const x = centerX + (isEven ? amplitude : -amplitude);
                  const y = 48 + i * nodeSpacing;
                  points.push({ x, y });
                }
                let d = `M ${points[0].x} ${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                  const curr = points[i];
                  const next = points[i + 1];
                  const midY = (curr.y + next.y) / 2;
                  d += ` C ${curr.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y}`;
                }
                return (
                  <path
                    d={d}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })()}

              {/* Small decorative dots along the path */}
              {goals.map((_, i) => {
                if (i === goals.length - 1) return null;
                const isEven = i % 2 === 0;
                const currX = centerX + (isEven ? amplitude : -amplitude);
                const currY = 48 + i * nodeSpacing;
                const nextIsEven = (i + 1) % 2 === 0;
                const nextX = centerX + (nextIsEven ? amplitude : -nextIsEven);
                const midX = (currX + (centerX + ((i + 1) % 2 === 0 ? amplitude : -amplitude))) / 2;
                const midY = (currY + 48 + (i + 1) * nodeSpacing) / 2;
                return (
                  <circle
                    key={`dot-${i}`}
                    cx={midX}
                    cy={midY}
                    r="2.5"
                    fill="hsl(var(--primary) / 0.15)"
                  />
                );
              })}
            </svg>

            {/* Goal nodes */}
            <div className="relative" style={{ height: totalHeight }}>
              {goals.map((goal, i) => {
                const isEven = i % 2 === 0;
                const weeks = plan
                  ? getWeekRange(plan.created_at, goal.planned_start, goal.planned_end, i)
                  : { start: i * 3 + 1, end: i * 3 + 3 };
                const isCompleted = goal.status === "completed";
                const isActive = !isCompleted && (i === 0 || goals[i - 1].status === "completed");
                const isLocked = !isCompleted && !isActive;
                const emoji = GOAL_EMOJIS[i % GOAL_EMOJIS.length];

                const nodeX = centerX + (isEven ? amplitude : -amplitude);
                const nodeY = 48 + i * nodeSpacing;

                return (
                  <div
                    key={goal.id}
                    className="absolute flex items-center gap-3"
                    style={{
                      left: nodeX,
                      top: nodeY,
                      transform: "translate(-50%, -50%)",
                      flexDirection: isEven ? "row" : "row-reverse",
                      width: "260px",
                      marginLeft: isEven ? "0" : "0",
                    }}
                  >
                    {/* Circle node */}
                    <div
                      className={`relative flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300
                        ${isCompleted
                          ? "bg-primary/15 border-2 border-primary shadow-[0_0_16px_hsl(var(--primary)/0.2)]"
                          : isActive
                            ? "bg-card border-2 border-primary/40 shadow-md"
                            : "bg-muted/60 border-2 border-border/50"
                        }`}
                    >
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground/60" />
                      ) : (
                        <span className={isActive ? "animate-[scale-in_0.3s_ease-out]" : ""}>{emoji}</span>
                      )}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                          <span className="text-primary-foreground text-[10px] font-bold">✓</span>
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute -inset-1 rounded-full border-2 border-primary/20 animate-[pulse_2s_ease-in-out_infinite]" />
                      )}
                    </div>

                    {/* Label */}
                    <div className={`flex-1 min-w-0 ${isEven ? "text-left" : "text-right"}`}>
                      <p className={`text-sm font-semibold leading-tight ${
                        isCompleted ? "text-primary" : isLocked ? "text-muted-foreground/60" : "text-foreground"
                      }`}>
                        {goal.title}
                      </p>
                      <p className={`text-xs mt-0.5 ${
                        isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
                      }`}>
                        Vecka {weeks.start}{weeks.end > weeks.start ? `–${weeks.end}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Finish flag */}
              <div
                className="absolute flex flex-col items-center gap-1"
                style={{
                  left: centerX,
                  top: 48 + goals.length * nodeSpacing,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <Flag className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary mt-1">Mål</span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
