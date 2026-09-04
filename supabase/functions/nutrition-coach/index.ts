import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return json({ error: "Message is required" }, 400);
    }
    const sanitizedMessage = message.trim().slice(0, 2000);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;
    const db = createClient(supabaseUrl, supabaseServiceKey);

    const since = new Date();
    since.setDate(since.getDate() - 14);
    const sinceStr = since.toISOString().split("T")[0];

    const [mealsRes, settingsRes, goalsRes, recipesRes, planRes, historyRes, catalogRes] = await Promise.all([
      db
        .from("nutrition_entries")
        .select("entry_date, meal_type, meal_name, calories, protein")
        .eq("user_id", userId)
        .gte("entry_date", sinceStr)
        .order("entry_date", { ascending: false })
        .limit(30),
      db
        .from("user_nutrition_settings")
        .select("weight_kg, height_cm, activity_level")
        .eq("user_id", userId)
        .maybeSingle(),
      db
        .from("user_nutrition_goals")
        .select("calories_goal, protein_goal, carbs_goal, fat_goal")
        .eq("user_id", userId)
        .maybeSingle(),
      db
        .from("user_recipe_interactions")
        .select("recipes(title)")
        .eq("user_id", userId)
        .eq("status", "saved")
        .limit(10),
      db
        .from("treatment_plans")
        .select("title, end_goal, end_goal_target_date")
        .eq("patient_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("chat_messages")
        .select("sender, content")
        .eq("user_id", userId)
        .eq("conversation_type", "ai")
        .order("created_at", { ascending: false })
        .limit(12),
      db
        .from("recipes")
        .select("id, title, tags, meal_types, dietary_needs, time_minutes, calories_per_serving, protein_per_serving")
        .eq("is_published", true)
        .limit(300),
    ]);

    const catalog = catalogRes.data || [];
    const catalogText = catalog.length
      ? catalog
          .map(
            (r) =>
              `${r.id} | ${r.title} | ${(r.meal_types || []).join("/") || "-"} | ${(r.tags || []).slice(0, 4).join(", ") || "-"} | ${r.time_minutes ?? "?"} min | ${r.calories_per_serving ?? "?"} kcal | ${r.protein_per_serving ?? "?"}g protein`
          )
          .join("\n")
      : "Inga recept i databasen.";

    const meals = (mealsRes.data || [])
      .map((m) => `- ${m.entry_date} ${m.meal_type || ""}: ${m.meal_name || "okänt"}`)
      .join("\n") || "Inga måltider loggade senaste två veckorna.";

    const s = settingsRes.data;
    const g = goalsRes.data;
    const goals = g
      ? `Dagliga mål: ${[g.calories_goal && `${g.calories_goal} kcal`, g.protein_goal && `${g.protein_goal}g protein`, g.carbs_goal && `${g.carbs_goal}g kolhydrater`, g.fat_goal && `${g.fat_goal}g fett`].filter(Boolean).join(", ")}`
      : "Inga näringsmål satta.";
    const body = s
      ? `Vikt: ${s.weight_kg ?? "okänd"} kg, längd: ${s.height_cm ?? "okänd"} cm, aktivitetsnivå: ${s.activity_level ?? "okänd"}`
      : "Ingen kroppsdata registrerad.";
    const savedRecipes =
      (recipesRes.data || []).map((r) => (r.recipes as any)?.title).filter(Boolean).join(", ") ||
      "Inga sparade recept.";
    const plan = planRes.data
      ? `Plan: ${planRes.data.title || "-"}. Slutmål: ${planRes.data.end_goal || "-"}${planRes.data.end_goal_target_date ? ` (måldatum ${planRes.data.end_goal_target_date})` : ""}`
      : "Ingen behandlingsplan satt.";

    const systemPrompt = `Du är Kostcoach – en AI-kostcoach i appen Gut Feeling, tränad på råd från legitimerade dietister.

DITT UPPDRAG:
Hjälp användaren med kost, måltidsplanering, recept som passar deras mål och preferenser, samt hur de ligger till mot sina mål.

ANVÄNDARENS DATA:
${body}
${goals}
${plan}

LOGGADE MÅLTIDER (14 dagar):
${meals}

SPARADE RECEPT:
${savedRecipes}

RIKTLINJER:
1. Svara alltid på svenska, varmt, konkret och utan att döma.
2. Håll svaren korta (2-5 meningar) om användaren inte ber om mer. Använd punktlistor för receptförslag.
3. Referera till användarens loggade måltider och mål när det är relevant.
4. Föreslå gärna konkreta recept med huvudingredienser och ungefärlig näring.
5. Använd aldrig emojis.
6. Ge aldrig medicinsk rådgivning, diagnoser eller läkemedelsråd. Vid symtom, sjukdom, kraftig viktnedgång eller oro: hänvisa användaren till att skriva till sin coach i fliken bredvid.`;

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    for (const m of [...(historyRes.data || [])].reverse()) {
      const role = m.sender === "user" ? "user" : m.sender === "ai" ? "assistant" : null;
      if (!role || typeof m.content !== "string" || !m.content) continue;
      messages.push({ role, content: m.content.slice(0, 2000) });
    }
    messages.push({ role: "user", content: sanitizedMessage });

    await db.from("chat_messages").insert({
      user_id: userId,
      sender: "user",
      content: sanitizedMessage,
      conversation_type: "ai",
      status: "sent",
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages, stream: false }),
    });

    if (!response.ok) {
      if (response.status === 429)
        return json({ error: "Kostcoachen är upptagen just nu. Försök igen om en stund." }, 429);
      if (response.status === 402)
        return json({ error: "AI-tjänsten är tillfälligt otillgänglig." }, 402);
      console.error("AI gateway error:", response.status, await response.text());
      return json({ error: "Ett fel uppstod. Försök igen." }, 500);
    }

    const data = await response.json();
    const reply = (data?.choices?.[0]?.message?.content || "").trim();

    if (reply) {
      await db.from("chat_messages").insert({
        user_id: userId,
        sender: "ai",
        content: reply,
        conversation_type: "ai",
        status: "sent",
      });
    }

    return json({ ok: true, reply });
  } catch (error) {
    console.error("[nutrition-coach] Error:", error);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
