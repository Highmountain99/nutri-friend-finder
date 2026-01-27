import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Error messages to return to clients (no sensitive details)
const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  INVALID_INPUT: "Invalid input provided",
  IMAGE_TOO_LARGE: "Image too large (max 10MB)",
  TEXT_TOO_LONG: "Text description too long (max 1000 characters)",
  ADJUSTMENT_TOO_LONG: "Adjustment too long (max 500 characters)",
  INVALID_ANALYSIS_TYPE: "Invalid analysis type",
  RATE_LIMIT: "Too many requests. Please try again later.",
  SERVICE_ERROR: "Service temporarily unavailable",
  ANALYSIS_FAILED: "Unable to analyze. Please try again.",
};

// Validation limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB base64
const MAX_TEXT_LENGTH = 1000;
const MAX_ADJUSTMENT_LENGTH = 500;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Determine meal type based on time
function getMealType(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return "Frukost";
  if (hour >= 10 && hour < 12) return "Förmiddagssnack";
  if (hour >= 12 && hour < 14) return "Lunch";
  if (hour >= 14 && hour < 17) return "Mellanmål";
  if (hour >= 17 && hour < 21) return "Middag";
  return "Kvällssnack";
}

// Input validation
interface ValidatedRequest {
  analysisType: "image" | "text" | "adjust";
  imageBase64?: string;
  textDescription?: string;
  originalEstimation?: unknown;
  adjustment?: string;
}

function validateRequest(body: unknown): ValidatedRequest {
  if (!body || typeof body !== "object") {
    throw new Error(ERROR_MESSAGES.INVALID_INPUT);
  }

  const req = body as Record<string, unknown>;
  const analysisType = req.analysisType;

  if (!["image", "text", "adjust"].includes(analysisType as string)) {
    throw new Error(ERROR_MESSAGES.INVALID_ANALYSIS_TYPE);
  }

  if (analysisType === "image") {
    const imageBase64 = req.imageBase64;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT);
    }
    if (imageBase64.length > MAX_IMAGE_SIZE) {
      throw new Error(ERROR_MESSAGES.IMAGE_TOO_LARGE);
    }
    // Basic base64 format validation
    if (!imageBase64.startsWith("data:image/") && !/^[A-Za-z0-9+/=]+$/.test(imageBase64.slice(0, 100))) {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT);
    }
  }

  if (analysisType === "text") {
    const textDescription = req.textDescription;
    if (!textDescription || typeof textDescription !== "string") {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT);
    }
    if (textDescription.length > MAX_TEXT_LENGTH) {
      throw new Error(ERROR_MESSAGES.TEXT_TOO_LONG);
    }
  }

  if (analysisType === "adjust") {
    const adjustment = req.adjustment;
    if (!adjustment || typeof adjustment !== "string") {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT);
    }
    if (adjustment.length > MAX_ADJUSTMENT_LENGTH) {
      throw new Error(ERROR_MESSAGES.ADJUSTMENT_TOO_LONG);
    }
  }

  return req as unknown as ValidatedRequest;
}

// Sanitize user input to reduce prompt injection risk
function sanitizeInput(text: string, maxLength: number): string {
  return text
    .replace(/ignore\s+previous\s+instructions/gi, "")
    .replace(/system:|assistant:|user:/gi, "")
    .substring(0, maxLength)
    .trim();
}

// Validate AI response
interface FoodAnalysis {
  mealName: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Array<{
    name: string;
    amount: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  confidence: "high" | "medium" | "low";
}

function validateFoodAnalysis(data: unknown, mealType: string): FoodAnalysis {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response format");
  }

  const analysis = data as Partial<FoodAnalysis>;

  // Validate and sanitize numeric values
  const calories = Math.max(0, Math.min(10000, Number(analysis.calories) || 0));
  const protein = Math.max(0, Math.min(1000, Number(analysis.protein) || 0));
  const carbs = Math.max(0, Math.min(1000, Number(analysis.carbs) || 0));
  const fat = Math.max(0, Math.min(1000, Number(analysis.fat) || 0));

  const confidence = ["high", "medium", "low"].includes(analysis.confidence || "")
    ? (analysis.confidence as "high" | "medium" | "low")
    : "low";

  return {
    mealName: String(analysis.mealName || "Okänd måltid").substring(0, 100),
    mealType: String(analysis.mealType || mealType).substring(0, 50),
    calories,
    protein,
    carbs,
    fat,
    ingredients: Array.isArray(analysis.ingredients) ? analysis.ingredients.slice(0, 20) : [],
    confidence,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user with Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);

    if (authError || !claimsData?.claims) {
      console.error("[analyze-food] Auth error");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("[analyze-food] Authenticated user:", userId);

    // Parse and validate request
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_INPUT }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validatedRequest = validateRequest(body);
    const { analysisType, imageBase64, textDescription, originalEstimation, adjustment } = validatedRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[analyze-food] Missing API key configuration");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.SERVICE_ERROR }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mealType = getMealType(new Date());
    let messages: Array<{ role: string; content: unknown }> = [];

    const systemPrompt = `Du är en expert nutritionist och matanalytiker. Analysera mat och ge näringsvärden.

VIKTIGT: Svara ENDAST med ett JSON-objekt, inget annat text. Formatet måste vara:
{
  "mealName": "Kort beskrivning av måltiden",
  "mealType": "${mealType}",
  "calories": nummer,
  "protein": nummer (gram),
  "carbs": nummer (gram),
  "fat": nummer (gram),
  "ingredients": [
    {
      "name": "Ingrediens namn",
      "amount": "mängd (t.ex. 150g, 1 st)",
      "calories": nummer,
      "protein": nummer,
      "carbs": nummer,
      "fat": nummer
    }
  ],
  "confidence": "high" | "medium" | "low"
}

Var realistisk med portionsstorlekar. Om osäker, anta normala svenska portioner.`;

    if (analysisType === "image" && imageBase64) {
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analysera denna matbild och uppskatta näringsinnehållet. Identifiera alla synliga ingredienser.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ];
    } else if (analysisType === "text" && textDescription) {
      const sanitizedDescription = sanitizeInput(textDescription, MAX_TEXT_LENGTH);
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analysera denna måltidsbeskrivning och uppskatta näringsinnehållet:\n\n${sanitizedDescription}`,
        },
      ];
    } else if (analysisType === "adjust" && adjustment) {
      const sanitizedAdjustment = sanitizeInput(adjustment, MAX_ADJUSTMENT_LENGTH);
      const adjustSystemPrompt = `Du är en expert nutritionist. Justera en tidigare näringsuppskattning baserat på användarens feedback.

VIKTIGT: Svara ENDAST med ett JSON-objekt med samma format som tidigare:
{
  "mealName": "Uppdaterad beskrivning",
  "mealType": "${mealType}",
  "calories": nummer,
  "protein": nummer,
  "carbs": nummer,
  "fat": nummer,
  "ingredients": [...],
  "confidence": "high" | "medium" | "low"
}`;

      messages = [
        { role: "system", content: adjustSystemPrompt },
        {
          role: "user",
          content: `Ursprunglig uppskattning:\n${JSON.stringify(originalEstimation, null, 2)}\n\nAnvändarens justering: ${sanitizedAdjustment}\n\nGe en uppdaterad uppskattning.`,
        },
      ];
    } else {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_INPUT }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[analyze-food] Calling AI for analysis...");

    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("[analyze-food] AI gateway error:", response.status);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.RATE_LIMIT }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.SERVICE_ERROR }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[analyze-food] No content in AI response");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.ANALYSIS_FAILED }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate the JSON response
    let parsed: FoodAnalysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const rawParsed = JSON.parse(jsonMatch[0]);
        parsed = validateFoodAnalysis(rawParsed, mealType);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[analyze-food] Failed to parse AI response");
      // Return a safe fallback
      parsed = {
        mealName: "Okänd måltid",
        mealType,
        calories: 300,
        protein: 15,
        carbs: 30,
        fat: 10,
        ingredients: [],
        confidence: "low",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error details server-side only
    console.error("[analyze-food] Error:", error instanceof Error ? error.message : "Unknown error");

    // Check if it's a validation error (safe to return)
    const errorMessage = error instanceof Error ? error.message : "";
    const safeErrors = Object.values(ERROR_MESSAGES);

    if (safeErrors.includes(errorMessage)) {
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return generic error for unknown errors
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.ANALYSIS_FAILED }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
