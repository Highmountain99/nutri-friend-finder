import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Slim, non-intrusive offline indicator. Sits below the status bar / notch so
 * it stays readable inside a Capacitor iOS WebView.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine === false : false
  );

  useEffect(() => {
    const online = () => setOffline(false);
    const goneOffline = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", goneOffline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", goneOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground text-center text-xs font-medium px-4 pb-1.5 pt-[calc(env(safe-area-inset-top)+0.375rem)]"
    >
      <span className="inline-flex items-center gap-1.5">
        <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
        Ingen internetanslutning — ändringar sparas inte
      </span>
    </div>
  );
}
