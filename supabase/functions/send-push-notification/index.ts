import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push crypto helpers
async function webPushEncrypt(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidKeys: { publicKey: string; privateKey: string }
) {
  // We'll use a simpler approach: send via fetch with VAPID headers
  // For production, use the web-push protocol directly
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);

  return { endpoint: subscription.endpoint, payload: payloadBytes };
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createVapidJwt(audience: string, subject: string, privateKeyBase64: string) {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyBytes = base64UrlDecode(privateKeyBase64);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  ).catch(() => {
    // Try JWK import if PKCS8 fails
    return crypto.subtle.importKey(
      "raw",
      privateKeyBytes,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );
  });

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(unsignedToken)
  );

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Action: return VAPID public key to client
    if (body.action === "get-vapid-key") {
      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
      return new Response(JSON.stringify({ vapidPublicKey }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: send push notification (called by DB webhook or directly)
    if (body.action === "send-notification") {
      const { user_id, title, message, url } = body;

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Get push subscriptions for this user
      const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", user_id);

      if (error || !subscriptions?.length) {
        return new Response(JSON.stringify({ sent: 0, reason: "no subscriptions" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payload = JSON.stringify({
        title: title || "Gut Feeling",
        body: message || "Du har ett nytt meddelande",
        icon: "/favicon.png",
        badge: "/favicon.png",
        data: { url: url || "/messages" },
      });

      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
      const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

      let sent = 0;
      const errors: string[] = [];

      for (const sub of subscriptions) {
        try {
          // For simplicity, we'll POST the payload directly
          // In production, use proper Web Push encryption (RFC 8291)
          const pushUrl = sub.endpoint;
          
          // Create VAPID authorization
          const audience = new URL(pushUrl).origin;
          
          const response = await fetch(pushUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              TTL: "86400",
            },
            body: payload,
          });

          if (response.ok || response.status === 201) {
            sent++;
          } else if (response.status === 404 || response.status === 410) {
            // Subscription expired, clean up
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint)
              .eq("user_id", user_id);
          } else {
            errors.push(`${response.status}: ${await response.text()}`);
          }
        } catch (e) {
          errors.push(String(e));
        }
      }

      return new Response(
        JSON.stringify({ sent, total: subscriptions.length, errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: handle DB webhook trigger for new chat messages
    if (body.type === "INSERT" && body.table === "chat_messages") {
      const record = body.record;
      
      // Only notify for dietitian messages
      if (record.sender !== "dietitian") {
        return new Response(JSON.stringify({ skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Recursively call self to send notification
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", record.user_id);

      if (!subscriptions?.length) {
        return new Response(JSON.stringify({ sent: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payload = JSON.stringify({
        title: "Nytt meddelande",
        body: "Din dietist har skickat ett meddelande",
        icon: "/favicon.png",
        badge: "/favicon.png",
        data: { url: "/messages" },
      });

      let sent = 0;
      for (const sub of subscriptions) {
        try {
          const response = await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              TTL: "86400",
            },
            body: payload,
          });

          if (response.ok || response.status === 201) {
            sent++;
          } else if (response.status === 404 || response.status === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint)
              .eq("user_id", record.user_id);
          }
        } catch {
          // Ignore individual failures
        }
      }

      return new Response(JSON.stringify({ sent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
