import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TutorialStep {
  route: string;
  /** primary element to highlight on that page */
  target: string;
  /** fallback if the primary element is not rendered (e.g. no data yet) */
  fallback?: string;
  title: string;
  body: string;
}

const STEPS: TutorialStep[] = [
  {
    route: "/profile",
    target: "profile-health",
    fallback: "profile",
    title: "Hälsoprofil",
    body: "Här fyller du i vikt, längd, blodtryck (om du vet det) och midjemått. Då kan din dietist bygga mål utifrån dina värden.",
  },
  {
    route: "/journal",
    target: "journal-camera",
    fallback: "journal",
    title: "Logga din mat",
    body: "Enklast är att ta kort på maten med kameraknappen. Fångar inte kameran rätt kan du alltid skriva in exakt vad du ätit.",
  },
  {
    route: "/journal",
    target: "journal-goals",
    fallback: "journal",
    title: "Dagliga näringsmål",
    body: "Du och din dietist sätter dagliga mål för varje näringsämne. De uppdateras automatiskt allt eftersom du loggar dina måltider.",
  },
  {
    route: "/recipes",
    target: "recipes-suggested",
    fallback: "recipes",
    title: "Recept från din dietist",
    body: "Här ligger recepten din dietist rekommenderar. Spara dem du gillar — de dyker upp bland dina sparade recept.",
  },
  {
    route: "/recipes",
    target: "recipes-browse",
    fallback: "recipes",
    title: "Hela receptbanken",
    body: "Med den här knappen bläddrar du bland alla recept som dietistcommunityn delat med sig av — filtrera och sortera som du vill.",
  },
  {
    route: "/progress",
    target: "progress-hero",
    fallback: "progress",
    title: "Din utveckling",
    body: "Här ser du planen din dietist sätter för dig. Öppna “Min resa” för att följa faser och mål — kostrelaterade mål bockas av allt eftersom du loggar.",
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

function measure(target?: string): Rect | null {
  if (!target) return null;
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function AppTutorial() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = STEPS[index];

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

  // Drive navigation: every step lives on its own page
  useEffect(() => {
    if (!open || !step) return;
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [open, step, location.pathname, navigate]);

  const updateRect = useCallback(() => {
    if (!open || !step) return;
    setRect(measure(step.target) ?? measure(step.fallback));
  }, [open, step]);

  useLayoutEffect(() => {
    setRect(null);
    updateRect();
  }, [updateRect, location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onChange = () => updateRect();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    const id = window.setInterval(onChange, 250);
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

  const isLast = index === STEPS.length - 1;
  const advance = () => (isLast ? finish() : setIndex((i) => i + 1));

  const pad = 8;
  const highlight = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Place the card opposite the highlight
  const targetCenter = highlight ? highlight.top + highlight.height / 2 : 0;
  const cardBelow = !highlight || targetCenter < window.innerHeight * 0.45;
  const labelAbove = !cardBelow;

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Introduktion">
      <div
        className={cn("absolute inset-0", !highlight && "bg-foreground/70")}
        onClick={finish}
      />

      {highlight && (
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
          <div className="absolute inset-0 rounded-2xl ring-2 ring-background pointer-events-none" />
          <div className="absolute -inset-1 rounded-[20px] ring-2 ring-background/80 animate-ping pointer-events-none" />
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background px-3 py-1 text-[11px] font-semibold text-primary shadow-elevated pointer-events-none",
              labelAbove ? "-top-9" : "-bottom-9"
            )}
          >
            Tryck här
          </div>
        </div>
      )}

      {/* Card */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 w-[min(22rem,calc(100vw-2rem))]",
          cardBelow
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
              <Button size="sm" onClick={advance}>
                {isLast ? "Kom igång" : "Nästa"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
