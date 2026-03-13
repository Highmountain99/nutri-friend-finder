const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ParsedRecipe {
  title: string;
  description: string;
  ingredients: { amount: number | null; unit: string; ingredient: string }[];
  instructions: string[];
  servings: number | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  imageUrl: string | null;
  caloriesPerServing: number | null;
  proteinPerServing: number | null;
  carbsPerServing: number | null;
  fatPerServing: number | null;
  fiberPerServing: number | null;
}

function parseISO8601Duration(duration: string | undefined): number | null {
  if (!duration) return null;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0');
}

function parseNutritionValue(val: string | undefined): number | null {
  if (!val) return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

function extractJsonLd(html: string): any | null {
  const regex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      // Could be an array or single object
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'Recipe') return item;
        if (item['@graph']) {
          const recipe = item['@graph'].find((g: any) => g['@type'] === 'Recipe');
          if (recipe) return recipe;
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  return null;
}

function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const regex = /<meta[^>]+(property|name)\s*=\s*["']([^"']+)["'][^>]+content\s*=\s*["']([^"']*)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    meta[match[2]] = match[3];
  }
  return meta;
}

function parseRecipeFromJsonLd(data: any): ParsedRecipe {
  const ingredients = (data.recipeIngredient || []).map((line: string) => {
    const m = line.match(/^(\d+[.,]?\d*)\s*(g|kg|ml|dl|l|msk|tsk|st|krm|cl)?\s*(.+)$/i);
    if (m) {
      return { amount: parseFloat(m[1].replace(',', '.')), unit: (m[2] || '').toLowerCase(), ingredient: m[3].trim() };
    }
    return { amount: null, unit: '', ingredient: line.trim() };
  });

  let instructions: string[] = [];
  if (Array.isArray(data.recipeInstructions)) {
    instructions = data.recipeInstructions.map((step: any) => {
      if (typeof step === 'string') return step;
      return step.text || step.name || '';
    }).filter(Boolean);
  } else if (typeof data.recipeInstructions === 'string') {
    instructions = data.recipeInstructions.split('\n').filter(Boolean);
  }

  const nutrition = data.nutrition || {};

  let servings: number | null = null;
  if (data.recipeYield) {
    const yieldVal = Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield;
    const num = parseInt(String(yieldVal));
    if (!isNaN(num)) servings = num;
  }

  let imageUrl: string | null = null;
  if (data.image) {
    if (typeof data.image === 'string') imageUrl = data.image;
    else if (Array.isArray(data.image)) imageUrl = data.image[0];
    else if (data.image.url) imageUrl = data.image.url;
  }

  return {
    title: data.name || '',
    description: data.description || '',
    ingredients,
    instructions,
    servings,
    prepTimeMinutes: parseISO8601Duration(data.prepTime),
    cookTimeMinutes: parseISO8601Duration(data.cookTime) || parseISO8601Duration(data.totalTime),
    imageUrl,
    caloriesPerServing: parseNutritionValue(nutrition.calories),
    proteinPerServing: parseNutritionValue(nutrition.proteinContent),
    carbsPerServing: parseNutritionValue(nutrition.carbohydrateContent),
    fatPerServing: parseNutritionValue(nutrition.fatContent),
    fiberPerServing: parseNutritionValue(nutrition.fiberContent),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'URL krävs' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;

    console.log('Scraping recipe from:', formattedUrl);

    // Try direct fetch first
    let html = '';
    try {
      const resp = await fetch(formattedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GutFeeling/1.0)' },
      });
      html = await resp.text();
    } catch (fetchErr) {
      console.log('Direct fetch failed, trying Firecrawl fallback');
    }

    // Try JSON-LD extraction
    if (html) {
      const jsonLd = extractJsonLd(html);
      if (jsonLd) {
        const recipe = parseRecipeFromJsonLd(jsonLd);
        return new Response(JSON.stringify({ success: true, recipe, source: 'json-ld' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fallback: meta tags
      const meta = extractMetaTags(html);
      if (meta['og:title']) {
        const recipe: ParsedRecipe = {
          title: meta['og:title'] || '',
          description: meta['og:description'] || '',
          ingredients: [],
          instructions: [],
          servings: null,
          prepTimeMinutes: null,
          cookTimeMinutes: null,
          imageUrl: meta['og:image'] || null,
          caloriesPerServing: null,
          proteinPerServing: null,
          carbsPerServing: null,
          fatPerServing: null,
          fiberPerServing: null,
        };
        return new Response(JSON.stringify({ success: true, recipe, source: 'meta-tags', partial: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Firecrawl fallback
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (firecrawlKey) {
      console.log('Trying Firecrawl scrape...');
      const fcResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl, formats: ['html'] }),
      });
      const fcData = await fcResp.json();
      const fcHtml = fcData?.data?.html || fcData?.html || '';
      if (fcHtml) {
        const jsonLd = extractJsonLd(fcHtml);
        if (jsonLd) {
          const recipe = parseRecipeFromJsonLd(jsonLd);
          return new Response(JSON.stringify({ success: true, recipe, source: 'firecrawl-json-ld' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Kunde inte tolka receptet automatiskt. Prova att kopiera receptet och klistra in det manuellt.',
    }), {
      status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error scraping recipe:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Okänt fel' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
