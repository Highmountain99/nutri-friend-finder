import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { RecipeDetail, Ingredient } from "@/hooks/useRecipeDetail";
import { AddMealSheet } from "@/components/journal/AddMealSheet";
import { useJournalData } from "@/hooks/useJournalData";

interface CookingModeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: RecipeDetail;
}

/* ---------- quantity scaling ---------- */
function parseAmount(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return isFinite(raw) ? raw : null;
  const s = String(raw).replace(",", ".").trim();
  // try fraction "1/2"
  const m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const n = Number(m[1]) / Number(m[2]);
    return isFinite(n) ? n : null;
  }
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}

function fmtAmt(n: number) {
  const r = Math.round(n * 100) / 100;
  const whole = Math.floor(r + 1e-9);
  const rem = Math.round((r - whole) * 100) / 100;
  const frac: Record<string, string> = {
    "0.25": "¼",
    "0.33": "⅓",
    "0.5": "½",
    "0.67": "⅔",
    "0.75": "¾",
  };
  const key = rem.toString();
  if (frac[key]) return (whole ? whole : "") + frac[key];
  if (rem === 0) return String(whole);
  return String(r).replace(".", ",");
}

const fmtClock = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* ---------- step timer ---------- */
function StepTimer({
  minutes,
  onDone,
}: {
  minutes: number;
  onDone?: () => void;
}) {
  const total = minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLeft(total);
    setRunning(false);
  }, [total]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          try {
            const ctx = new (window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = 660;
            o.type = "sine";
            g.gain.setValueAtTime(0.18, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            o.start();
            o.stop(ctx.currentTime + 0.5);
          } catch {
            /* noop */
          }
          onDone?.();
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onDone]);

  const pct = total ? ((total - left) / total) * 100 : 0;
  const done = left === 0;

  return (
    <div className="rounded-xl border border-border bg-background p-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <Timer
          className="w-4 h-4"
          style={{ color: done ? "hsl(var(--primary))" : "hsl(var(--accent))" }}
        />
        <span className="flex-1 font-mono text-lg text-primary tracking-wide">
          {fmtClock(left)}
        </span>
        {!done && (
          <button
            onClick={() => setRunning((r) => !r)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              running
                ? "bg-secondary text-primary border border-border"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {running ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {running ? "Pausa" : "Starta"}
          </button>
        )}
        {left !== total && (
          <button
            onClick={() => {
              setRunning(false);
              setLeft(total);
            }}
            className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs bg-secondary text-primary border border-border"
            aria-label="Återställ timer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="h-1 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className="h-full bg-primary transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      {done && (
        <div className="text-xs text-primary font-medium">
          Klart! Dags för nästa steg.
        </div>
      )}
    </div>
  );
}

/* ---------- ingredient sheet (nested) ---------- */
function IngredientSheet({
  open,
  onClose,
  ingredients,
  portions,
  basePortions,
  setPortions,
}: {
  open: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  portions: number;
  basePortions: number;
  setPortions: (n: number | ((p: number) => number)) => void;
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  return (
    <>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-foreground/30 z-20 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 z-30 bg-background rounded-t-3xl px-5 pt-3 pb-8 max-h-[82%] flex flex-col shadow-elevated transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ boxShadow: "0 -20px 50px -20px hsl(var(--primary) / 0.4)" }}
      >
        <div className="w-10 h-1 rounded-full bg-foreground/40 self-center mb-4 opacity-50" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-3xl text-primary tracking-tight">
            Ingredienser
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-accent"
            aria-label="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-card border border-border rounded-2xl mb-4">
          <div>
            <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-accent">
              Portioner
            </div>
            <div className="font-serif text-2xl text-primary leading-none mt-1">
              {portions}{" "}
              <em className="italic text-base text-accent not-italic font-serif">
                port.
              </em>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={portions <= 1}
              onClick={() => setPortions((p) => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-full bg-background border border-foreground/40 grid place-items-center disabled:opacity-30 disabled:border-border"
            >
              <Minus className="w-4 h-4 text-primary" />
            </button>
            <span className="font-serif text-3xl text-primary min-w-9 text-center">
              {portions}
            </span>
            <button
              disabled={portions >= 12}
              onClick={() => setPortions((p) => Math.min(12, p + 1))}
              className="w-9 h-9 rounded-full bg-background border border-foreground/40 grid place-items-center disabled:opacity-30 disabled:border-border"
            >
              <Plus className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>

        <div className="overflow-auto flex flex-col">
          {ingredients.map((ing, i) => {
            const on = !!checked[i];
            const rawAmt = ing.amount ?? ing.quantity;
            const num = parseAmount(rawAmt);
            const scaledAmt =
              num !== null ? fmtAmt((num * portions) / basePortions) : rawAmt;
            const name = ing.ingredient || ing.text || "";
            return (
              <button
                key={i}
                onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                className="flex items-center gap-3 py-3 px-1.5 border-b border-border text-left"
              >
                <span
                  className={`w-[22px] h-[22px] rounded-md grid place-items-center flex-shrink-0 ${
                    on
                      ? "bg-primary border-0"
                      : "border border-foreground/40"
                  }`}
                >
                  {on && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </span>
                <span
                  className={`flex-1 text-[15px] leading-snug ${
                    on ? "text-accent line-through" : "text-foreground"
                  }`}
                >
                  {(scaledAmt || ing.unit) && (
                    <span className="font-mono text-[13px] text-accent font-medium mr-1.5">
                      {scaledAmt}
                      {scaledAmt && ing.unit ? " " : ""}
                      {ing.unit || ""}
                    </span>
                  )}
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ---------- main ---------- */
export function CookingModeSheet({
  open,
  onOpenChange,
  recipe,
}: CookingModeSheetProps) {
  const total = recipe.instructions.length;
  const basePortions = recipe.servings || 4;
  const { addEntry } = useJournalData(new Date());

  const [active, setActive] = useState(0);
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [portions, setPortions] = useState(basePortions);
  const [finished, setFinished] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [addMealOpen, setAddMealOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state when opening with a new recipe
  useEffect(() => {
    if (open) {
      setActive(0);
      setDoneSet(new Set());
      setFinished(false);
      setSheet(false);
      setAddMealOpen(false);
      setPortions(basePortions);
    }
  }, [open, recipe.id, basePortions]);



  const completeStep = useCallback(() => {
    setDoneSet((prev) => {
      const n = new Set(prev);
      n.add(active);
      return n;
    });
    if (active >= total - 1) {
      setFinished(true);
    } else {
      const next = active + 1;
      setActive(next);
      setTimeout(
        () =>
          listRef.current?.scrollTo({ top: next * 70, behavior: "smooth" }),
        80
      );
    }
  }, [active, total]);

  const restart = () => {
    setActive(0);
    setDoneSet(new Set());
    setFinished(false);
  };

  const completed = finished ? total : doneSet.size;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const totalMin = recipe.time_minutes;

  // detect a possible per-step minute count from text (e.g. "i 5 minuter")
  const stepTime = useMemo(() => {
    return recipe.instructions.map((s) => {
      const m = s.text?.match(/(\d{1,3})\s*(?:min|minut(?:er)?)/i);
      if (!m) return null;
      const n = parseInt(m[1], 10);
      return n > 0 && n <= 180 ? n : null;
    });
  }, [recipe.instructions]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[100dvh] p-0 border-0 flex flex-col bg-background overflow-hidden"
      >
        {/* header */}
        <div className="px-5 pt-3.5 pb-3 flex items-center justify-between gap-2 flex-shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 text-accent"
            aria-label="Tillbaka"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-serif text-xl text-primary tracking-tight text-center truncate">
            {recipe.title}
          </span>
          <button
            onClick={toggleAwake}
            title="Håll skärmen vaken"
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] border ${
              awake
                ? "bg-primary border-primary text-primary-foreground"
                : "border-border text-accent"
            }`}
          >
            <Eye className="w-3 h-3" />
          </button>
        </div>

        {!finished && (
          <div className="px-5 pb-3 flex-shrink-0">
            <div className="flex items-center justify-center gap-3.5 font-mono text-[10px] uppercase tracking-[0.08em] text-accent mb-3">
              {totalMin && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <Timer className="w-3 h-3" /> {totalMin} min
                  </span>
                  <span className="w-[3px] h-[3px] rounded-full bg-accent" />
                </>
              )}
              <span>
                {completed} / {total} klara
              </span>
              <span className="w-[3px] h-[3px] rounded-full bg-accent" />
              <span className="inline-flex items-center gap-1.5">
                <button
                  disabled={portions <= 1}
                  onClick={() => setPortions((p) => Math.max(1, p - 1))}
                  className="w-6 h-6 rounded-full bg-secondary border border-foreground/40 grid place-items-center disabled:opacity-30 disabled:border-border"
                  aria-label="Färre portioner"
                >
                  <Minus className="w-3 h-3 text-primary" />
                </button>
                <span className="text-primary min-w-[44px] text-center">
                  {portions} port.
                </span>
                <button
                  disabled={portions >= 12}
                  onClick={() => setPortions((p) => Math.min(12, p + 1))}
                  className="w-6 h-6 rounded-full bg-secondary border border-foreground/40 grid place-items-center disabled:opacity-30 disabled:border-border"
                  aria-label="Fler portioner"
                >
                  <Plus className="w-3 h-3 text-primary" />
                </button>
              </span>
            </div>
            <div className="h-1 rounded-full bg-foreground/15 overflow-hidden">
              <div
                className="h-full bg-primary transition-[width] duration-500"
                style={{
                  transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                  width: `${pct}%`,
                }}
              />
            </div>
          </div>
        )}

        {finished ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-2">
            <div className="w-[72px] h-[72px] rounded-full bg-primary grid place-items-center mb-2">
              <Check className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-serif text-[44px] leading-none text-primary tracking-tight">
              Klart!
            </h2>
            <p className="font-serif italic text-[22px] text-accent leading-tight">
              Smaklig måltid
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed max-w-[28ch] mt-2">
              Du har lagat {recipe.title}. Logga måltiden för att hålla koll på
              din näringsdagbok.
            </p>
            <button
              onClick={() => {
                if (onLogMeal) onLogMeal();
                else restart();
              }}
              className="mt-3 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium"
            >
              Logga måltid
            </button>
            <button
              onClick={restart}
              className="mt-1.5 px-5 py-3 rounded-2xl border border-foreground/40 bg-transparent text-accent text-[13px]"
            >
              Börja om
            </button>
          </div>
        ) : (
          <div
            ref={listRef}
            className="flex-1 px-4 pt-1 flex flex-col gap-1.5 overflow-auto"
          >
            {recipe.instructions.map((step, i) => {
              const isActive = i === active;
              const isDone = doneSet.has(i);
              if (isActive) {
                return (
                  <div
                    key={i}
                    className="bg-card border border-foreground/40 rounded-[18px] p-5 flex flex-col gap-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-[38px] h-[38px] rounded-full bg-primary text-primary-foreground grid place-items-center font-serif italic text-xl">
                        {i + 1}
                      </span>
                      <span className="font-mono text-[10px] text-accent">
                        Steg {i + 1} / {total}
                      </span>
                    </div>
                    <div className="font-serif text-[26px] leading-tight text-primary tracking-tight">
                      {step.text}
                    </div>
                    {stepTime[i] && (
                      <StepTimer
                        minutes={stepTime[i] as number}
                        onDone={undefined}
                      />
                    )}
                    <button
                      onClick={completeStep}
                      className="py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2"
                    >
                      {i === total - 1
                        ? "Klar med receptet"
                        : "Klar · nästa steg"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              }
              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left w-full ${
                    isDone ? "opacity-55" : ""
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full grid place-items-center flex-shrink-0 font-serif italic text-[15px] ${
                      isDone
                        ? "bg-primary text-primary-foreground border-0"
                        : "border border-foreground/40 text-accent"
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block text-[13px] truncate ${
                        isDone ? "text-accent line-through" : "text-foreground"
                      }`}
                    >
                      {step.text}
                    </span>
                  </span>
                  <span className="text-accent flex-shrink-0">
                    {isDone ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>
              );
            })}
            <div className="h-2" />
          </div>
        )}

        {!finished && (
          <div className="px-5 pt-2.5 pb-6 flex-shrink-0">
            <button
              onClick={() => setSheet(true)}
              className="w-full py-3 rounded-2xl border border-border bg-secondary text-accent font-mono text-[11px] tracking-[0.1em] uppercase flex items-center justify-center gap-2"
            >
              <ChevronUp className="w-3.5 h-3.5" /> Alla ingredienser
            </button>
          </div>
        )}

        <IngredientSheet
          open={sheet}
          onClose={() => setSheet(false)}
          ingredients={recipe.ingredients}
          portions={portions}
          basePortions={basePortions}
          setPortions={setPortions}
        />
      </SheetContent>
    </Sheet>
  );
}
