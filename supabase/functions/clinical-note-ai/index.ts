import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const { areaId, areaTitle, formData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = areaPrompts[areaId] || areaPrompts.heart_health;
    const userPrompt = `Behandlingsområde: ${areaTitle}\n\nPatientdata:\n${JSON.stringify(formData, null, 2)}\n\nAnalysera och returnera strukturerad output.`;

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
              description: "Return clinical suggestions for the dietitian",
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
