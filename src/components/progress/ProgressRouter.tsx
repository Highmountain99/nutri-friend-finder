import { Route, Sparkles, ArrowRight } from "lucide-react";
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

function JourneySurface({
  goals,
  activeIdx,
  onOpen,
}: {
  goals: { id: string; title: string; status: string }[];
  activeIdx: number;
  onOpen: () => void;
}) {
  const startY = useRef<number | null>(null);

  return (
    <div className="relative">
      <div
        className="absolute left-2.5 right-2.5 top-2.5 -bottom-2 rounded-[22px] bg-accent/35"
        aria-hidden
      />
      <button
        data-tour="progress-hero"
        onClick={onOpen}
        onPointerDown={(e) => {
          startY.current = e.clientY;
        }}
        onPointerMove={(e) => {
          if (startY.current !== null && e.clientY - startY.current > 28) {
            startY.current = null;
            onOpen();
          }
        }}
        onPointerUp={() => {
          startY.current = null;
        }}
        className="relative w-full text-left bg-primary text-primary-foreground rounded-[22px] p-5 overflow-hidden shadow-[0_18px_44px_-22px_hsl(145_30%_11%/0.7)] active:scale-[0.99] transition-transform touch-pan-y"
      >
        <div
          className="absolute -right-12 -top-12 w-[150px] h-[150px] rounded-full bg-primary-foreground/5"
          aria-hidden
        />
        <h2
          className="relative font-serif m-0"
          style={{
            fontSize: 26,
            fontWeight: 800,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
          }}
        >
          Din{" "}
          <span
            style={{
              backgroundColor: "hsl(var(--primary-foreground))",
              color: "hsl(var(--primary))",
              borderRadius: 999,
              padding: "0 12px 3px",
              display: "inline-block",
            }}
          >
            resa
          </span>
        </h2>

        {/* Huvudmål från coachens behandlingsplan */}
        <div className="relative mt-5 space-y-3">
          {goals.map((g, i) => {
            const done = g.status === "completed";
            const active = i === activeIdx && !done;
            return (
              <div key={g.id} className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px]"
                  style={{
                    backgroundColor: done
                      ? "hsl(var(--primary-foreground))"
                      : "transparent",
                    color: done
                      ? "hsl(var(--primary))"
                      : "hsl(var(--primary-foreground))",
                    border: done
                      ? "none"
                      : `1.5px solid hsl(var(--primary-foreground) / ${active ? 1 : 0.35})`,
                    opacity: done || active ? 1 : 0.7,
                  }}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span
                  className="text-[14.5px] leading-snug truncate"
                  style={{
                    opacity: done ? 0.75 : active ? 1 : 0.6,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {g.title}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative flex justify-center mt-4">
          <span
            className="block rounded-full"
            style={{ width: 40, height: 4, backgroundColor: "hsl(var(--primary-foreground) / 0.35)" }}
          />
        </div>
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
    <div className="px-4 pt-4 pb-24 space-y-3.5">
      <HeaderB />
      {plan && (
        <HeroB
          planTitle={planTitle}
          phaseName={phaseName}
          activeIdx={activeIdx}
          totalPhases={totalPhases}
          onOpen={onOpenJourney}
        />
      )}
      <FocusB quote={focusQuote} author="Din coach" />

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
  );

  return shell;
}
