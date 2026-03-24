import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { appointmentId, devMode } = await req.json();
    const authHeader = req.headers.get("Authorization");

    // Always require authentication first
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dev mode: create a temporary room (auth required, no appointment needed)
    if (devMode) {
      const wherebyKey = Deno.env.get("WHEREBY_API_KEY");
      if (!wherebyKey) {
        return new Response(
          JSON.stringify({ error: "WHEREBY_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const endDate = new Date(Date.now() + 60 * 60 * 1000);
      const wherebyRes = await fetch("https://api.whereby.dev/v1/meetings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${wherebyKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endDate: endDate.toISOString(),
          fields: ["hostRoomUrl"],
        }),
      });

      if (!wherebyRes.ok) {
        const errBody = await wherebyRes.text();
        console.error("Whereby API error:", wherebyRes.status, errBody);
        return new Response(
          JSON.stringify({ error: `Whereby API error: ${wherebyRes.status}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const wherebyData = await wherebyRes.json();
      return new Response(
        JSON.stringify({ roomUrl: wherebyData.roomUrl, hostRoomUrl: wherebyData.hostRoomUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Normal flow below: require auth + appointmentId ---
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!appointmentId) {
      return new Response(JSON.stringify({ error: "appointmentId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      console.error("Auth error:", userErr?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const { data: appointment, error: aptErr } = await supabase
      .from("appointments")
      .select("id, appointment_date, user_id, dietitian_id, status, notes")
      .eq("id", appointmentId)
      .single();

    if (aptErr || !appointment) {
      return new Response(JSON.stringify({ error: "Appointment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is either the patient or the dietitian
    let isAuthorized = appointment.user_id === userId;
    if (!isAuthorized && appointment.dietitian_id) {
      const { data: dp } = await supabase
        .from("dietitian_profiles")
        .select("user_id")
        .eq("id", appointment.dietitian_id)
        .single();
      isAuthorized = dp?.user_id === userId;
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if room URL is already stored in notes as JSON
    if (appointment.notes) {
      try {
        const notesData = JSON.parse(appointment.notes);
        if (notesData.wherebyRoomUrl) {
          return new Response(
            JSON.stringify({ roomUrl: notesData.wherebyRoomUrl, hostRoomUrl: notesData.wherebyHostRoomUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        // notes is plain text, not JSON
      }
    }

    // Create a Whereby meeting room
    const wherebyKey = Deno.env.get("WHEREBY_API_KEY");
    if (!wherebyKey) {
      return new Response(
        JSON.stringify({ error: "WHEREBY_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const endDate = new Date(
      new Date(appointment.appointment_date).getTime() + 60 * 60 * 1000
    );

    const wherebyRes = await fetch("https://api.whereby.dev/v1/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${wherebyKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endDate: endDate.toISOString(),
        fields: ["hostRoomUrl"],
      }),
    });

    if (!wherebyRes.ok) {
      const errBody = await wherebyRes.text();
      console.error("Whereby API error:", wherebyRes.status, errBody);
      return new Response(
        JSON.stringify({ error: `Whereby API error: ${wherebyRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wherebyData = await wherebyRes.json();
    const roomUrl = wherebyData.roomUrl;
    const hostRoomUrl = wherebyData.hostRoomUrl;

    // Store room URL in appointment notes using service role
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient
      .from("appointments")
      .update({ notes: JSON.stringify({ wherebyRoomUrl: roomUrl, wherebyHostRoomUrl: hostRoomUrl }) })
      .eq("id", appointmentId);

    return new Response(
      JSON.stringify({ roomUrl, hostRoomUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error creating video room:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
