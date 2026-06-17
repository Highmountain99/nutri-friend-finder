import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { data: isDietist } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "dietist",
    });
    if (!isDietist) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { meals } = await req.json();
    if (!Array.isArray(meals) || meals.length === 0) {
      return new Response(JSON.stringify({ groups: [], insights: [], summary: "Inga måltider att analysera." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Aggregate by meal name + type to drastically reduce payload size
    const counts = new Map<string, { n: string; t: string; c: number; kcal: number }>();
    for (const m of meals as any[]) {
      const n = (m.meal_name ?? "").toString().slice(0, 60);
      const t = (m.meal_type ?? "").toString().slice(0, 20);
      const key = `${t}|${n.toLowerCase()}`;
      const existing = counts.get(key);
      if (existing) {
        existing.c += 1;
        existing.kcal += m.calories ?? 0;
      } else {
        counts.set(key, { n, t, c: 1, kcal: m.calories ?? 0 });
      }
    }
    const compact = Array.from(counts.values())
      .sort((a, b) => b.c - a.c)
      .slice(0, 120)
      .map((x) => ({ n: x.n, t: x.t, c: x.c, kcal: Math.round(x.kcal / x.c) }));
    const totalMeals = meals.length;

    const systemPrompt = `Du är en klinisk dietist som analyserar en patients kostdagbok.
Gruppera måltiderna i 4-7 tematiska kategorier (t.ex. "Snabba kolhydrater", "Mejeri & proteinrika frukostar", "Sötsaker & snacks", "Hemlagat varmt", "Ultraprocessat", "Frukt & grönt").
Returnera:
- groups: array av kategorier med name, count, percentage (0-100, heltal), kort exempel-lista (max 4 unika rätter), och color (en av: emerald, amber, rose, sky, violet, slate)
- insights: 3-5 korta mönster-observationer (t.ex. "Hög andel mellanmål från godis/chips på eftermiddagar")
- summary: en mening som sammanfattar matmönstret
Var konkret och icke-dömande. Skriv på svenska.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Unika rätter (${compact.length} av totalt ${totalMeals} loggade måltider). Format: n=namn, t=måltidstyp, c=antal gånger loggad, kcal=snitt:\n${JSON.stringify(compact)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "diet_patterns",
              description: "Return grouped diet patterns",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  groups: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        count: { type: "integer" },
                        percentage: { type: "integer" },
                        examples: { type: "array", items: { type: "string" } },
                        color: { type: "string", enum: ["emerald", "amber", "rose", "sky", "violet", "slate"] },
                      },
                      required: ["name", "count", "percentage", "examples", "color"],
                      additionalProperties: false,
                    },
                  },
                  insights: { type: "array", items: { type: "string" } },
                },
                required: ["summary", "groups", "insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "diet_patterns" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, försök igen om en stund" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Krediter slut" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-diet-patterns error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
