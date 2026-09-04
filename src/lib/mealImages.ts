import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Meal photos live in the private `meal-photos` storage bucket.
// nutrition_entries.image_url stores either:
//   - "storage:meal-photos/<path>"  (new, tiny)
//   - a legacy base64 data URL       (huge, being migrated away)
const BUCKET = "meal-photos";
const PREFIX = "storage:meal-photos/";

export function isStorageMealImage(value?: string | null): boolean {
  return !!value && value.startsWith(PREFIX);
}

export function mealImagePath(value: string): string {
  return value.slice(PREFIX.length);
}

// Upload a base64 data URL to storage and return the stored reference.
// Non-data URLs (already-storage refs or http URLs) pass through unchanged.
export async function uploadMealImage(
  userId: string,
  dataUrl: string
): Promise<string> {
  if (!dataUrl.startsWith("data:")) return dataUrl;

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });

    if (error) {
      console.error("Meal image upload failed:", error);
      return dataUrl; // fall back to base64 so the photo is never lost
    }
    return PREFIX + path;
  } catch (e) {
    console.error("Meal image upload failed:", e);
    return dataUrl;
  }
}

const SIGNED_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days (max)
const signedCache = new Map<string, { url: string; expiresAt: number }>();

// Resolve any stored image value to a displayable URL.
export async function resolveMealImageUrl(value?: string | null): Promise<string | null> {
  if (!value) return null;
  if (!isStorageMealImage(value)) return value;

  const path = mealImagePath(value);
  const hit = signedCache.get(path);
  if (hit && hit.expiresAt > Date.now() + 5 * 60_000) return hit.url;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error("Could not sign meal image:", error);
    return null;
  }
  signedCache.set(path, {
    url: data.signedUrl,
    expiresAt: Date.now() + SIGNED_TTL_SECONDS * 1000,
  });
  return data.signedUrl;
}

// React hook: resolves storage refs to signed URLs, passes everything else through.
export function useMealImage(value?: string | null): string | null {
  const [resolved, setResolved] = useState<string | null>(
    value && !isStorageMealImage(value) ? value : null
  );

  useEffect(() => {
    let active = true;
    if (!value) {
      setResolved(null);
      return;
    }
    if (!isStorageMealImage(value)) {
      setResolved(value);
      return;
    }
    resolveMealImageUrl(value).then((url) => {
      if (active) setResolved(url);
    });
    return () => {
      active = false;
    };
  }, [value]);

  return resolved;
}
