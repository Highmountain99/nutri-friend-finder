import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authorization required",
  CONFIG: "Service temporarily unavailable",
  EXTERNAL_SERVICE: "Unable to generate token. Please try again.",
  UNKNOWN: "An unexpected error occurred. Please try again.",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate JWT using Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("[elevenlabs-scribe-token] Invalid JWT:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      console.error("[elevenlabs-scribe-token] ELEVENLABS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.CONFIG }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[elevenlabs-scribe-token] ElevenLabs API error:", {
        status: response.status,
        body: errorText,
      });
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.EXTERNAL_SERVICE }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify({ token: data.token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[elevenlabs-scribe-token] Error:", {
      message: error instanceof Error ? error.message : "Unknown",
      timestamp: new Date().toISOString(),
    });
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.UNKNOWN }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
