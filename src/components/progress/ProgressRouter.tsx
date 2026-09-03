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

function HeroB({
  planTitle,
  phaseName,
  activeIdx,
  totalPhases,
  weekLabel,
  onOpen,
}: {
  planTitle: string;
  phaseName: string;
  activeIdx: number;
  totalPhases: number;
  weekLabel?: string;
  onOpen: () => void;
}) {
  return (
    <div className="relative">
      {/* layered peek */}
      <div
        className="absolute left-2.5 right-2.5 top-2.5 -bottom-2 rounded-[22px] bg-accent/35"
        aria-hidden
      />
      <button
        data-tour="progress-hero"
        onClick={onOpen}
        className="relative w-full text-left bg-primary text-primary-foreground rounded-[22px] p-5 overflow-hidden shadow-[0_18px_44px_-22px_hsl(145_30%_11%/0.7)] active:scale-[0.99] transition-transform"
      >
        <div
          className="absolute -right-12 -top-12 w-[150px] h-[150px] rounded-full bg-primary-foreground/5"
          aria-hidden
        />
        <div className="relative flex items-center justify-between mb-4">
          <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-primary-foreground/70">
            Min resa · {planTitle}
          </span>
          <Route className="w-3.5 h-3.5 text-primary-foreground/70" />
        </div>
        <div className="relative flex items-center gap-4">
          <Arc value={activeIdx + 1} total={Math.max(totalPhases, 1)}>
            <span className="font-serif text-[26px] leading-none text-primary-foreground">
              {activeIdx + 1}
            </span>
            <span className="font-mono text-[8px] tracking-[0.1em] text-primary-foreground/70 mt-0.5">
              AV {Math.max(totalPhases, 1)}
            </span>
          </Arc>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-[26px] leading-tight tracking-tight truncate">
              {phaseName}
            </div>
            {weekLabel && (
              <div className="font-mono text-[9.5px] tracking-[0.1em] text-primary-foreground/70 mt-1.5 uppercase">
                {weekLabel}
              </div>
            )}
            <div className="flex gap-1.5 mt-2.5">
              {Array.from({ length: Math.max(totalPhases, 1) }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i <= activeIdx ? "bg-primary-foreground" : "bg-primary-foreground/18"
                  }`}
                  style={{ backgroundColor: i <= activeIdx ? undefined : "hsl(var(--primary-foreground) / 0.18)" }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-between mt-4 pt-3.5 border-t border-primary-foreground/18">
          <span className="text-[12.5px] text-primary-foreground/70">
            Öppna din behandlingsplan
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold bg-primary-foreground/12 rounded-full px-3 py-1.5">
            Min resa <ArrowRight className="w-3 h-3" />
          </span>
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
        <div className="space-y-3">
          {patientBlocks!.map((bd) => (
            <DynamicBlock key={bd.block.id} data={bd} />
          ))}
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
