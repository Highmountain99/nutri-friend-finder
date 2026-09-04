import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "meal-photos";
const BATCH_SIZE = 25;

function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Verify caller identity
    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    let targetUserId = callerId;
    try {
      const body = await req.json();
      if (body?.patientId && body.patientId !== callerId) {
        // Only allowed if caller is the assigned dietitian or an admin
        const { data: assigned } = await admin.rpc("is_assigned_dietist", {
          patient_id: body.patientId,
        });
        const { data: isAdmin } = await admin.rpc("has_role", {
          _user_id: callerId,
          _role: "admin",
        });
        if (!assigned && !isAdmin) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        targetUserId = body.patientId;
      }
    } catch {
      // no body — migrate caller's own images
    }

    // Fetch a batch of rows still storing base64 images
    const { data: rows, error: fetchErr } = await admin
      .from("nutrition_entries")
      .select("id, image_url")
      .eq("user_id", targetUserId)
      .like("image_url", "data:%")
      .limit(BATCH_SIZE);

    if (fetchErr) throw fetchErr;

    let migrated = 0;
    const failures: string[] = [];

    for (const row of rows ?? []) {
      try {
        const dataUrl = row.image_url as string;
        const comma = dataUrl.indexOf(",");
        const meta = dataUrl.slice(5, comma); // e.g. image/jpeg;base64
        const mime = meta.split(";")[0] || "image/jpeg";
        const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
        const bytes = base64ToBytes(dataUrl.slice(comma + 1));

        const path = `${targetUserId}/${row.id}.${ext}`;
        const { error: upErr } = await admin.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType: mime, upsert: true });
        if (upErr) throw upErr;

        const { error: updErr } = await admin
          .from("nutrition_entries")
          .update({ image_url: `storage:${BUCKET}/${path}` })
          .eq("id", row.id);
        if (updErr) throw updErr;

        migrated++;
      } catch (e) {
        console.error("Failed to migrate entry", row.id, e);
        failures.push(row.id);
      }
    }

    // Remaining count
    const { count } = await admin
      .from("nutrition_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .like("image_url", "data:%");

    return new Response(
      JSON.stringify({ migrated, remaining: count ?? 0, failed: failures }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("migrate-meal-images error:", e);
    return new Response(JSON.stringify({ error: "Migration failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
