import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PARSE_SYSTEM_PROMPT = `Du är en expert på att extrahera och strukturera receptdata från webbsidor.
Din uppgift är att konvertera rå markdown-text från ett recept till ett strukturerat JSON-objekt.

VIKTIGT: Returnera ENDAST giltig JSON, ingen annan text.

Extrahera följande fält:
- title: Receptets namn (string)
- description: Kort beskrivning av receptet (string, max 200 tecken)
- time_minutes: Total tillagningstid i minuter (number). Parsa "Under 45 min" → 45, "1 timme" → 60
- servings: Antal portioner (number). Parsa "ca 4 portioner" → 4, "8 bitar" → 8
- difficulty: Svårighetsgrad - "lätt", "medel" eller "svår" (string)
- ingredients: Array av objekt med { amount: string, unit: string, name: string }
- instructions: Array av strängar, ett steg per sträng
- image_url: URL till receptbilden om tillgänglig (string eller null)
- tags: Array av relevanta taggar (string[])
- meal_types: Array av måltidstyper - t.ex. ["frukost"], ["lunch"], ["middag"], ["mellanmål"], ["dessert"]
- cuisine_types: Array av kökstyper - t.ex. ["svensk"], ["italiensk"], ["asiatisk"], ["mexikansk"]
- dietary_needs: Array av kostbehov - t.ex. ["vegetarisk"], ["vegan"], ["glutenfri"], ["laktosfri"]
- allergen_free: Array av allergener receptet är fritt från - t.ex. ["nötfri"], ["äggfri"]
- calories_per_serving: Kalorier per portion om tillgängligt (number eller null)
- protein_per_serving: Protein i gram per portion (number eller null)
- carbs_per_serving: Kolhydrater i gram per portion (number eller null)
- fat_per_serving: Fett i gram per portion (number eller null)

Om information saknas, använd null för enskilda fält eller tomma arrayer för array-fält.`;

async function verifyAdmin(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = data.claims.sub as string;
  const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: hasRole } = await supabaseAdmin.rpc('has_role', { _user_id: userId, _role: 'admin' });
  if (!hasRole) {
    return new Response(JSON.stringify({ success: false, error: 'Forbidden: admin role required' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return { userId };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await verifyAdmin(req);
    if (authResult instanceof Response) return authResult;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batchSize = 5 } = await req.json().catch(() => ({}));

    const { data: scrapedRecipes, error: fetchError } = await supabase
      .from('recipe_import_queue')
      .select('*')
      .eq('status', 'pending')
      .not('scraped_data', 'is', null)
      .is('parsed_data', null)
      .limit(batchSize);

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!scrapedRecipes || scrapedRecipes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No recipes to parse', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing ${scrapedRecipes.length} recipes with AI...`);

    const results = { success: 0, failed: 0, imported: 0, errors: [] as string[] };

    for (const recipe of scrapedRecipes) {
      try {
        await supabase.from('recipe_import_queue').update({ status: 'processing' }).eq('id', recipe.id);

        const markdown = recipe.scraped_data?.markdown || '';
        if (!markdown) throw new Error('No markdown content to parse');

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: PARSE_SYSTEM_PROMPT },
              { role: 'user', content: `Extrahera receptdata från följande markdown:\n\n${markdown.substring(0, 8000)}` }
            ],
            temperature: 0.1,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          throw new Error(`AI parsing failed: ${aiResponse.status} - ${errorText}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        if (!content) throw new Error('No content from AI response');

        let parsedRecipe;
        try {
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : content;
          parsedRecipe = JSON.parse(jsonStr.trim());
        } catch (e) {
          throw new Error(`Failed to parse AI response as JSON: ${content.substring(0, 200)}`);
        }

        await supabase.from('recipe_import_queue').update({ 
          parsed_data: parsedRecipe, status: 'completed', processed_at: new Date().toISOString()
        }).eq('id', recipe.id);

        const { error: insertError } = await supabase.from('recipes').insert({
          title: parsedRecipe.title || 'Okänt recept',
          description: parsedRecipe.description,
          time_minutes: parsedRecipe.time_minutes,
          servings: parsedRecipe.servings || 4,
          difficulty: parsedRecipe.difficulty || 'medel',
          ingredients: parsedRecipe.ingredients || [],
          instructions: parsedRecipe.instructions || [],
          image_url: parsedRecipe.image_url,
          tags: parsedRecipe.tags || [],
          meal_types: parsedRecipe.meal_types || ['middag'],
          cuisine_types: parsedRecipe.cuisine_types || [],
          dietary_needs: parsedRecipe.dietary_needs || [],
          allergen_free: parsedRecipe.allergen_free || [],
          calories_per_serving: parsedRecipe.calories_per_serving,
          protein_per_serving: parsedRecipe.protein_per_serving,
          carbs_per_serving: parsedRecipe.carbs_per_serving,
          fat_per_serving: parsedRecipe.fat_per_serving,
          source_url: recipe.source_url,
          rating: 4.0,
        });

        if (insertError) {
          console.error('Error inserting recipe:', insertError);
          results.errors.push(`Insert failed for ${recipe.source_url}: ${insertError.message}`);
        } else {
          results.imported++;
        }

        results.success++;
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error parsing ${recipe.source_url}:`, errorMsg);
        await supabase.from('recipe_import_queue').update({ 
          status: 'failed', error_message: errorMsg, processed_at: new Date().toISOString()
        }).eq('id', recipe.id);
        results.failed++;
        results.errors.push(`${recipe.source_url}: ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Parsed ${results.success} recipes, imported ${results.imported}, ${results.failed} failed`, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recipe-parse:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
