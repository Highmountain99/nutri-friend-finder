import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface TourStep {
  route: string;
  selector: string;
  title: string;
  body: string;
  /** wait a bit longer for lazy content */
  delay?: number;
}

const STEPS: TourStep[] = [
  {
    route: "/home",
    selector: '[data-tour="home-health"]',
    title: "Din hälsoprofil",
    body: "Här samlar vi vikt, midjemått och dina mål. Fyll i den först — allt annat i appen anpassas efter den.",
  },
  {
    route: "/journal",
    selector: '[data-tour="journal-camera"]',
    title: "Logga din mat",
    body: "Ta ett foto, välj en bild eller skriv vad du åt. Vi räknar ut näringen åt dig — du kan alltid justera.",
    delay: 400,
  },
  {
    route: "/journal",
    selector: '[data-tour="journal-goals"]',
    title: "Dagens översikt",
    body: "Här ser du dagens energi och makros i förhållande till dina mål. Swipa mellan dagar för historik.",
    delay: 400,
  },
  {
    route: "/recipes",
    selector: '[data-tour="recipes-browse"]',
    title: "Recept",
    body: "Sök fritt eller bläddra i hela receptbanken med filter. Din dietist kan också skicka recept direkt till dig.",
    delay: 400,
  },
  {
    route: "/progress",
    selector: '[data-tour="progress-hero"]',
    title: "Din utveckling",
    body: "Följ din resa, dina milstolpar och behandlingsplanen från din dietist. Tryck på kortet för att öppna kartan.",
    delay: 500,
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

export function CoachTour({ onFinish }: { onFinish: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const targetRef = useRef<Element | null>(null);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  // Mark the tour as active so locked views (e.g. Progress) can show their open state
  useEffect(() => {
    document.body.setAttribute("data-coach-tour", "active");
    return () => document.body.removeAttribute("data-coach-tour");
  }, []);


  // Navigate to the step's route
  useEffect(() => {
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [step.route, location.pathname, navigate]);

  // Locate + track the target element
  useLayoutEffect(() => {
    let raf = 0;
    let cancelled = false;
    let tries = 0;

    const measure = () => {
      const el = document.querySelector(step.selector);
      targetRef.current = el;
      if (!el) {
        if (tries++ < 60 && !cancelled) raf = requestAnimationFrame(measure);
        else if (!cancelled) setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        if (tries++ < 60 && !cancelled) raf = requestAnimationFrame(measure);
        return;
      }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const start = window.setTimeout(() => {
      const el = document.querySelector(step.selector);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      window.setTimeout(measure, 350);
    }, step.delay ?? 150);

    const onChange = () => {
      const el = targetRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);

    return () => {
      cancelled = true;
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [step.selector, step.delay, location.pathname]);

  const next = useCallback(() => {
    if (isLast) onFinish();
    else {
      setRect(null);
      setIndex((i) => i + 1);
    }
  }, [isLast, onFinish]);

  // Advance when the user actually taps the highlighted element
  useEffect(() => {
    const el = targetRef.current;
    if (!el || !rect) return;
    const handler = () => window.setTimeout(next, 250);
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [rect, next]);

  const vh = window.innerHeight;
  const spot = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  const cardBelow = spot ? spot.top + spot.height < vh * 0.55 : true;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* dimmer with a hole around the target */}
      {spot ? (
        <>
          <div
            className="absolute rounded-2xl pointer-events-none transition-all duration-300"
            style={{
              top: spot.top,
              left: spot.left,
              width: spot.width,
              height: spot.height,
              boxShadow: "0 0 0 9999px hsl(145 30% 11% / 0.72)",
            }}
          />
          <span
            className="absolute rounded-2xl border-2 border-primary-foreground/80 pointer-events-none animate-pulse transition-all duration-300"
            style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
            aria-hidden
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: "hsl(145 30% 11% / 0.72)" }} />
      )}

      {/* click-blockers around the hole so only the target is tappable */}
      {spot && (
        <>
          <div className="absolute left-0 right-0 top-0" style={{ height: Math.max(spot.top, 0) }} />
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{ top: spot.top + spot.height }}
          />
          <div
            className="absolute left-0"
            style={{ top: spot.top, height: spot.height, width: Math.max(spot.left, 0) }}
          />
          <div
            className="absolute right-0"
            style={{ top: spot.top, height: spot.height, left: spot.left + spot.width }}
          />
        </>
      )}

      {/* tooltip card */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[min(92vw,420px)] transition-all duration-300"
        style={
          cardBelow && spot
            ? { top: Math.min(spot.top + spot.height + 16, vh - 220) }
            : spot
              ? { top: Math.max(spot.top - 200, 24) }
              : { top: "35%" }
        }
      >
        <div className="rounded-[20px] bg-card border border-border p-5 shadow-[0_24px_60px_-24px_hsl(145_30%_11%/0.8)]">
          <div className="flex items-start justify-between gap-3 mb-1">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted-foreground">
              Steg {index + 1} av {STEPS.length}
            </p>
            <button
              onClick={onFinish}
              aria-label="Avsluta guiden"
              className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h2 className="font-serif text-2xl text-primary mb-2">{step.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.body}</p>

          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 flex-1">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={
                    "h-1.5 rounded-full transition-all " +
                    (i === index ? "w-5 bg-primary" : "w-1.5 bg-border")
                  }
                />
              ))}
            </div>
            {index > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setIndex((i) => i - 1)}>
                Tillbaka
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {isLast ? "Klar" : "Nästa"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
