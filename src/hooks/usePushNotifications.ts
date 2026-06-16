import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// VAPID public key - fetched from edge function
async function getVapidPublicKey(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: { action: "get-vapid-key" },
    });
    if (error) throw error;
    return data?.vapidPublicKey ?? null;
  } catch {
    console.error("Failed to fetch VAPID public key");
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const hasSubscribed = useRef(false);

  useEffect(() => {
    if (!user || hasSubscribed.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // iOS only allows web push when the PWA is installed to the home screen
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isIOS && !isStandalone) return;

    const subscribe = async () => {
      try {
        // Register dedicated push service worker (push-only, no app-shell cache)
        const registration =
          (await navigator.serviceWorker.getRegistration("/push-sw.js")) ||
          (await navigator.serviceWorker.register("/push-sw.js", { scope: "/" }));

        // Wait until it's active
        if (!registration.active) {
          await new Promise<void>((resolve) => {
            const sw = registration.installing || registration.waiting;
            if (!sw) return resolve();
            sw.addEventListener("statechange", () => {
              if (sw.state === "activated") resolve();
            });
          });
        }

        // Check existing subscription
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          hasSubscribed.current = true;
          await saveSubscription(existing, user.id);
          return;
        }

        // Request permission
        if (Notification.permission === "denied") return;
        const permission =
          Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();
        if (permission !== "granted") return;

        const vapidKey = await getVapidPublicKey();
        if (!vapidKey) return;

        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });

        await saveSubscription(subscription, user.id);
        hasSubscribed.current = true;
      } catch (err) {
        console.error("Push subscription failed:", err);
      }
    };

    // Delay slightly to not block initial render
    const timeout = setTimeout(subscribe, 3000);
    return () => clearTimeout(timeout);
  }, [user]);
}


async function saveSubscription(subscription: PushSubscription, userId: string) {
  const json = subscription.toJSON();
  const endpoint = json.endpoint!;
  const p256dh = json.keys!.p256dh!;
  const auth = json.keys!.auth!;

  await supabase.from("push_subscriptions").upsert(
    { user_id: userId, endpoint, p256dh, auth, updated_at: new Date().toISOString() },
    { onConflict: "user_id,endpoint" }
  );
}
