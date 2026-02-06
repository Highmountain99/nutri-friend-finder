import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IntakeProfile {
  unified_concern_category: string | null;
  primary_concern_category: string | null;
  primary_concern_subcategory: string | null;
  activity_level: string | null;
  support_areas: string[] | null;
  concern_tags: string[] | null;
}

function buildSystemPrompt(profile: IntakeProfile | null, dietitianName: string): string {
  const concernCategory = profile?.unified_concern_category || profile?.primary_concern_category || "allmän hälsa";
  const subcategory = profile?.primary_concern_subcategory || "";
  const activityLevel = profile?.activity_level || "okänd";
  const supportAreas = profile?.support_areas?.join(", ") || "ej specificerat";
  const concernTags = profile?.concern_tags?.join(", ") || "";

  // Build treatment context based on concern category
  let treatmentContext = "";
  switch (concernCategory) {
    case "gut_health":
      treatmentContext = `
BEHANDLINGSKONTEXT: Tarmhälsa/IBS
- Patienten kan genomgå FODMAP-elimination eller annan tarmbehandling
- Du kan svara på frågor om: godkända/icke-godkända livsmedel, portionsstorlekar, elimineringsfaser
- Vanliga frågor: laktosfri mjölk (JA, okej), glutenfritt (beror på), lök/vitlök (NEJ i eliminering)`;
      break;
    case "weight_loss":
      treatmentContext = `
BEHANDLINGSKONTEXT: Viktnedgång
- Fokus på hållbar viktminskning och bättre matvanor
- Du kan svara på frågor om: kalorideficit, proteinintag, måltidsplanering
- Undvik: extrema dieter, snabba lösningar`;
      break;
    case "diabetes":
      treatmentContext = `
BEHANDLINGSKONTEXT: Diabetes
- Fokus på blodsockerkontroll och kolhydrathantering
- Du kan svara på frågor om: GI-värden, kolhydraträkning, måltidsfördelning
- Eskalera vid: insulinjusteringar, medicinfrågor`;
      break;
    case "eating_disorder":
    case "emotional_eating":
      treatmentContext = `
BEHANDLINGSKONTEXT: Ätstörning/Emotionellt ätande
- Extra varsam och stöttande ton
- Fokus på relationen till mat, inte kalorier
- Eskalera vid: ångest kring mat, skuldkänslor, restriktivt beteende`;
      break;
    case "heart_health":
      treatmentContext = `
BEHANDLINGSKONTEXT: Hjärthälsa
- Fokus på hjärtvänlig kost, saltreduktion, fiberintag
- Du kan svara på frågor om: omega-3, nötter, grönsaker
- Eskalera vid: bröstsmärtor, andfåddhet`;
      break;
    case "womens_health":
      treatmentContext = `
BEHANDLINGSKONTEXT: Kvinnohälsa
- Kan inkludera graviditet, PCOS, klimakteriet
- Du kan svara på allmänna näringsfrågor
- Eskalera vid: graviditetsspecifika frågor, hormonella bekymmer`;
      break;
    default:
      treatmentContext = `
BEHANDLINGSKONTEXT: Allmän hälsa
- Fokus på balanserad kost och goda matvanor
- Du kan svara på allmänna näringsfrågor`;
  }

  return `Du är EatSuite Assistenten, en AI-assistent för EatSuite som hjälper patienter med dietistfrågor. Du är varm, stöttande och kunnig.

PATIENTENS PROFIL:
- Huvudområde: ${concernCategory}${subcategory ? ` (${subcategory})` : ""}
- Aktivitetsnivå: ${activityLevel}
- Stödområden: ${supportAreas}
${concernTags ? `- Intresseområden: ${concernTags}` : ""}
${treatmentContext}

RIKTLINJER FÖR DINA SVAR:
1. Svara ALLTID på svenska
2. Var varm och stöttande, aldrig uppfordrande eller dömande
3. Ge konkreta, praktiska råd när det är möjligt
4. Håll svaren lagom korta men informativa (2-4 meningar vanligtvis)
5. Använd gärna emojis sparsamt för att vara vänlig 🌿

ESKALERING - Eskalera ALLTID till dietisten ${dietitianName} när:
- Patienten nämner: blod, kraftig smärta, yrsel, svimning, kraftig viktnedgång
- Patienten uttrycker stark oro eller ångest
- Frågan handlar om mediciner eller dosering
- Du är osäker på svaret
- Patienten explicit ber om att prata med dietisten

När du eskalerar, svara med medkänsla och förklara att du kopplar på dietisten.

EXEMPEL PÅ BRA SVAR:
Fråga: "Kan jag äta laktosfri mjölk på FODMAP?"
Svar: "Ja, laktosfri mjölk fungerar utmärkt under FODMAP-eliminering! 🥛 Laktos är den FODMAP som tas bort i laktosfria produkter, så du kan dricka den utan problem."

EXEMPEL PÅ ESKALERING:
Fråga: "Jag har haft blod i avföringen och ont i magen hela veckan"
Svar: "Jag förstår att du är orolig, och det är viktigt att vi tar det här på allvar. Det du beskriver behöver bedömas av ${dietitianName} så snart som möjligt. Jag har skickat ditt meddelande till hen direkt. ❤️"`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize input to prevent prompt injection
    const sanitizedMessage = message.trim().slice(0, 2000);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create client with user's token for auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Create service role client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's intake profile for context
    const { data: intakeProfile } = await supabaseService
      .from("intake_profiles")
      .select("unified_concern_category, primary_concern_category, primary_concern_subcategory, activity_level, support_areas, concern_tags")
      .eq("user_id", userId)
      .single();

    // Fetch the user's dietitian from appointments
    const { data: appointment } = await supabaseService
      .from("appointments")
      .select("dietitian_id, dietitian_profiles(first_name, last_name)")
      .eq("user_id", userId)
      .eq("status", "booked")
      .order("appointment_date", { ascending: true })
      .limit(1)
      .single();

    const dietitianName = appointment?.dietitian_profiles 
      ? `${(appointment.dietitian_profiles as any).first_name} ${(appointment.dietitian_profiles as any).last_name}`
      : "din dietist";

    // Save user message to database
    await supabaseService.from("chat_messages").insert({
      user_id: userId,
      sender: "user",
      content: sanitizedMessage,
      conversation_type: "ai"
    });

    // Build messages array for AI
    const systemPrompt = buildSystemPrompt(intakeProfile, dietitianName);
    
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt }
    ];

    // Add conversation history if provided (limit to last 10 messages for context)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        if (msg.sender === "user") {
          messages.push({ role: "user", content: msg.content });
        } else if (msg.sender === "ai") {
          messages.push({ role: "assistant", content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: sanitizedMessage });

    // Call Lovable AI Gateway with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Servern är upptagen just nu. Försök igen om en stund." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-tjänsten är tillfälligt otillgänglig." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Ett fel uppstod. Försök igen." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a TransformStream to collect the full response while streaming
    let fullResponse = "";
    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        // Parse SSE to extract content
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
              }
            } catch {
              // Ignore parsing errors for partial chunks
            }
          }
        }
        controller.enqueue(chunk);
      },
      async flush() {
        // Save AI response to database after streaming completes
        if (fullResponse.trim()) {
          // Check for escalation keywords in the response
          const escalationKeywords = ["dietist", "kopplat på", "skickat ditt meddelande", "återkommer"];
          const isEscalated = escalationKeywords.some(keyword => 
            fullResponse.toLowerCase().includes(keyword.toLowerCase())
          );

          await supabaseService.from("chat_messages").insert({
            user_id: userId,
            sender: "ai",
            content: fullResponse.trim(),
            conversation_type: "ai",
            escalated: isEscalated,
            escalation_reason: isEscalated ? "AI detected need for dietitian involvement" : null
          });
        }
      }
    });

    // Pipe the response through our transform
    response.body?.pipeTo(writable);

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
