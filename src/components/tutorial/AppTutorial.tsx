import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TourTarget = "profile" | "journal" | "recipes" | "progress";

interface TutorialStep {
  target: TourTarget;
  title: string;
  body: string;
}

const STEPS: TutorialStep[] = [
  {
    target: "profile",
    title: "Hälsoprofil",
    body: "Här fyller du i vikt, längd, blodtryck (om du vet det) och midjemått. Då kan din dietist bygga mål utifrån dina värden.",
  },
  {
    target: "journal",
    title: "Journal",
    body: "Här loggar du vad du äter. Enklast är att ta kort på maten och lägga till direkt. Fångar inte kameran rätt kan du alltid skriva in exakt vad du ätit.",
  },
  {
    target: "journal",
    title: "Dagliga näringsmål",
    body: "Du och din dietist sätter dagliga mål för hur mycket av varje näringsämne du ska få i dig. Målen syns i journalen och uppdateras allt eftersom du loggar dina måltider.",
  },
  {
    target: "recipes",
    title: "Recept",
    body: "Här hittar du recepten din dietist rekommenderar. Spara dem du gillar — de dyker upp bland dina sparade recept. Du kan även bläddra bland recept som hela dietistcommunityn delat med sig av.",
  },
  {
    target: "progress",
    title: "Utveckling",
    body: "Här ser du utvecklingsplanen din dietist sätter för dig. Du följer din resa och målen längs vägen — kostrelaterade mål bockas av allt eftersom du loggar.",
  },
];

const storageKey = (userId: string) => `gf_tutorial_v1_${userId}`;

export function hasSeenTutorial(userId: string) {
  try {
    return localStorage.getItem(storageKey(userId)) === "done";
  } catch {
    return true;
  }
}

export function restartTutorial() {
  window.dispatchEvent(new CustomEvent("gf-restart-tutorial"));
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measure(target: TourTarget): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function AppTutorial() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Auto-start once per user
  useEffect(() => {
    if (!user) return;
    if (hasSeenTutorial(user.id)) return;
    const t = setTimeout(() => {
      setIndex(0);
      setOpen(true);
    }, 700);
    return () => clearTimeout(t);
  }, [user]);

  // Manual restart
  useEffect(() => {
    const handler = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener("gf-restart-tutorial", handler);
    return () => window.removeEventListener("gf-restart-tutorial", handler);
  }, []);

  const step = STEPS[index];

  const updateRect = useCallback(() => {
    if (!open || !step) return;
    setRect(measure(step.target));
  }, [open, step]);

  useLayoutEffect(() => {
    updateRect();
  }, [updateRect]);

  useEffect(() => {
    if (!open) return;
    const onChange = () => updateRect();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    const id = window.setInterval(onChange, 400);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
      window.clearInterval(id);
    };
  }, [open, updateRect]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const finish = useCallback(() => {
    setOpen(false);
    if (user) {
      try {
        localStorage.setItem(storageKey(user.id), "done");
      } catch {
        /* ignore */
      }
    }
  }, [user]);

  if (!open || !step) return null;

  const advance = () => (index === STEPS.length - 1 ? finish() : setIndex((i) => i + 1));

  const pad = 8;
  const highlight = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const anchorIsBottom = step.target !== "profile";
  const arrowLeft = highlight ? highlight.left + highlight.width / 2 : window.innerWidth / 2;

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Introduktion">
      {/* Backdrop — darkness comes from the spotlight's box-shadow so the target stays crisp */}
      <div className="absolute inset-0" onClick={finish} />

      {highlight && (
        <>
          {/* Spotlight cut-out — tappable to advance */}
          <div
            className="absolute rounded-2xl transition-all duration-300 cursor-pointer"
            role="button"
            aria-label="Gå vidare"
            onClick={advance}
            style={{
              top: highlight.top,
              left: highlight.left,
              width: highlight.width,
              height: highlight.height,
              boxShadow: "0 0 0 9999px hsl(var(--foreground) / 0.7)",
            }}
          >
            {/* Solid ring */}
            <div className="absolute inset-0 rounded-2xl ring-2 ring-background pointer-events-none" />
            {/* Pulsing ring to draw attention */}
            <div className="absolute -inset-1 rounded-[20px] ring-2 ring-background/80 animate-ping pointer-events-none" />
            {/* "Tryck här" label */}
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background px-3 py-1 text-[11px] font-semibold text-primary shadow-elevated pointer-events-none",
                anchorIsBottom ? "-top-9" : "-bottom-9"
              )}
            >
              Tryck här
            </div>
          </div>
        </>
      )}

      {/* Arrow */}
      {highlight && (
        <div
          className="absolute pointer-events-none transition-all duration-300"
          style={{
            left: Math.min(Math.max(arrowLeft - 12, 16), window.innerWidth - 40),
            top: anchorIsBottom ? highlight.top - 30 : highlight.top + highlight.height + 6,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-background drop-shadow">
            {anchorIsBottom ? (
              <path d="M12 22 L3 8 h18 Z" fill="currentColor" />
            ) : (
              <path d="M12 2 L21 16 H3 Z" fill="currentColor" />
            )}
          </svg>
        </div>
      )}

      {/* Card */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 w-[min(22rem,calc(100vw-2rem))]",
          anchorIsBottom
            ? "bottom-[calc(7.5rem+env(safe-area-inset-bottom))]"
            : "top-[calc(5.5rem+env(safe-area-inset-top))]"
        )}
      >
        <div className="rounded-[20px] bg-card border border-border shadow-elevated p-5 space-y-3">
          <p className="eyebrow text-[10px] text-muted-foreground">
            Steg {index + 1} av {STEPS.length}
          </p>
          <h2 className="font-serif text-2xl text-primary leading-tight">{step.title}</h2>
          <p className="text-sm text-foreground/80 leading-relaxed">{step.body}</p>

          <div className="flex items-center gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-5 bg-primary" : "w-1.5 bg-border"
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">
              Hoppa över
            </Button>
            <div className="flex items-center gap-2">
              {index > 0 && (
                <Button variant="outline" size="sm" onClick={() => setIndex((i) => i - 1)}>
                  Tillbaka
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => (index === STEPS.length - 1 ? finish() : setIndex((i) => i + 1))}
              >
                {index === STEPS.length - 1 ? "Kom igång" : "Nästa"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
