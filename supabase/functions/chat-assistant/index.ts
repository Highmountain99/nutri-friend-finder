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

interface PatientContext {
  recentMeals: Array<{ date: string; meal_type: string; meal_name: string }>;
  recentSymptoms: Array<{ date: string; description: string }>;
  savedRecipes: string[];
  healthMetrics: Array<{ type: string; value: number; unit: string; date: string }>;
  nutritionSettings: { weight_kg: number | null; height_cm: number | null; activity_level: string | null } | null;
  nutritionGoals: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null } | null;
}

function formatMealsContext(meals: PatientContext["recentMeals"]): string {
  if (meals.length === 0) return "Inga måltider loggade senaste veckan.";
  
  const grouped: Record<string, string[]> = {};
  for (const meal of meals) {
    const date = new Date(meal.date).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short" });
    if (!grouped[date]) grouped[date] = [];
    const mealTypeSv: Record<string, string> = { breakfast: "Frukost", lunch: "Lunch", dinner: "Middag", snack: "Mellanmål" };
    grouped[date].push(`${mealTypeSv[meal.meal_type] || meal.meal_type}: ${meal.meal_name || "oklart"}`);
  }
  
  return Object.entries(grouped)
    .map(([date, meals]) => `- ${date}: ${meals.join(", ")}`)
    .join("\n");
}

function formatSymptomsContext(symptoms: PatientContext["recentSymptoms"]): string {
  if (symptoms.length === 0) return "Inga symtom rapporterade senaste veckan.";
  
  return symptoms
    .map(s => {
      const date = new Date(s.date).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
      return `- ${date}: "${s.description}"`;
    })
    .join("\n");
}

function buildSystemPrompt(
  profile: IntakeProfile | null,
  dietitianName: string,
  patientContext: PatientContext
): string {
  const concernCategory = profile?.unified_concern_category || profile?.primary_concern_category || "allmän hälsa";
  const subcategory = profile?.primary_concern_subcategory || "";
  const activityLevel = profile?.activity_level || patientContext.nutritionSettings?.activity_level || "okänd";
  const supportAreas = profile?.support_areas?.join(", ") || "ej specificerat";
  const concernTags = profile?.concern_tags?.join(", ") || "";

  // Build treatment context
  let treatmentContext = "";
  switch (concernCategory) {
    case "gut_health":
      treatmentContext = `Patienten arbetar med tarmhälsa, troligtvis FODMAP-eliminering eller annan IBS-behandling.`;
      break;
    case "weight_loss":
      treatmentContext = `Patienten fokuserar på hållbar viktnedgång.`;
      break;
    case "diabetes":
      treatmentContext = `Patienten har diabetes och arbetar med blodsockerkontroll.`;
      break;
    case "eating_disorder":
    case "emotional_eating":
      treatmentContext = `Patienten arbetar med sin relation till mat. Var extra varsam och stöttande, fokusera inte på kalorier.`;
      break;
    case "heart_health":
      treatmentContext = `Patienten fokuserar på hjärthälsa.`;
      break;
    case "womens_health":
      treatmentContext = `Patienten arbetar med kvinnohälsa (kan inkludera graviditet, PCOS, klimakteriet).`;
      break;
    default:
      treatmentContext = `Patienten fokuserar på allmän hälsa och bättre matvanor.`;
  }

  // Build journal context
  const mealsContext = formatMealsContext(patientContext.recentMeals);
  const symptomsContext = formatSymptomsContext(patientContext.recentSymptoms);
  const recipesContext = patientContext.savedRecipes.length > 0
    ? patientContext.savedRecipes.join(", ")
    : "Inga sparade recept.";

  // Health data
  let healthDataContext = "";
  if (patientContext.nutritionSettings) {
    const ns = patientContext.nutritionSettings;
    const parts = [];
    if (ns.weight_kg) parts.push(`Vikt: ${ns.weight_kg} kg`);
    if (ns.height_cm) parts.push(`Längd: ${ns.height_cm} cm`);
    if (ns.activity_level) {
      const activityLabels: Record<string, string> = {
        sedentary: "Stillasittande",
        lightly_active: "Lätt aktiv",
        moderately_active: "Måttligt aktiv",
        active: "Aktiv",
        very_active: "Mycket aktiv"
      };
      parts.push(`Aktivitet: ${activityLabels[ns.activity_level] || ns.activity_level}`);
    }
    healthDataContext = parts.length > 0 ? parts.join(" | ") : "Inga uppgifter";
  }

  // Nutrition goals
  let goalsContext = "";
  if (patientContext.nutritionGoals) {
    const g = patientContext.nutritionGoals;
    const parts = [];
    if (g.calories) parts.push(`${g.calories} kcal`);
    if (g.protein) parts.push(`${g.protein}g protein`);
    goalsContext = parts.length > 0 ? `Dagliga mål: ${parts.join(", ")}` : "";
  }

  return `Du är en stöttande assistent som hjälper patienter med kostfrågor innan de pratar med sin dietist ${dietitianName}.

VIKTIGT: Svara som en varm, kunnig person – inte som en robot. Du är ${dietitianName}s assistent.

PATIENTENS BEHANDLING:
${treatmentContext}
${subcategory ? `Specifikt fokus: ${subcategory}` : ""}
${supportAreas !== "ej specificerat" ? `Stödområden: ${supportAreas}` : ""}
${concernTags ? `Intresseområden: ${concernTags}` : ""}

PATIENTENS JOURNAL (senaste 14 dagarna):
${mealsContext}

RAPPORTERADE SYMTOM:
${symptomsContext}

SPARADE RECEPT:
${recipesContext}

HÄLSODATA:
${healthDataContext}
${goalsContext}

RIKTLINJER:
1. Svara ALLTID på svenska med ett naturligt, vardagligt språk
2. Var varm och stöttande – aldrig uppfordrande eller dömande
3. Referera gärna till patientens journal: "Jag ser att du åt X igår – har du frågor om det?"
4. Håll svaren korta och personliga (2-4 meningar vanligtvis)
5. Du kan ställa följdfrågor för att förstå bättre
6. Använd ALDRIG emojis i dina svar – håll en professionell men varm ton

ESKALERA till ${dietitianName} när:
- Patienten nämner: blod, kraftig smärta, yrsel, svimning, kraftig viktnedgång
- Patienten uttrycker stark oro eller ångest
- Frågan handlar om mediciner eller dosering
- Du är osäker på svaret
- Patienten explicit ber om att prata med dietisten

När du eskalerar, säg något i stil med: "Det här vill jag att ${dietitianName} får titta på. Jag ser till att hen får ditt meddelande direkt."

VIKTIGT: När du eskalerar till dietisten, rekommendera också alltid att boka in ett möte om patienten inte redan har ett kommande möte. Säg något som: "Om du inte redan har ett möte inbokat så rekommenderar jag att du bokar in ett så att ${dietitianName} kan gå igenom detta ordentligt med dig."`;
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
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date 14 days ago (to ensure we have enough context)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split("T")[0];

    // Fetch all patient data in parallel
    const [
      intakeProfileResult,
      appointmentResult,
      mealsResult,
      symptomsResult,
      recipesResult,
      settingsResult,
      goalsResult
    ] = await Promise.all([
      supabaseService
        .from("intake_profiles")
        .select("unified_concern_category, primary_concern_category, primary_concern_subcategory, activity_level, support_areas, concern_tags")
        .eq("user_id", userId)
        .single(),
      supabaseService
        .from("appointments")
        .select("dietitian_id, dietitian_profiles(first_name, last_name)")
        .eq("user_id", userId)
        .eq("status", "booked")
        .order("appointment_date", { ascending: true })
        .limit(1)
        .single(),
      supabaseService
        .from("nutrition_entries")
        .select("entry_date, meal_type, meal_name")
        .eq("user_id", userId)
        .gte("entry_date", fourteenDaysAgoStr)
        .order("entry_date", { ascending: false })
        .limit(30),
      supabaseService
        .from("symptom_entries")
        .select("entry_date, description")
        .eq("user_id", userId)
        .gte("entry_date", fourteenDaysAgoStr)
        .order("entry_date", { ascending: false })
        .limit(10),
      supabaseService
        .from("user_recipe_interactions")
        .select("recipe_id, recipes(title)")
        .eq("user_id", userId)
        .eq("status", "saved")
        .limit(10),
      supabaseService
        .from("user_nutrition_settings")
        .select("weight_kg, height_cm, activity_level")
        .eq("user_id", userId)
        .single(),
      supabaseService
        .from("user_nutrition_goals")
        .select("calories_goal, protein_goal, carbs_goal, fat_goal")
        .eq("user_id", userId)
        .single()
    ]);

    const intakeProfile = intakeProfileResult.data;
    const appointment = appointmentResult.data;

    const dietitianName = appointment?.dietitian_profiles 
      ? `${(appointment.dietitian_profiles as any).first_name} ${(appointment.dietitian_profiles as any).last_name}`
      : "din dietist";

    // Build patient context
    const patientContext: PatientContext = {
      recentMeals: (mealsResult.data || []).map(m => ({
        date: m.entry_date,
        meal_type: m.meal_type || "unknown",
        meal_name: m.meal_name || ""
      })),
      recentSymptoms: (symptomsResult.data || []).map(s => ({
        date: s.entry_date,
        description: s.description
      })),
      savedRecipes: (recipesResult.data || [])
        .map(r => (r.recipes as any)?.title)
        .filter(Boolean),
      healthMetrics: [],
      nutritionSettings: settingsResult.data ? {
        weight_kg: settingsResult.data.weight_kg,
        height_cm: settingsResult.data.height_cm,
        activity_level: settingsResult.data.activity_level
      } : null,
      nutritionGoals: goalsResult.data ? {
        calories: goalsResult.data.calories_goal,
        protein: goalsResult.data.protein_goal,
        carbs: goalsResult.data.carbs_goal,
        fat: goalsResult.data.fat_goal
      } : null
    };

    // Save user message to database
    await supabaseService.from("chat_messages").insert({
      user_id: userId,
      sender: "user",
      content: sanitizedMessage,
      conversation_type: "ai"
    });

    // Build messages array for AI
    const systemPrompt = buildSystemPrompt(intakeProfile, dietitianName, patientContext);
    
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt }
    ];

    // Add conversation history if provided (limit to last 10 messages)
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

    // Stream response and collect for DB save
    let fullResponse = "";
    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
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
        if (fullResponse.trim()) {
          const escalationKeywords = ["dietist", "kopplat på", "skickat ditt meddelande", "får titta på", "återkommer"];
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
