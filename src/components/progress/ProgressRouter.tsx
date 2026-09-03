import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Route, Sparkles, ArrowRight, Check, ChevronDown } from "lucide-react";
import { JourneyPanel } from "./JourneyPanel";
import { useAuth } from "@/contexts/AuthContext";

import { usePatientBlocks } from "@/hooks/usePatientBlocks";
import { DynamicBlock } from "./shared/DynamicBlock";

import { usePatientTreatmentPlan } from "@/hooks/usePatientTreatmentPlan";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressRouterProps {
  onOpenJourney: () => void;
}

/* ---------- Layered & Tactile subcomponents (scoped to Utveckling) ---------- */


function HeaderB() {
  return (
    <div className="pt-1">
      <div>
        <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted-foreground">
          Din utveckling
        </div>
        <h1 className="font-serif text-[30px] leading-none tracking-tight text-primary mt-1.5">
          Följ dina framsteg
        </h1>
      </div>
    </div>
  );
}

function Arc({
  value,
  total,
  size = 88,
  sw = 7,
  children,
}: {
  value: number;
  total: number;
  size?: number;
  sw?: number;
  children?: React.ReactNode;
}) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary-foreground) / 0.18)"
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

type Goal = { id: string; title: string; status: string };

function JourneyHeader({
  goals,
  activeIdx,
  open,
  onToggle,
  children,
}: {
  goals: Goal[];
  activeIdx: number;
  open: boolean;
  onToggle: (next: boolean) => void;
  children?: React.ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const steps = goals.slice(0, 3);

  return (
    <div
      style={{
        backgroundColor: "#C2AE84",
        color: "#1F3A2E",
        borderRadius: "0 0 28px 28px",
        overflow: "hidden",
      }}
    >
    <div
      data-tour="progress-hero"
      role="button"
      tabIndex={0}
      onClick={() => onToggle(!open)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle(!open);
      }}
      onPointerDown={(e) => {
        startY.current = e.clientY;
      }}
      onPointerMove={(e) => {
        if (startY.current === null) return;
        const dy = e.clientY - startY.current;
        if (dy > 28) {
          startY.current = null;
          onToggle(true);
        } else if (dy < -28) {
          startY.current = null;
          onToggle(false);
        }
      }}
      onPointerUp={() => {
        startY.current = null;
      }}
      className="w-full text-left touch-pan-y cursor-pointer select-none"
      style={{
        padding: "64px 20px 20px",
      }}
    >

      <h1
        className="font-serif m-0"
        style={{ fontSize: 34, fontWeight: 800, lineHeight: 0.92, textTransform: "uppercase" }}
      >
        Din{" "}
        <span
          style={{
            backgroundColor: "#DCC08A",
            borderRadius: 999,
            padding: "0 12px 2px",
            display: "inline-block",
          }}
        >
          resa
        </span>
      </h1>

      <div className="flex items-start" style={{ marginTop: 20 }}>
        {steps.map((g, i) => {
          const done = g.status === "completed";
          const active = i === activeIdx && !done;
          return (
            <div key={g.id} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center min-w-0 px-0.5" style={{ gap: 6, flex: 1 }}>
                <span
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor: done
                      ? "#1F3A2E"
                      : active
                      ? "#F5EFE2"
                      : "rgba(255,255,255,0.5)",
                    border: active ? "3px solid #1F3A2E" : "none",
                    color: done ? "#F5EFE2" : active ? "#1F3A2E" : "rgba(0,0,0,0.5)",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <span
                  className="text-center line-clamp-2"
                  style={{
                    fontSize: 11,
                    lineHeight: 1.15,
                    fontWeight: done ? 600 : active ? 700 : 500,
                    color: done || active ? "#1F3A2E" : "rgba(0,0,0,0.5)",
                  }}
                >
                  {g.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className="flex-1 rounded-full min-w-[10px]"
                  style={{
                    height: 3,
                    marginBottom: 22,
                    marginTop: 16,
                    backgroundColor: done ? "#1F3A2E" : "rgba(0,0,0,0.25)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center" style={{ marginTop: 14 }}>
        <ChevronDown
          className="w-5 h-5 transition-transform"
          style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "none" }}
        />
      </div>
    </div>

      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 320ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>{children}</div>
      </div>
    </div>
  );
}


function CurrentGoalCard({
  goal,
  activeIdx,
  total,
}: {
  goal: Goal;
  activeIdx: number;
  total: number;
}) {
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: "#DCC08A", borderRadius: 24, padding: 20, color: "#1F3A2E" }}>
      <span
        className="inline-block uppercase"
        style={{
          backgroundColor: "#F5EFE2",
          borderRadius: 999,
          padding: "5px 12px",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.04em",
        }}
      >
        Pågående mål
      </span>
      <h2
        className="font-serif m-0"
        style={{
          marginTop: 12,
          fontSize: 28,
          fontWeight: 800,
          lineHeight: 0.95,
          textTransform: "uppercase",
        }}
      >
        {goal.title}
      </h2>
      <div className="flex" style={{ marginTop: 12, gap: 6 }}>
        {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 10,
              borderRadius: 999,
              backgroundColor: i <= activeIdx ? "#1F3A2E" : "rgba(0,0,0,0.2)",
            }}
          />
        ))}
      </div>
      <button
        onClick={() => navigate("/journal")}
        style={{
          marginTop: 16,
          backgroundColor: "#1F3A2E",
          color: "#F5EFE2",
          borderRadius: 999,
          padding: "13px 20px",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        Logga dagens måltid
      </button>
    </div>
  );
}




function FocusB({ quote, author }: { quote: string; author: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] p-[18px] border shadow-[0_6px_26px_-12px_hsl(145_30%_11%/0.30)]"
      style={{
        backgroundColor: "hsl(var(--nutrient-cal) / 0.08)",
        borderColor: "hsl(var(--nutrient-cal) / 0.18)",
      }}
    >
      <div
        className="absolute -right-8 -bottom-8 w-[110px] h-[110px] rounded-full"
        style={{ backgroundColor: "hsl(var(--nutrient-cal) / 0.08)" }}
        aria-hidden
      />
      <div className="relative">
        <div
          className="font-mono text-[9.5px] tracking-[0.16em] uppercase mb-2.5"
          style={{ color: "hsl(var(--nutrient-cal))" }}
        >
          Dagens fokus
        </div>
        <p className="font-serif italic text-[22px] leading-[1.25] text-primary m-0">{quote}</p>
        <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-muted-foreground/70 mt-2.5 block">
          — {author}
        </span>
      </div>
    </div>
  );
}

/* --------------------------------- Main --------------------------------- */

export function ProgressRouter({ onOpenJourney }: ProgressRouterProps) {
  const { user } = useAuth();
  const { data: patientBlocks, isLoading: blocksLoading } = usePatientBlocks(user?.id);
  const { data: plan } = usePatientTreatmentPlan();
  const [journeyOpen, setJourneyOpen] = useState(false);

  if (blocksLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 rounded-[22px]" />
        <Skeleton className="h-24 rounded-[20px]" />
        <Skeleton className="h-40 rounded-[20px]" />
      </div>
    );
  }

  const hasBlocks = patientBlocks && patientBlocks.length > 0;

  // Derive phase info from plan goals (active = first non-completed)
  const goals = plan?.goals ?? [];
  const totalPhases = goals.length || 3;
  const activeIdx = Math.max(
    0,
    goals.findIndex((g) => g.status !== "completed")
  );
  const activeGoal = goals[activeIdx];
  const phaseName = activeGoal?.title || plan?.title || "Din behandling";
  const planTitle = plan?.title || "Behandlingsplan";
  const focusQuote =
    activeGoal?.description ||
    "Varje måltid är ett steg framåt — lita på processen.";

  const shell = (
    <div style={{ backgroundColor: "#EBE5D6" }}>
      {plan && goals.length > 0 && (
        <JourneyHeader
          goals={goals}
          activeIdx={activeIdx}
          open={journeyOpen}
          onToggle={setJourneyOpen}
        >
          <JourneyPanel onClose={() => setJourneyOpen(false)} />
        </JourneyHeader>
      )}

      <div
        className="flex flex-col"
        style={{ padding: "22px 20px 110px", gap: 14 }}
      >
        {plan && activeGoal && (
          <CurrentGoalCard goal={activeGoal} activeIdx={activeIdx} total={goals.length} />
        )}


      {hasBlocks ? (
        <div className="space-y-3.5 pt-2">
          <h2
            className="font-serif"
            style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, textTransform: "uppercase", color: "#1F2A22" }}
          >
            Din{" "}
            <span
              style={{
                backgroundColor: "#B7C4A9",
                borderRadius: 999,
                padding: "0 10px 2px",
                display: "inline-block",
              }}
            >
              utveckling
            </span>
          </h2>
          {(() => {
            const ORDER = ["weight_trend_card", "meals_week_card", "logged_days_card", "waist_trend_card"];
            const sorted = [...(patientBlocks || [])]
              .filter((bd: any) => bd?.block?.id && bd?.block?.template)
              .sort((a, b) => {
                const ia = ORDER.indexOf(a.renderAs || "");
                const ib = ORDER.indexOf(b.renderAs || "");
                return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
              });
            const isHalf = (bd: any) =>
              ["meals_week_card", "logged_days_card"].includes(bd.renderAs || "");
            const rows: JSX.Element[] = [];
            let i = 0;
            while (i < sorted.length) {
              const bd = sorted[i];
              if (isHalf(bd) && sorted[i + 1] && isHalf(sorted[i + 1])) {
                const next = sorted[i + 1];
                rows.push(
                  <div key={bd.block.id} className="grid grid-cols-2 gap-3 items-start">
                    <DynamicBlock data={bd} />
                    <DynamicBlock data={next} />
                  </div>
                );
                i += 2;
              } else {
                rows.push(<DynamicBlock key={bd.block.id} data={bd} />);
                i += 1;
              }
            }
            return rows;
          })()}

        </div>
      ) : (

        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-[20px] bg-secondary border border-border shadow-[0_6px_26px_-12px_hsl(145_30%_11%/0.30)] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <h2 className="font-serif text-[25px] text-primary mb-2">Inga block ännu</h2>
          <p className="text-sm text-muted-foreground max-w-[28ch] mx-auto leading-relaxed">
            Din coach anpassar din utvecklingsvy med block som passar just din behandling.
          </p>
        </div>
      )}
      </div>
    </div>
  );


  return shell;
}
