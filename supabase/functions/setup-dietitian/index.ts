import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller's identity via JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = data.claims.sub as string;
    const { userId, firstName, lastName, inviteCode } = await req.json();

    if (!userId || !firstName || !lastName) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only allow users to set up their own dietitian profile
    if (userId !== callerId) {
      return new Response(JSON.stringify({ error: "You can only set up your own dietitian profile" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate invite code — required for self-registration
    if (!inviteCode) {
      return new Response(JSON.stringify({ error: "Inbjudningskod krävs" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("dietitian_invite_codes")
      .select("*")
      .eq("code", inviteCode.trim().toLowerCase())
      .is("used_by", null)
      .maybeSingle();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ error: "Ogiltig eller redan använd inbjudningskod" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Inbjudningskoden har gått ut" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent re-assignment if user already has the dietist role
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "dietist")
      .maybeSingle();

    if (existingRole) {
      return new Response(JSON.stringify({ success: true, message: "Already a dietitian" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark invite code as used
    const { error: markError } = await supabaseAdmin
      .from("dietitian_invite_codes")
      .update({ used_by: userId, used_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (markError) {
      console.error("Failed to mark invite as used:", markError);
      return new Response(JSON.stringify({ error: "Kunde inte använda inbjudningskoden" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert dietist role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "dietist" }, { onConflict: "user_id,role" });

    if (roleError) {
      console.error("Role error:", roleError);
      return new Response(JSON.stringify({ error: "Failed to assign role" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert dietitian profile
    const { error: profileError } = await supabaseAdmin
      .from("dietitian_profiles")
      .upsert(
        {
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          title: "Legitimerad dietist",
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      console.error("Profile error:", profileError);
      return new Response(JSON.stringify({ error: "Failed to create profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
