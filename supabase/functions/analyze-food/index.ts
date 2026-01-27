import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, textDescription, analysisType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const mealType = getMealType(new Date());
    let messages: any[] = [];

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
              text: "Analysera denna matbild och uppskatta näringsinnehållet. Identifiera alla synliga ingredienser."
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ];
    } else if (analysisType === "text" && textDescription) {
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analysera denna måltidsbeskrivning och uppskatta näringsinnehållet:\n\n${textDescription}`
        }
      ];
    } else if (analysisType === "adjust") {
      const { originalEstimation, adjustment } = await req.json();
      
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
          content: `Ursprunglig uppskattning:\n${JSON.stringify(originalEstimation, null, 2)}\n\nAnvändarens justering: ${adjustment}\n\nGe en uppdaterad uppskattning.`
        }
      ];
    } else {
      throw new Error("Invalid analysis type or missing data");
    }

    console.log("Calling Lovable AI for food analysis...");

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
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response:", content);

    // Parse the JSON response
    let parsed;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a fallback response
      parsed = {
        mealName: "Okänd måltid",
        mealType,
        calories: 300,
        protein: 15,
        carbs: 30,
        fat: 10,
        ingredients: [],
        confidence: "low"
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-food:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
