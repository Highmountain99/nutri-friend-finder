import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub as string;
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify dietist role
    const { data: isDietist } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", callerId)
      .eq("role", "dietist")
      .maybeSingle();

    if (!isDietist) {
      return new Response(JSON.stringify({ error: "Forbidden: dietist role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { patientId } = await req.json();
    if (!patientId) throw new Error("patientId is required");

    // Verify assignment
    const { data: assignment } = await supabaseAdmin
      .from("dietist_patient_assignments")
      .select("id")
      .eq("dietist_id", callerId)
      .eq("patient_id", patientId)
      .maybeSingle();

    if (!assignment) {
      return new Response(JSON.stringify({ error: "Forbidden: not assigned to this patient" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all journal entries for this patient
    const { data: journalEntries, error: journalError } = await supabaseAdmin
      .from("dietitian_journal_entries")
      .select("anamnesis, assessment, action, next_steps, area_type, form_data, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true });

    if (journalError) throw journalError;

    if (!journalEntries || journalEntries.length === 0) {
      return new Response(JSON.stringify({ error: "Inga journalanteckningar finns för denna patient. Skapa minst en journalanteckning innan du genererar en behandlingsplan." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build journal summary for AI
    const journalSummary = journalEntries.map((entry, i) => {
      const parts: string[] = [];
      parts.push(`--- Anteckning ${i + 1} (${entry.created_at?.split("T")[0] || "okänt datum"})${entry.area_type ? ` [${entry.area_type}]` : ""} ---`);
      if (entry.anamnesis) parts.push(`Anamnes: ${entry.anamnesis}`);
      if (entry.assessment) parts.push(`Bedömning: ${entry.assessment}`);
      if (entry.action) parts.push(`Åtgärd: ${entry.action}`);
      if (entry.next_steps) parts.push(`Nästa steg: ${entry.next_steps}`);
      return parts.join("\n");
    }).join("\n\n");

    const systemPrompt = `Du är en klinisk dietist-assistent som hjälper dietister att skapa behandlingsplaner.

VIKTIGA REGLER:
- Du ska ENBART basera behandlingsplanen på informationen i journalanteckningarna nedan.
- Du får INTE anta, gissa eller lägga till information som inte finns i journalen.
- Du får INTE ge generiska råd utan stöd i journalanteckningarna.
- Behandlingsplanen ska bygga på dokumenterade symptom, beteenden, mål, hinder, tidigare åtgärder och mönster.
- Alla texter ska vara på svenska, professionella och stödjande.
- Titeln ska vara en kort, konkret beskrivning av behandlingens fokus, t.ex. "Förbättra relation till mat och minska hetsätning" eller "Stabilisera måltidsstruktur och hantera stress". ALDRIG generiska titlar som "Behandlingsplan" eller "Plan baserad på journal".
- Beskrivningen ska vara en kort sammanfattning av planens konkreta inriktning och fokusområden. Nämn ALDRIG att underlaget är begränsat, att det finns få anteckningar, eller liknande meta-kommentarer om datamängd.
- Anpassa antalet mål efter vad journalen faktiskt stödjer (1-4 mål).

Svara ENBART med tool call, aldrig med fritext.`;

    const userPrompt = `Skapa en behandlingsplan baserad ENBART på följande journalanteckningar:

${journalSummary}

Instruktioner:
- Utgå BARA från det som dokumenterats. Lägg inte till mål eller åtgärder som saknar stöd i anteckningarna.
- Varje mål ska ha 2-4 konkreta delmål som är direkt kopplade till journalinnehållet.
- Planera datumspann på 8-12 veckor framåt från idag (${new Date().toISOString().split("T")[0]}).
- Titeln ska beskriva det konkreta behandlingsfokuset, inte vara generisk.
- Beskriv INTE i texten hur många anteckningar som finns eller om underlaget är begränsat.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_treatment_plan",
              description: "Return a structured treatment plan suggestion based on journal entries.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Kort titel för behandlingsplanen" },
                  description: { type: "string", description: "Kort sammanfattning av planens konkreta inriktning och fokusområden. Ingen meta-kommentar om datamängd." },
                  goals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        planned_start: { type: "string", description: "ISO date YYYY-MM-DD" },
                        planned_end: { type: "string", description: "ISO date YYYY-MM-DD" },
                        milestones: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["title", "description", "milestones"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "description", "goals"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_treatment_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "För många förfrågningar, försök igen om en stund." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-krediter slut. Fyll på i Lovable-inställningar." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const plan = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-treatment-plan error:", e);
    return new Response(JSON.stringify({ error: "Något gick fel. Försök igen senare." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
