import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePatientTreatmentPlan, PatientGoal } from "@/hooks/usePatientTreatmentPlan";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Route,
  X,
  Check,
  Lock,
  Target,
  Clock,
  Leaf,
  Eye,
  Activity,
  Heart,
  MessageCircle,
  Sparkles,
  ChevronLeft,
} from "lucide-react";

/* ---------- Tokens (scoped to Min resa per spec) ---------- */
const T = {
  bg: "#EBE5D6",
  card: "#E4DCC7",
  card2: "#EFEADD",
  track: "#DDD3BC",
  green: "#1F3A2E",
  green2: "#2D4F3E",
  greenDk: "#16291F",
  ink: "#1F2A22",
  terra: "#B85638",
  moss: "#5E7A4A",
  wheat: "#C49A3A",
  bronze: "#8C6E3D",
  onG: "#EDE7D7",
  mut: "rgba(31,42,34,0.58)",
  faint: "rgba(31,42,34,0.40)",
  hair: "rgba(31,42,34,0.14)",
  hairS: "rgba(31,42,34,0.22)",
  onGmut: "rgba(237,231,215,0.66)",
  onGhair: "rgba(237,231,215,0.18)",
};

const PHASE_ICONS = [Eye, Leaf, Activity, Heart] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PhaseStatus = "done" | "active" | "locked";

interface Phase {
  goal: PatientGoal;
  index: number;
  status: PhaseStatus;
  Icon: (typeof PHASE_ICONS)[number];
  subLabel: string;
  periodLabel: string;
}

/* ============================================================ */

export function TreatmentJourneySheet({ open, onOpenChange }: Props) {
  const { data: plan, isLoading } = usePatientTreatmentPlan();
  const [openPhaseIdx, setOpenPhaseIdx] = useState<number | null>(null);

  // Reset to map whenever the sheet re-opens
  useEffect(() => {
    if (open) setOpenPhaseIdx(null);
  }, [open]);

  const phases: Phase[] = useMemo(() => {
    const goals = plan?.goals ?? [];
    const firstNonDone = goals.findIndex((g) => g.status !== "completed");
    return goals.map((g, i) => {
      let status: PhaseStatus;
      if (g.status === "completed") status = "done";
      else if (i === firstNonDone) status = "active";
      else status = "locked";
      const Icon = PHASE_ICONS[i % PHASE_ICONS.length];
      const total = goals.length || 1;
      const subLabel =
        status === "active"
          ? `FAS ${i} · VECKA ${i + 1} / ${total * 2}`
          : status === "done"
          ? `FAS ${i} · ${Math.max(2, 4 - i)} V`
          : `FAS ${i}`;
      const periodLabel =
        status === "done"
          ? g.completed_at
            ? `AVSLUTAD ${format(parseISO(g.completed_at), "d MMM", { locale: sv }).toUpperCase()}`
            : "AVSLUTAD"
          : status === "active"
          ? "PÅGÅR"
          : "LÅSES UPP EFTER FÖREGÅENDE FAS";
      return { goal: g, index: i, status, Icon, subLabel, periodLabel };
    });
  }, [plan]);

  const doneCount = phases.filter((p) => p.status === "done").length;
  const activePhase = openPhaseIdx != null ? phases[openPhaseIdx] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        className="h-[92vh] rounded-t-[28px] border-none p-0 overflow-hidden"
        style={{ backgroundColor: T.bg, color: T.ink }}
      >
        {/* Grabber */}
        <div className="flex justify-center pt-2.5 pb-1.5">
          <span
            className="block rounded-full"
            style={{ width: 42, height: 5, backgroundColor: T.hairS }}
          />
        </div>

        <div className="h-[calc(92vh-24px)] overflow-y-auto px-[18px] pb-10">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: T.mut }}>
              Laddar…
            </div>
          ) : phases.length === 0 ? (
            <EmptyState onClose={() => onOpenChange(false)} />
          ) : activePhase ? (
            <PhaseDetail
              phase={activePhase}
              total={phases.length}
              dietitianName="Din dietist"
              onBack={() => setOpenPhaseIdx(null)}
            />
          ) : (
            <MapView
              phases={phases}
              doneCount={doneCount}
              planTitle={plan?.title || "Din behandling"}
              onClose={() => onOpenChange(false)}
              onSelect={(i) => setOpenPhaseIdx(i)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ============================================================ */
/* Map                                                          */
/* ============================================================ */

function MapView({
  phases,
  doneCount,
  planTitle,
  onClose,
  onSelect,
}: {
  phases: Phase[];
  doneCount: number;
  planTitle: string;
  onClose: () => void;
  onSelect: (i: number) => void;
}) {
  // Layout
  const width = 340;
  const amp = 46;
  const stepH = 138;
  const startY = 40;
  const centerX = width / 2;
  const nodeR = 28;

  const nodePos = (i: number) => ({
    x: centerX + (i % 2 === 0 ? amp : -amp),
    y: startY + i * stepH,
  });

  const finishY = startY + phases.length * stepH;
  const totalHeight = finishY + 90;

  const buildPath = (count: number, includeFinish: boolean) => {
    if (count < 1) return "";
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) pts.push(nodePos(i));
    if (includeFinish) pts.push({ x: centerX, y: finishY });
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const c = pts[i];
      const n = pts[i + 1];
      const my = (c.y + n.y) / 2;
      d += ` C ${c.x} ${my}, ${n.x} ${my}, ${n.x} ${n.y}`;
    }
    return d;
  };

  // Completed path up through the active node
  const activeIdx = phases.findIndex((p) => p.status === "active");
  const completedThrough = activeIdx >= 0 ? activeIdx + 1 : doneCount;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <div
            className="font-mono uppercase tracking-[0.16em]"
            style={{ fontSize: 10, color: T.mut }}
          >
            {planTitle}
          </div>
          <h1
            className="font-serif italic tracking-tight leading-none mt-2"
            style={{ fontSize: 34, color: T.green }}
          >
            Min resa
          </h1>
        </div>
        <button
          onClick={onClose}
          aria-label="Stäng"
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ backgroundColor: T.card, border: `1px solid ${T.hair}` }}
        >
          <X className="w-4 h-4" style={{ color: T.ink }} />
        </button>
      </div>

      {/* Map card */}
      <div
        className="mt-5 rounded-[22px] p-4"
        style={{
          backgroundColor: T.card2,
          boxShadow: "0 6px 26px -12px rgba(22,41,31,0.30)",
          border: `1px solid ${T.hair}`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <Route className="w-3 h-3" style={{ color: T.mut }} />
          <span
            className="font-mono uppercase tracking-[0.16em]"
            style={{ fontSize: 9, color: T.mut }}
          >
            Din väg genom programmet
          </span>
        </div>
        <p className="mt-1 text-[11px]" style={{ color: T.mut }}>
          Tryck på ett steg för att se dess mål.
        </p>

        <div className="relative mx-auto mt-4" style={{ width, height: totalHeight }}>
          <svg
            width={width}
            height={totalHeight}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Wide soft trail */}
            <path
              d={buildPath(phases.length, true)}
              fill="none"
              stroke={T.green}
              strokeOpacity={0.06}
              strokeWidth={26}
              strokeLinecap="round"
            />
            {/* Dashed upcoming */}
            <path
              d={buildPath(phases.length, true)}
              fill="none"
              stroke={T.green}
              strokeOpacity={0.28}
              strokeWidth={1.4}
              strokeDasharray="4 6"
              strokeLinecap="round"
            />
            {/* Completed */}
            {completedThrough > 0 && (
              <path
                d={buildPath(completedThrough, false)}
                fill="none"
                stroke={T.green}
                strokeWidth={3.5}
                strokeLinecap="round"
              />
            )}
          </svg>

          {phases.map((p, i) => {
            const pos = nodePos(i);
            const textOnLeft = i % 2 === 0; // node on right → label on left
            return (
              <div key={p.goal.id}>
                {/* Node */}
                <button
                  onClick={() => onSelect(i)}
                  className="absolute active:scale-[0.965] transition-transform"
                  style={{
                    left: pos.x - nodeR,
                    top: pos.y - nodeR,
                    width: nodeR * 2,
                    height: nodeR * 2,
                  }}
                  aria-label={`Öppna ${p.goal.title}`}
                >
                  {p.status === "active" && (
                    <span
                      className="absolute -inset-1.5 rounded-full animate-pulse"
                      style={{ border: `2px solid ${T.terra}`, opacity: 0.55 }}
                    />
                  )}
                  <span
                    className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={
                      p.status === "done"
                        ? { backgroundColor: T.green }
                        : p.status === "active"
                        ? {
                            backgroundColor: T.card2,
                            border: `2.5px solid ${T.green}`,
                          }
                        : {
                            backgroundColor: T.track,
                            border: `1px solid ${T.hair}`,
                          }
                    }
                  >
                    {p.status === "done" ? (
                      <Check className="w-6 h-6" style={{ color: T.onG }} strokeWidth={2.4} />
                    ) : p.status === "active" ? (
                      <span
                        className="font-serif italic"
                        style={{ fontSize: 22, color: T.green, lineHeight: 1 }}
                      >
                        {i + 1}
                      </span>
                    ) : (
                      <Lock className="w-4 h-4" style={{ color: T.faint }} />
                    )}
                  </span>
                </button>

                {/* Label */}
                <div
                  className="absolute"
                  style={{
                    top: pos.y - 34,
                    width: 140,
                    ...(textOnLeft
                      ? { right: width - pos.x + nodeR + 10, textAlign: "right" as const }
                      : { left: pos.x + nodeR + 10, textAlign: "left" as const }),
                  }}
                >
                  <div
                    className="font-serif tracking-tight leading-tight"
                    style={{
                      fontSize: 18,
                      color: p.status === "locked" ? T.faint : T.green,
                    }}
                  >
                    {p.goal.title}
                  </div>
                  <div
                    className="font-mono uppercase mt-1 tracking-[0.14em]"
                    style={{ fontSize: 8.5, color: T.mut }}
                  >
                    {p.subLabel}
                  </div>
                  {p.goal.description && (
                    <p
                      className="mt-1 leading-snug"
                      style={{ fontSize: 11, color: p.status === "locked" ? T.faint : T.mut }}
                    >
                      {p.goal.description.length > 46
                        ? p.goal.description.slice(0, 44) + "…"
                        : p.goal.description}
                    </p>
                  )}
                  <StatusPill status={p.status} />
                  <div
                    className="font-mono uppercase mt-1.5 tracking-[0.14em] flex items-center gap-1"
                    style={{
                      fontSize: 8.5,
                      color: p.status === "locked" ? T.faint : T.green,
                      justifyContent: textOnLeft ? "flex-end" : "flex-start",
                    }}
                  >
                    {countCompleted(p.goal)}/{p.goal.milestones.length} MÅL ›
                  </div>
                </div>
              </div>
            );
          })}

          {/* Finish */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: centerX - 30, top: finishY - 30, width: 60 }}
          >
            <div
              className="w-[60px] h-[60px] rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `${T.green}1A`,
                border: `1.5px solid ${T.green}4D`,
              }}
            >
              <Target className="w-6 h-6" style={{ color: T.green }} />
            </div>
            <div
              className="font-mono uppercase tracking-[0.16em] mt-2"
              style={{ fontSize: 9, color: T.mut }}
            >
              Målet
            </div>
            <div
              className="font-serif italic mt-0.5"
              style={{ fontSize: 15, color: T.green }}
            >
              Långsiktig magbalans
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusPill({ status }: { status: PhaseStatus }) {
  const map = {
    done: { label: "Klar", bg: `${T.moss}22`, fg: T.moss, bd: `${T.moss}55` },
    active: { label: "Pågår nu", bg: `${T.terra}22`, fg: T.terra, bd: `${T.terra}55` },
    locked: { label: "Låst", bg: T.track, fg: T.mut, bd: T.hair },
  }[status];
  return (
    <span
      className="inline-block mt-1.5 rounded-full font-mono uppercase tracking-[0.12em]"
      style={{
        fontSize: 8.5,
        padding: "3px 8px",
        backgroundColor: map.bg,
        color: map.fg,
        border: `1px solid ${map.bd}`,
      }}
    >
      {map.label}
    </span>
  );
}

function countCompleted(g: PatientGoal) {
  return g.milestones.filter((m) => m.is_completed).length;
}

/* ============================================================ */
/* Phase detail                                                 */
/* ============================================================ */

function PhaseDetail({
  phase,
  total,
  dietitianName,
  onBack,
}: {
  phase: Phase;
  total: number;
  dietitianName: string;
  onBack: () => void;
}) {
  const { goal, status, Icon } = phase;
  const completed = countCompleted(goal);
  const totalGoals = goal.milestones.length;
  const pct = totalGoals ? (completed / totalGoals) * 100 : 0;

  return (
    <>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 font-mono uppercase tracking-[0.14em] mt-2 mb-4 active:opacity-70"
        style={{ fontSize: 10, color: T.mut }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Min resa
      </button>

      {/* Hero */}
      <div className="relative">
        <div
          className="absolute rounded-[22px]"
          style={{
            inset: "10px 10px -8px 10px",
            backgroundColor: T.green2,
            opacity: 0.33,
          }}
          aria-hidden
        />
        <div
          className="relative rounded-[22px] p-5 overflow-hidden"
          style={{
            backgroundColor: T.green,
            color: T.onG,
            boxShadow: "0 18px 44px -22px rgba(22,41,31,0.7)",
          }}
        >
          <div
            className="absolute -right-10 -top-10 w-[130px] h-[130px] rounded-full"
            style={{ backgroundColor: T.onG, opacity: 0.05 }}
            aria-hidden
          />
          <div className="relative flex items-start justify-between mb-4">
            <div
              className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center"
              style={{ backgroundColor: `${T.onG}1F` }}
            >
              <Icon className="w-5 h-5" style={{ color: T.onG }} />
            </div>
            <span
              className="rounded-full font-mono uppercase tracking-[0.12em]"
              style={{
                fontSize: 9,
                padding: "4px 10px",
                backgroundColor:
                  status === "active" ? T.terra : status === "done" ? T.moss : `${T.onG}1F`,
                color: T.onG,
              }}
            >
              {status === "active" ? "Pågår nu" : status === "done" ? "Klar" : "Låst"}
            </span>
          </div>
          <div
            className="relative font-mono uppercase tracking-[0.14em] mb-2"
            style={{ fontSize: 9.5, color: T.onGmut }}
          >
            {status === "active" ? "PÅGÅENDE" : status === "done" ? "AVSLUTAD" : "KOMMANDE"} FAS ·{" "}
            {phase.subLabel.replace(/^FAS \d+ · /, "")}
          </div>
          <h2
            className="relative font-serif tracking-tight leading-none"
            style={{ fontSize: 32 }}
          >
            {goal.title}
          </h2>
          {goal.description && (
            <p
              className="relative mt-3 leading-relaxed"
              style={{ fontSize: 13.5, color: T.onGmut }}
            >
              {goal.description}
            </p>
          )}
          <div
            className="relative flex items-center gap-1.5 mt-4 pt-3.5"
            style={{ borderTop: `1px solid ${T.onGhair}` }}
          >
            <Clock className="w-3 h-3" style={{ color: T.onGmut }} />
            <span
              className="font-mono uppercase tracking-[0.14em]"
              style={{ fontSize: 9, color: T.onGmut }}
            >
              {phase.periodLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Goal progress card */}
      <div
        className="mt-4 rounded-[20px] p-4"
        style={{
          backgroundColor: T.card,
          border: `1px solid ${T.hair}`,
          boxShadow: "0 6px 26px -12px rgba(22,41,31,0.30)",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center"
              style={{ backgroundColor: `${T.green}12` }}
            >
              <Target className="w-4 h-4" style={{ color: T.green }} />
            </div>
            <div>
              <div className="font-semibold text-[14px]" style={{ color: T.ink }}>
                Mål i denna del
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: T.mut }}>
                Satta av {dietitianName}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div
              className="font-serif leading-none"
              style={{ fontSize: 26, color: status === "locked" ? T.mut : T.green }}
            >
              {status === "locked" ? "—" : `${completed}/${totalGoals}`}
            </div>
            <div
              className="font-mono uppercase tracking-[0.14em] mt-1"
              style={{ fontSize: 8.5, color: T.mut }}
            >
              {status === "locked" ? "Låst" : "Avklarade"}
            </div>
          </div>
        </div>
        <div
          className="mt-3 h-[7px] rounded-full overflow-hidden"
          style={{ backgroundColor: T.track }}
        >
          {status !== "locked" && (
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: status === "active" ? T.terra : T.green,
              }}
            />
          )}
        </div>
      </div>

      {/* Goal list */}
      <div className="mt-3 space-y-2.5">
        {goal.milestones.length === 0 && (
          <div
            className="text-[13px] text-center rounded-[16px] p-5"
            style={{ backgroundColor: T.card, color: T.mut, border: `1px solid ${T.hair}` }}
          >
            Inga mål satta för denna del ännu.
          </div>
        )}
        {goal.milestones.map((m) => {
          const done = m.is_completed;
          const locked = status === "locked";
          return (
            <div
              key={m.id}
              className="rounded-[16px] p-3.5 flex items-start gap-3"
              style={{
                backgroundColor: done ? `${T.moss}17` : T.card,
                border: `1px solid ${done ? `${T.moss}2E` : T.hair}`,
                opacity: locked ? 0.72 : 1,
              }}
            >
              <div
                className="w-[26px] h-[26px] rounded-[8px] flex-shrink-0 flex items-center justify-center mt-0.5"
                style={
                  done
                    ? { backgroundColor: T.moss }
                    : locked
                    ? { backgroundColor: T.track }
                    : { backgroundColor: "transparent", border: `1.5px solid ${T.hairS}` }
                }
              >
                {done ? (
                  <Check className="w-4 h-4" style={{ color: T.onG }} strokeWidth={2.6} />
                ) : locked ? (
                  <Lock className="w-3.5 h-3.5" style={{ color: T.faint }} />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold text-[13.5px] leading-snug"
                  style={{ color: T.ink }}
                >
                  {m.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div
        className="mt-4 rounded-[14px] p-3.5 flex items-start gap-2.5"
        style={
          status === "active"
            ? {
                backgroundColor: `${T.bronze}14`,
                border: `1px solid ${T.bronze}33`,
              }
            : status === "done"
            ? {
                backgroundColor: `${T.moss}14`,
                border: `1px solid ${T.moss}33`,
              }
            : { backgroundColor: T.card2, border: `1px solid ${T.hair}` }
        }
      >
        {status === "active" ? (
          <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: T.bronze }} />
        ) : status === "done" ? (
          <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: T.moss }} />
        ) : (
          <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: T.mut }} />
        )}
        <p className="text-[12.5px] leading-snug" style={{ color: T.ink }}>
          {status === "active"
            ? `Fastnat på ett mål? Skriv till ${dietitianName} i meddelanden.`
            : status === "done"
            ? "Alla mål klarade — snyggt jobbat. Denna del är avslutad."
            : "Målen låses upp när föregående fas är klar."}
        </p>
      </div>
    </>
  );
}

/* ============================================================ */

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <div
            className="font-mono uppercase tracking-[0.16em]"
            style={{ fontSize: 10, color: T.mut }}
          >
            Din resa
          </div>
          <h1
            className="font-serif italic tracking-tight leading-none mt-2"
            style={{ fontSize: 34, color: T.green }}
          >
            Min resa
          </h1>
        </div>
        <button
          onClick={onClose}
          aria-label="Stäng"
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center"
          style={{ backgroundColor: T.card, border: `1px solid ${T.hair}` }}
        >
          <X className="w-4 h-4" style={{ color: T.ink }} />
        </button>
      </div>
      <div className="flex flex-col items-center text-center mt-16">
        <div
          className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-5"
          style={{ backgroundColor: T.card2, border: `1px solid ${T.hair}` }}
        >
          <Route className="w-6 h-6" style={{ color: T.green }} />
        </div>
        <h2 className="font-serif tracking-tight" style={{ fontSize: 24, color: T.green }}>
          Din resa ritas snart
        </h2>
        <p
          className="mt-2 text-[13px] leading-relaxed max-w-[28ch]"
          style={{ color: T.mut }}
        >
          När din dietist satt upp planen dyker kartan upp här.
        </p>
      </div>
    </div>
  );
}
