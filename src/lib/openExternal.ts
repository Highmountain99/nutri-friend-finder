/**
 * Open an external URL in a way that works both in a normal browser tab and
 * inside a Capacitor iOS WKWebView, where `window.open(url, "_blank")` is
 * frequently blocked or opens a blank webview with no way back.
 *
 * In a native shell we navigate the current webview only as a last resort;
 * when the Capacitor Browser plugin is available we use it (in-app Safari
 * view with a native "Done" button).
 */
export function isNativeShell(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  return Boolean(cap?.isNativePlatform?.() ?? cap?.isNative);
}

export async function openExternal(url: string): Promise<void> {
  if (!url) return;

  if (isNativeShell()) {
    const browser = (window as any).Capacitor?.Plugins?.Browser;
    if (browser?.open) {
      try {
        await browser.open({ url, presentationStyle: "popover" });
        return;
      } catch {
        /* fall through */
      }
    }
    window.location.href = url;
    return;
  }

  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    // Popup blocked (common in in-app webviews) — fall back to same-tab nav.
    window.location.href = url;
  }
}
