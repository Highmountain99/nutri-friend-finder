import { useRef, useState } from "react";
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



function JourneyHeader({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: (next: boolean) => void;
  children?: React.ReactNode;
}) {
  const startY = useRef<number | null>(null);

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
          padding: "calc(env(safe-area-inset-top) + 18px) 20px 14px",
        }}
      >
        <div className="flex items-center justify-between">
          <h1
            className="font-serif m-0"
            style={{ fontSize: 38, fontWeight: 800, lineHeight: 0.95, textTransform: "uppercase" }}
          >
            Din{" "}
            <span
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 999,
                padding: "0 14px 3px",
                display: "inline-block",
              }}
            >
              resa
            </span>
          </h1>

          <ChevronDown
            className="w-6 h-6 transition-transform flex-shrink-0"
            style={{ opacity: 0.7, transform: open ? "rotate(180deg)" : "none" }}
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

  const shell = (
    <div style={{ backgroundColor: "#EBE5D6" }}>
      {plan && goals.length > 0 && (
        <JourneyHeader
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
