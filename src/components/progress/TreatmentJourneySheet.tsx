import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePatientTreatmentPlan } from "@/hooks/usePatientTreatmentPlan";
import { Lock, Flag, CheckCircle2 } from "lucide-react";
import { differenceInWeeks, differenceInDays, parseISO } from "date-fns";

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

function getStatusLabel(
  goal: { status: string; planned_start: string | null; completed_at: string | null },
  isActive: boolean,
  isLocked: boolean
) {
  if (goal.status === "completed") return "Avklarat";
  if (isLocked) return "Låst";
  if (isActive) {
    if (goal.planned_start) {
      const days = differenceInDays(new Date(), parseISO(goal.planned_start));
      if (days >= 0) return `Pågår · dag ${days + 1}`;
    }
    return "Pågår";
  }
  return "";
}

export function TreatmentJourneySheet({ open, onOpenChange }: TreatmentJourneySheetProps) {
  const { data: plan, isLoading } = usePatientTreatmentPlan();
  const goals = plan?.goals ?? [];

  const stepHeight = 160;
  const nodeRadius = 32;
  const svgWidth = 320;
  const centerX = svgWidth / 2;
  const amplitude = 50;
  const startY = 48;

  const getNodePos = (i: number) => {
    const isEven = i % 2 === 0;
    return {
      x: centerX + (isEven ? amplitude : -amplitude),
      y: startY + i * stepHeight,
    };
  };

  const finishY = startY + goals.length * stepHeight;
  const totalHeight = finishY + 80;

  // Build the full path string
  const buildPath = (count: number, includeFinish = false) => {
    if (count < 1) return "";
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) pts.push(getNodePos(i));
    if (includeFinish) pts.push({ x: centerX, y: finishY });

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const c = pts[i], n = pts[i + 1];
      const my = (c.y + n.y) / 2;
      d += ` C ${c.x} ${my}, ${n.x} ${my}, ${n.x} ${n.y}`;
    }
    return d;
  };

  const completedCount = goals.filter(g => g.status === "completed").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl bg-[hsl(var(--background))] overflow-y-auto">
        <SheetHeader className="pb-1">
          <SheetTitle className="text-center text-lg font-bold text-foreground tracking-tight">
            Din resa
          </SheetTitle>
          {goals.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {completedCount} av {goals.length} steg avklarade
            </p>
          )}
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
          <div className="flex justify-center pt-6 pb-12">
            <div className="relative" style={{ width: svgWidth, height: totalHeight }}>
              {/* SVG path layer */}
              <svg
                width={svgWidth}
                height={totalHeight}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Wide soft trail */}
                <path
                  d={buildPath(goals.length, true)}
                  fill="none"
                  stroke="hsl(var(--primary) / 0.06)"
                  strokeWidth="28"
                  strokeLinecap="round"
                />
                {/* Upcoming path – dashed muted */}
                <path
                  d={buildPath(goals.length, true)}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="2.5"
                  strokeDasharray="5 7"
                  strokeLinecap="round"
                />
                {/* Completed path – solid primary */}
                {completedCount > 0 && (
                  <path
                    d={buildPath(Math.min(completedCount + 1, goals.length), false)}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* Goal nodes */}
              {goals.map((goal, i) => {
                const isEven = i % 2 === 0;
                const pos = getNodePos(i);
                const weeks = plan
                  ? getWeekRange(plan.created_at, goal.planned_start, goal.planned_end, i)
                  : { start: i * 3 + 1, end: i * 3 + 3 };
                const isCompleted = goal.status === "completed";
                const isActive = !isCompleted && (i === 0 || goals[i - 1].status === "completed");
                const isLocked = !isCompleted && !isActive;
                const emoji = GOAL_EMOJIS[i % GOAL_EMOJIS.length];
                const statusLabel = getStatusLabel(goal, isActive, isLocked);

                // Text goes on opposite side of the curve
                const textSide = isEven ? "left" : "right";

                return (
                  <div key={goal.id}>
                    {/* Node circle – centered on path */}
                    <div
                      className="absolute"
                      style={{
                        left: pos.x - nodeRadius,
                        top: pos.y - nodeRadius,
                        width: nodeRadius * 2,
                        height: nodeRadius * 2,
                      }}
                    >
                      <div
                        className={`w-full h-full rounded-full flex items-center justify-center text-xl transition-all
                          ${isCompleted
                            ? "bg-primary/15 border-[2.5px] border-primary"
                            : isActive
                              ? "bg-card border-[2.5px] border-primary shadow-lg"
                              : "bg-muted/50 border-2 border-border/40"
                          }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        ) : isLocked ? (
                          <Lock className="w-4.5 h-4.5 text-muted-foreground/40" />
                        ) : (
                          <span>{emoji}</span>
                        )}
                      </div>
                      {isActive && (
                        <div className="absolute -inset-1.5 rounded-full border-2 border-primary/25 animate-[pulse_2.5s_ease-in-out_infinite]" />
                      )}
                    </div>

                    {/* Text label */}
                    <div
                      className="absolute"
                      style={{
                        top: pos.y - 30,
                        ...(textSide === "left"
                          ? { right: svgWidth - pos.x + nodeRadius + 12, textAlign: "right" as const }
                          : { left: pos.x + nodeRadius + 12, textAlign: "left" as const }),
                        width: 130,
                      }}
                    >
                      <p
                        className={`text-[13px] font-semibold leading-snug ${
                          isCompleted
                            ? "text-primary"
                            : isActive
                              ? "text-foreground"
                              : "text-muted-foreground/50"
                        }`}
                      >
                        {goal.title}
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          isLocked ? "text-muted-foreground/30" : "text-muted-foreground"
                        }`}
                      >
                        Vecka {weeks.start}{weeks.end > weeks.start ? `–${weeks.end}` : ""}
                      </p>
                      {statusLabel && (
                        <span
                          className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? "bg-primary/10 text-primary"
                              : isActive
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted text-muted-foreground/50"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Finish flag */}
              <div
                className="absolute flex flex-col items-center"
                style={{
                  left: centerX - 28,
                  top: finishY - 28,
                  width: 56,
                }}
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[11px] font-semibold text-primary mt-1.5">Mål</span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
