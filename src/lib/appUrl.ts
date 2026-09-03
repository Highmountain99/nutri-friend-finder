// Canonical public URL for the app. Share links (invites, etc.) should point at
// the published app. In the preview we fall back to the current origin so links
// stay testable.
const PUBLISHED_URL = "https://nutri-friend-finder.lovable.app";

function resolveBaseUrl(): string {
  if (typeof window === "undefined") return PUBLISHED_URL;
  const origin = window.location.origin;
  // Preview/sandbox origins should use their own origin so the link works there.
  if (origin.includes("localhost") || origin.includes("id-preview--")) return origin;
  return origin.startsWith("http") ? origin : PUBLISHED_URL;
}

export const APP_BASE_URL = resolveBaseUrl();
