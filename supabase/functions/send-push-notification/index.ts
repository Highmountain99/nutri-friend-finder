import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Action: return VAPID public key to client
    if (body.action === "get-vapid-key") {
      const vapidPublicKey = (Deno.env.get("VAPID_PUBLIC_KEY") || "").replace(/^["']+|["']+$/g, "").trim();
      return new Response(JSON.stringify({ vapidPublicKey }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: send push notification
    const { user_id, title, message, url } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      "mailto:hello@gutfeeling.se",
      vapidPublicKey,
      vapidPrivateKey
    );

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get push subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", user_id);

    if (error || !subscriptions?.length) {
      return new Response(
        JSON.stringify({ sent: 0, reason: "no subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title: title || "Gut Feeling",
      body: message || "Du har ett nytt meddelande",
      icon: "/favicon.png",
      badge: "/favicon.png",
      data: { url: url || "/messages" },
    });

    let sent = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
      } catch (e: any) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          // Subscription expired, clean up
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint)
            .eq("user_id", user_id);
        } else {
          errors.push(`${e.statusCode || "?"}: ${e.body || String(e)}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ sent, total: subscriptions.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Push notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
