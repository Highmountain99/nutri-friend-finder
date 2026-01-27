import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIIntakeResult {
  primaryConcernCategory: string | null;
  primaryConcernSubcategory: string | null;
  supportAreas: string[];
  confidence: number;
}

// Map Swedish descriptions to our enum values
const categoryMappings: Record<string, { category: string; subcategories?: string[] }> = {
  "diabetes": { 
    category: "diabetes", 
    subcategories: ["graviditetsdiabetes", "fördiabetes", "typ2", "typ1"] 
  },
  "socker": { category: "diabetes" },
  "blodsocker": { category: "diabetes" },
  "viktnedgång": { category: "weight_loss" },
  "gå ner i vikt": { category: "weight_loss" },
  "bantning": { category: "weight_loss" },
  "övervikt": { category: "weight_loss" },
  "mage": { category: "gut_health" },
  "tarm": { category: "gut_health" },
  "ibs": { category: "gut_health", subcategories: ["ibs"] },
  "reflux": { category: "gut_health", subcategories: ["reflux"] },
  "crohn": { category: "gut_health", subcategories: ["crohns"] },
  "kolit": { category: "gut_health", subcategories: ["ulcerös_kolit"] },
  "sibo": { category: "gut_health", subcategories: ["sibo"] },
  "pcos": { category: "womens_health", subcategories: ["pcos"] },
  "endometrios": { category: "womens_health", subcategories: ["endometrios"] },
  "klimakteriet": { category: "womens_health", subcategories: ["klimakteriet"] },
  "mens": { category: "womens_health" },
  "graviditet": { category: "womens_health", subcategories: ["graviditet"] },
  "fertilitet": { category: "womens_health", subcategories: ["fertilitet"] },
  "hormon": { category: "womens_health", subcategories: ["hormonell_hälsa"] },
  "känsloätande": { category: "emotional_eating" },
  "stress": { category: "emotional_eating" },
  "ätstörning": { category: "eating_disorder" },
  "anorexi": { category: "eating_disorder", subcategories: ["anorexi"] },
  "bulimi": { category: "eating_disorder", subcategories: ["bulimi"] },
  "hetsätning": { category: "eating_disorder", subcategories: ["hetsätning"] },
  "hjärta": { category: "heart_health" },
  "kolesterol": { category: "heart_health", subcategories: ["kolesterol"] },
  "blodtryck": { category: "heart_health", subcategories: ["blodtryck"] },
  "hjärtsjukdom": { category: "heart_health", subcategories: ["hjärtsjukdom"] },
  "hälsa": { category: "general_health" },
  "kost": { category: "general_health" },
  "näring": { category: "general_health" },
};

const supportAreaMappings: Record<string, string> = {
  "måltid": "meal_planning",
  "planera": "meal_planning",
  "recept": "meal_planning",
  "fodmap": "fodmap",
  "elimination": "elimination_diet",
  "träning": "exercise",
  "motion": "exercise",
  "aktivitet": "exercise",
  "sömn": "sleep",
  "sömnproblem": "sleep",
  "kosttillskott": "supplements",
  "vitamin": "supplements",
  "labb": "lab_tests",
  "provtagning": "lab_tests",
  "intuitivt": "intuitive_eating",
  "relation till mat": "food_relationship",
  "makro": "macro_goals",
  "protein": "macro_goals",
  "kalorier": "macro_goals",
  "funktionsmedicin": "functional_medicine",
  "viktneutral": "weight_neutral",
  "evidens": "evidence_based",
  "forskning": "evidence_based",
  "ansvar": "accountability",
  "uppföljning": "accountability",
};

function sanitizeInput(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/[{}[\]]/g, "")
    .trim()
    .slice(0, 1000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text input is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedText = sanitizeInput(text);

    if (sanitizedText.length < 3) {
      return new Response(JSON.stringify({ error: "Text is too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Du är en AI-assistent som hjälper till att kategorisera hälsorelaterade behov för en dietisttjänst.

Analysera användarens beskrivning och returnera strukturerad data.

Kategorier (primaryConcernCategory):
- weight_loss: Viktnedgång, bantning
- diabetes: Diabetes, blodsocker
- gut_health: Tarmhälsa, IBS, reflux
- general_health: Allmän hälsa
- womens_health: Kvinnohälsa, PCOS, klimakteriet
- emotional_eating: Känsloätande
- eating_disorder: Ätstörning
- heart_health: Hjärthälsa
- other: Övrigt

Underkategorier baserat på huvudkategori.

Stödområden (supportAreas):
- accountability: Ansvar och uppföljning
- elimination_diet: Elimineringsdiet
- exercise: Fysisk aktivitet
- fodmap: FODMAP
- functional_medicine: Funktionsmedicin
- intuitive_eating: Intuitivt ätande
- lab_tests: Laboratorieprover
- meal_planning: Måltidsplanering
- macro_goals: Makronutrientmål
- food_relationship: Relation till mat
- evidence_based: Evidensbaserat
- sleep: Sömn
- supplements: Kosttillskott
- weight_neutral: Viktneutralt`;

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
          { role: "user", content: `Analysera denna beskrivning: "${sanitizedText}"` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "categorize_intake",
              description: "Kategorisera användarens hälsobehov",
              parameters: {
                type: "object",
                properties: {
                  primaryConcernCategory: {
                    type: "string",
                    enum: [
                      "weight_loss",
                      "diabetes",
                      "gut_health",
                      "general_health",
                      "womens_health",
                      "emotional_eating",
                      "eating_disorder",
                      "heart_health",
                      "other",
                    ],
                    description: "Huvudkategori för användarens behov",
                  },
                  primaryConcernSubcategory: {
                    type: "string",
                    nullable: true,
                    description: "Underkategori om tillämpligt",
                  },
                  supportAreas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista av stödområden användaren kan behöva",
                  },
                  confidence: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                    description: "Konfidens i analysen (0-1)",
                  },
                },
                required: ["primaryConcernCategory", "supportAreas", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "categorize_intake" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback to local analysis
      return fallbackAnalysis(sanitizedText, corsHeaders);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "categorize_intake") {
      console.error("Unexpected AI response format");
      return fallbackAnalysis(sanitizedText, corsHeaders);
    }

    const result: AIIntakeResult = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-intake:", error);
    return new Response(JSON.stringify({ error: "Failed to analyze input" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function fallbackAnalysis(text: string, corsHeaders: Record<string, string>): Response {
  const lowerText = text.toLowerCase();
  let category: string | null = null;
  let subcategory: string | null = null;
  const supportAreas: string[] = [];

  // Try to match categories
  for (const [keyword, mapping] of Object.entries(categoryMappings)) {
    if (lowerText.includes(keyword)) {
      category = mapping.category;
      if (mapping.subcategories && mapping.subcategories.length > 0) {
        subcategory = mapping.subcategories[0];
      }
      break;
    }
  }

  // Try to match support areas
  for (const [keyword, area] of Object.entries(supportAreaMappings)) {
    if (lowerText.includes(keyword) && !supportAreas.includes(area)) {
      supportAreas.push(area);
    }
  }

  const result: AIIntakeResult = {
    primaryConcernCategory: category,
    primaryConcernSubcategory: subcategory,
    supportAreas,
    confidence: category ? 0.6 : 0.3,
  };

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
