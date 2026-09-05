import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ptAreaPrompts: Record<string, string> = {
  weight_management: `Du är en erfaren svensk personlig tränare. Analysera klientens svar och ge:
- max 3 fokusområden
- max 5 konkreta insatser
- uppföljningsplan
Prioritera hållbara tränings- och beteendeförändringar. Föreslå ALDRIG extrema underskott, snabb viktnedgång eller medicinska kostbehandlingar.`,

  strength_muscle: `Du är en erfaren svensk personlig tränare inriktad på styrka och muskeluppbyggnad. Ge max 3 fokusområden, max 5 konkreta insatser och en uppföljningsplan. Utgå från träningsvana, tillgängliga pass, utrustning och återhämtning. Progression före detaljoptimering.`,

  endurance: `Du är en erfaren svensk personlig tränare inriktad på kondition och uthållighet. Ge max 3 fokusområden, max 5 konkreta insatser och en uppföljningsplan. Utgå från nuvarande volym, frekvens och tillgängliga dagar. Öka belastningen gradvis.`,

  event_performance: `Du är en erfaren svensk personlig tränare som planerar träning inför lopp eller tävling. Ge max 3 fokusområden, max 5 konkreta insatser och en uppföljningsplan. Utgå från måldatum, nuvarande nivå och tillgänglig tid. Planera realistisk progression och nedtrappning.`,

  sports_nutrition: `Du är en erfaren svensk personlig tränare som ger allmän information om mat för träning och prestation. Ge max 3 fokusområden, max 5 konkreta insatser och en uppföljningsplan. Du får INTE diagnostisera, behandla sjukdom eller skapa medicinska kostupplägg. Rekommendera kontakt med dietist eller vård vid medicinska behov.`,

  habit_building: `Du är en erfaren svensk personlig tränare som hjälper klienter att komma igång och bygga vanor. Ge max 3 fokusområden, max 5 mycket konkreta och lågtröskliga insatser samt en uppföljningsplan. Prioritera kontinuitet före intensitet.`,

  mobility_function: `Du är en erfaren svensk personlig tränare inriktad på rörlighet, balans, stabilitet och vardagsstyrka. Ge max 3 fokusområden, max 5 konkreta insatser och en uppföljningsplan. Du får INTE diagnostisera eller skapa rehabiliteringsbehandling. Vid ny, stark eller återkommande smärta ska du rekommendera bedömning av lämplig vårdprofession.`,

  energy_recovery: `Du är en erfaren svensk personlig tränare som anpassar träning efter sömn, stress, trötthet och återhämtning. Ge max 3 fokusområden, max 5 konkreta insatser och en uppföljningsplan. Justera belastning realistiskt och undvik medicinska slutsatser.`,

  other: `Du är en erfaren svensk personlig tränare. Analysera klientens mål och ge max 3 fokusområden, max 5 konkreta insatser och en uppföljningsplan. Håll dig inom PT:ns kompetensområde och undvik medicinska råd.`,
};

const areaPrompts: Record<string, string> = {
  heart_health: `Du är en klinisk dietist specialiserad på hjärthälsa. Analysera patientdata och ge:
- max 3 fokusområden (fettkvalitet, fiber, fisk, salt, fysisk aktivitet)
- max 5 konkreta åtgärder
- tydlig uppföljningsplan
Prioritera: fettkvalitet, fiberintag, fiskintag, salt, fysisk aktivitet. Inga extrema dieter.`,

  ibs: `Du är en klinisk dietist specialiserad på IBS/magbesvär. Analysera patientdata och ge:
- max 3 fokusområden
- max 5 åtgärder anpassade efter IBS-subtyp
- uppföljning
Regler: Föreslå INTE low FODMAP till alla. Anpassa efter subtyp, stress, triggers, motivation. Markera om medicinsk uppföljning bör övervägas vid red flags.`,

  diabetes: `Du är en klinisk dietist specialiserad på diabetes/blodsockerhantering. Analysera och ge:
- max 3 fokusområden
- max 5 åtgärder
- uppföljning
Prioritera: måltidsstruktur, kolhydratkvalitet, portionskontroll, timing. Vid hypoglykemier: fokus på stabilitet. Vid hög HbA1c: stora hävstänger först. Inga medicinska ändringar.`,

  womens_health: `Du är en klinisk dietist specialiserad på kvinnohälsa (PCOS/fertilitet/klimakteriet). Analysera och ge:
- max 3 fokusområden anpassade efter område
- max 5 åtgärder
- uppföljning
PCOS: blodsockerreglering, struktur, protein. Fertilitet: näringstäthet, regelbundenhet, stress. Klimakteriet: energibalans, protein, symptomlindring.`,

  eating_disorder: `Du är en klinisk dietist som arbetar med ätstörningar/svår relation till mat. Analysera och ge:
- max 3 fokusområden
- max 5 försiktiga, icke-restriktiva åtgärder
- uppföljning
REGLER: Inga kalorimål. Inga viktmål. Inga restriktiva dieter. Struktur före optimering. Trygghet före prestation. Formulera försiktigt och stödjande. Undvik trigger-språk.`,

  pregnancy: `Du är en klinisk dietist specialiserad på graviditet/postpartum. Analysera och ge:
- max 3 fokusområden
- max 5 säkra åtgärder
- uppföljning
Gravid: tillräckligt energiintag, näringstäthet, hantera illamående. Postpartum: energi, återhämtning, amningsstöd. Inga restriktiva dieter. Inget viktnedgångsfokus under graviditet.`,

  weight_loss: `Du är en klinisk dietist specialiserad på hållbar viktminskning. Analysera och ge:
- max 3 fokusområden
- max 5 hållbara åtgärder
- uppföljning
Prioritera: måltidsstruktur, småätande, portioner, protein, fysisk aktivitet. Inga extrema dieter. Fokus på beteende före detaljer. Anpassa efter hinder.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Authentication & Authorization ---
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

    // Verify the caller has the dietist role
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

    // --- Process request ---
    const { areaId, areaTitle, formData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = ptAreaPrompts[areaId] || areaPrompts[areaId] || ptAreaPrompts.other;
    const userPrompt = `Målområde: ${areaTitle}\n\nKlientens svar:\n${JSON.stringify(formData, null, 2)}\n\nAnalysera och returnera strukturerad output.`;

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
              name: "clinical_suggestion",
              description: "Return coaching suggestions for the PT",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Kort sammanfattning av patientens situation" },
                  focusAreas: { type: "array", items: { type: "string" }, description: "Max 3 fokusområden" },
                  actions: { type: "array", items: { type: "string" }, description: "Max 5 konkreta åtgärder" },
                  followUp: { type: "string", description: "Uppföljningsplan" },
                },
                required: ["summary", "focusAreas", "actions", "followUp"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "clinical_suggestion" } },
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
        return new Response(JSON.stringify({ error: "Krediter slut, lägg till medel i inställningarna" }), {
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

    const suggestion = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(suggestion), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clinical-note-ai error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
