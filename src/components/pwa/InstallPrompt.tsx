import { useEffect, useState } from "react";
import { X, Share, Plus, MoreVertical, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "pwa-install-prompt-dismissed";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
}

export function InstallPrompt({ force = false }: { force?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const p = detectPlatform();
    // For forced contexts (e.g. landing page for guests), default to iOS
    // instructions on unknown platforms so desktop visitors still see guidance.
    setPlatform(force && p === "other" ? "ios" : p);

    if (isStandalone()) return;
    if (!force && typeof window !== "undefined" && window.location.pathname.startsWith("/auth")) return;
    if (!force && localStorage.getItem(STORAGE_KEY)) return;
    if (!force && p === "other") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Slight delay so it doesn't appear instantly on load
    const t = setTimeout(() => setOpen(true), 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(t);
    };
  }, [force]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const installNative = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-background rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl animate-slide-in-up">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="eyebrow opacity-60 mb-1">Installera</p>
            <h2 className="font-serif text-2xl text-primary leading-tight">
              Lägg till <span className="italic">Gut Feeling</span> på hemskärmen
            </h2>
          </div>
          <button
            onClick={dismiss}
            aria-label="Stäng"
            className="p-2 -mr-2 -mt-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          Få snabb tillgång till din coach, dagbok och recept – direkt från din hemskärm.
        </p>

        {platform === "ios" && (
          <ol className="space-y-3 mb-6">
            <li className="flex items-center gap-3 text-sm">
              <span className="flex-none w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs">
                1
              </span>
              <span className="flex-1">
                Tryck på <span className="font-medium">menyikonen</span> i Safaris adressfält
              </span>
              <Menu className="h-5 w-5 text-primary" />
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="flex-none w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs">
                2
              </span>
              <span className="flex-1">
                Tryck på <span className="font-medium">Dela</span>-ikonen
              </span>
              <Share className="h-5 w-5 text-primary" />
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="flex-none w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs">
                3
              </span>
              <span className="flex-1">
                Välj <span className="font-medium">Lägg till på hemskärmen</span>
              </span>
              <Plus className="h-5 w-5 text-primary" />
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="flex-none w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs">
                4
              </span>
              <span className="flex-1">
                Tryck <span className="font-medium">Lägg till</span> – klart!
              </span>
            </li>
          </ol>
        )}

        {platform === "android" && (
          <ol className="space-y-3 mb-6">
            <li className="flex items-center gap-3 text-sm">
              <span className="flex-none w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs">
                1
              </span>
              <span className="flex-1">
                Tryck på <span className="font-medium">menyn</span> i webbläsaren
              </span>
              <MoreVertical className="h-5 w-5 text-primary" />
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="flex-none w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs">
                2
              </span>
              <span className="flex-1">
                Välj <span className="font-medium">Installera app</span> eller{" "}
                <span className="font-medium">Lägg till på startskärmen</span>
              </span>
              <Plus className="h-5 w-5 text-primary" />
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="flex-none w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs">
                3
              </span>
              <span className="flex-1">
                Bekräfta <span className="font-medium">Installera</span> – klart!
              </span>
            </li>
          </ol>
        )}

        <div className="flex flex-col gap-2">
          {deferredPrompt && platform === "android" && (
            <Button onClick={installNative} className="w-full h-12 rounded-full">
              Installera nu
            </Button>
          )}
          <Button
            onClick={dismiss}
            variant="ghost"
            className="w-full h-11 rounded-full text-muted-foreground"
          >
            Inte nu
          </Button>
        </div>
      </div>
    </div>
  );
}
