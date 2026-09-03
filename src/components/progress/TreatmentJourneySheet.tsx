import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePatientTreatmentPlan, PatientGoal } from "@/hooks/usePatientTreatmentPlan";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { X, Check } from "lucide-react";

/* ---------- Tokens ---------- */
const T = {
  beige: "#C2AE84",
  cream: "#F5EFE2",
  green: "#1F3A2E",
  ink: "#1F2A22",
  mut: "rgba(31,42,34,0.6)",
  sage: "#B7C4A9",
  gold: "#DCC08A",
  wait: "#E3DDCB",
  terra: "#C97B5C",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Status = "done" | "active" | "wait" | "goal";

interface Item {
  id: string;
  title: string;
  meta: string | null;
  body: string | null;
  status: Status;
  milestones: { id: string; title: string; is_completed: boolean }[];
}

function fmt(d?: string | null) {
  if (!d) return null;
  try {
    return format(parseISO(d), "d MMMM", { locale: sv });
  } catch {
    return null;
  }
}

function statusPill(status: Status) {
  switch (status) {
    case "done":
      return { label: "Klart", bg: T.sage, color: T.green };
    case "active":
      return { label: "Pågår", bg: T.gold, color: T.green };
    case "goal":
      return { label: "Slutmål", bg: T.terra, color: T.cream };
    default:
      return { label: "Väntar", bg: T.wait, color: "rgba(31,42,34,0.55)" };
  }
}

export function TreatmentJourneySheet({ open, onOpenChange }: Props) {
  const { data: plan, isLoading } = usePatientTreatmentPlan();
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (open) setExpanded(null);
  }, [open]);

  const items: Item[] = useMemo(() => {
    const goals: PatientGoal[] = plan?.goals ?? [];
    const firstNonDone = goals.findIndex((g) => g.status !== "completed");
    const list: Item[] = goals.map((g, i) => {
      const status: Status =
        g.status === "completed" ? "done" : i === firstNonDone ? "active" : "wait";
      const start = fmt(g.planned_start);
      const end = fmt(g.planned_end);
      const meta =
        status === "done" && g.completed_at
          ? `Avslutad ${fmt(g.completed_at)}`
          : start && end
          ? `${start} – ${end}`
          : start
          ? `Startar ${start}`
          : null;
      return {
        id: g.id,
        title: g.title,
        meta,
        body: g.description,
        status,
        milestones: g.milestones ?? [],
      };
    });
    if (plan?.end_goal) {
      list.push({
        id: "end-goal",
        title: plan.end_goal,
        meta: fmt(plan.end_goal_target_date),
        body: null,
        status: "goal",
        milestones: [],
      });
    }
    return list;
  }, [plan]);

  const subtitle = [
    plan?.title,
    plan?.created_at ? `startade ${fmt(plan.created_at)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[94dvh] rounded-t-[28px] border-none p-0 overflow-hidden [&>button.absolute]:hidden"
        style={{ backgroundColor: T.beige, color: T.ink }}
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <span
            className="block rounded-full"
            style={{ width: 42, height: 5, backgroundColor: "rgba(31,42,34,0.22)" }}
          />
        </div>

        <div
          className="overflow-y-auto"
          style={{ height: "calc(94dvh - 22px)", padding: "18px 20px 60px" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1
                className="font-serif m-0"
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  lineHeight: 0.95,
                  textTransform: "uppercase",
                  color: T.green,
                }}
              >
                Din{" "}
                <span
                  style={{
                    backgroundColor: T.cream,
                    borderRadius: 999,
                    padding: "0 14px 3px",
                    display: "inline-block",
                  }}
                >
                  resa
                </span>
              </h1>
              {subtitle && (
                <p style={{ marginTop: 8, fontSize: 13, color: "rgba(31,42,34,0.7)" }}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Stäng"
              className="rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
              style={{ width: 44, height: 44, backgroundColor: "rgba(31,42,34,0.12)" }}
            >
              <X className="w-5 h-5" style={{ color: T.green }} />
            </button>
          </div>

          {/* Timeline */}
          <div style={{ marginTop: 24 }}>
            {isLoading ? (
              <p style={{ fontSize: 13, color: T.mut }}>Laddar…</p>
            ) : items.length === 0 ? (
              <p style={{ fontSize: 13, color: T.mut }}>
                Din coach har inte lagt upp din plan ännu.
              </p>
            ) : (
              items.map((item, i) => {
                const pill = statusPill(item.status);
                const isLast = i === items.length - 1;
                const filled = item.status === "done" || item.status === "active";
                const isOpen = expanded === item.id;
                return (
                  <div key={item.id} className="flex" style={{ gap: 12 }}>
                    {/* Rail */}
                    <div className="flex flex-col items-center" style={{ width: 44 }}>
                      <span
                        className="rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor:
                            item.status === "done"
                              ? T.green
                              : item.status === "active"
                              ? "transparent"
                              : "rgba(31,42,34,0.12)",
                          border: item.status === "active" ? `3px solid ${T.green}` : "none",
                          color:
                            item.status === "done"
                              ? T.cream
                              : filled
                              ? T.green
                              : "rgba(31,42,34,0.5)",
                          fontWeight: 700,
                          fontSize: 16,
                        }}
                      >
                        {item.status === "done" ? <Check className="w-5 h-5" /> : i + 1}
                      </span>
                      {!isLast && (
                        <span
                          style={{
                            flex: 1,
                            width: 3,
                            minHeight: 24,
                            borderRadius: 999,
                            backgroundColor: filled ? T.green : "rgba(31,42,34,0.22)",
                          }}
                        />
                      )}
                    </div>

                    {/* Card */}
                    <button
                      onClick={() =>
                        setExpanded(isOpen ? null : item.id)
                      }
                      className="text-left w-full active:scale-[0.995] transition-transform"
                      style={{
                        backgroundColor: T.cream,
                        borderRadius: 20,
                        padding: "14px 16px",
                        marginBottom: isLast ? 0 : 14,
                      }}
                    >
                      <div className="flex items-start justify-between" style={{ gap: 10 }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            lineHeight: 1.25,
                            color: T.ink,
                          }}
                        >
                          {item.title}
                        </span>
                        <span
                          className="flex-shrink-0"
                          style={{
                            backgroundColor: pill.bg,
                            color: pill.color,
                            borderRadius: 999,
                            padding: "5px 12px",
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        >
                          {pill.label}
                        </span>
                      </div>
                      {item.meta && (
                        <div style={{ marginTop: 4, fontSize: 12.5, color: T.mut }}>
                          {item.meta}
                        </div>
                      )}
                      {(isOpen || item.status === "active") && item.body && (
                        <p
                          style={{
                            marginTop: 12,
                            fontSize: 14,
                            lineHeight: 1.45,
                            color: T.ink,
                          }}
                        >
                          {item.body}
                        </p>
                      )}
                      {isOpen && item.milestones.length > 0 && (
                        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                          {item.milestones.map((m) => (
                            <div key={m.id} className="flex items-center" style={{ gap: 8 }}>
                              <span
                                className="rounded-full flex items-center justify-center flex-shrink-0"
                                style={{
                                  width: 18,
                                  height: 18,
                                  backgroundColor: m.is_completed
                                    ? T.green
                                    : "rgba(31,42,34,0.12)",
                                }}
                              >
                                {m.is_completed && (
                                  <Check className="w-3 h-3" style={{ color: T.cream }} />
                                )}
                              </span>
                              <span
                                style={{
                                  fontSize: 13,
                                  color: m.is_completed ? T.mut : T.ink,
                                  textDecoration: m.is_completed ? "line-through" : "none",
                                }}
                              >
                                {m.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
