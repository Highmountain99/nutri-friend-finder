import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Ingredient { amount: number | null; unit: string; ingredient: string }

interface ParsedRecipe {
  title: string;
  description: string;
  ingredients: Ingredient[];
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
  nutritionEstimated?: boolean;
}

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
const BOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

/* ---------- helpers ---------- */

function parseISO8601Duration(duration: unknown): number | null {
  if (typeof duration !== 'string') return null;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match || (!match[1] && !match[2])) return null;
  return parseInt(match[1] || '0') * 60 + parseInt(match[2] || '0');
}

function toNumber(val: unknown): number | null {
  if (typeof val === 'number') return isFinite(val) ? val : null;
  if (typeof val !== 'string') return null;
  const m = val.replace(',', '.').match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return isNaN(n) ? null : n;
}

/** Calories can be given in kJ or as nonsense values on some sites. */
function normalizeCalories(val: unknown): number | null {
  const n = toNumber(val);
  if (n === null) return null;
  const isKj = typeof val === 'string' && /kj/i.test(val);
  const kcal = isKj ? n / 4.184 : n;
  if (kcal < 20 || kcal > 3000) return null; // implausible per serving
  return Math.round(kcal);
}

function normalizeMacro(val: unknown): number | null {
  const n = toNumber(val);
  if (n === null) return null;
  if (n < 0 || n > 500) return null;
  return Math.round(n * 10) / 10;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function parseIngredientLine(raw: string): Ingredient {
  const line = decodeEntities(raw).replace(/\s+/g, ' ').trim();
  // handles "1/2 dl olja", "1,5 msk salt", "600 g kikärtor", "2 st bröd"
  const m = line.match(
    /^(\d+\s*\/\s*\d+|\d+[.,]?\d*(?:\s*-\s*\d+[.,]?\d*)?)\s*(kg|g|hg|ml|cl|dl|l|msk|tsk|krm|st|nypa|klyfta|kruka|paket|burk|förp|port)?\b\s*(.*)$/i,
  );
  if (m && m[3]) {
    let amount: number | null;
    if (m[1].includes('/')) {
      const [a, b] = m[1].split('/').map((x) => parseFloat(x.trim()));
      amount = b ? Math.round((a / b) * 100) / 100 : null;
    } else {
      amount = parseFloat(m[1].split('-')[0].replace(',', '.'));
    }
    return { amount: isNaN(amount as number) ? null : amount, unit: (m[2] || '').toLowerCase(), ingredient: m[3].trim() };
  }
  return { amount: null, unit: '', ingredient: line };
}

/* ---------- JSON-LD ---------- */

function collectNodes(data: unknown, out: any[] = []): any[] {
  if (Array.isArray(data)) {
    data.forEach((d) => collectNodes(d, out));
  } else if (data && typeof data === 'object') {
    const obj = data as any;
    out.push(obj);
    if (obj['@graph']) collectNodes(obj['@graph'], out);
  }
  return out;
}

function isRecipeNode(node: any): boolean {
  const t = node?.['@type'];
  return t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'));
}

function extractJsonLdRecipe(html: string): any | null {
  const regex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    let raw = match[1].trim();
    // strip CDATA wrappers
    raw = raw.replace(/^\/\*\s*<!\[CDATA\[\s*\*\//, '').replace(/\/\*\s*\]\]>\s*\*\/$/, '');
    try {
      const data = JSON.parse(raw);
      const node = collectNodes(data).find(isRecipeNode);
      if (node) return node;
    } catch {
      // ignore
    }
  }
  return null;
}

function flattenInstructions(input: unknown): string[] {
  const out: string[] = [];
  const walk = (step: any) => {
    if (!step) return;
    if (typeof step === 'string') {
      out.push(step);
      return;
    }
    if (Array.isArray(step)) {
      step.forEach(walk);
      return;
    }
    if (step.itemListElement) {
      walk(step.itemListElement);
      return;
    }
    if (step.text || step.name) out.push(step.text || step.name);
  };
  walk(input);
  return out
    .map((s) => decodeEntities(String(s)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 1);
}

function absoluteUrl(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

function parseRecipeFromJsonLd(data: any, pageUrl: string): ParsedRecipe {
  const ingredients = (Array.isArray(data.recipeIngredient) ? data.recipeIngredient : [])
    .map((l: unknown) => String(l))
    .filter((l: string) => l.trim().length > 0)
    .map(parseIngredientLine);

  const nutrition = data.nutrition || {};

  let servings: number | null = null;
  const yieldVal = Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield;
  const yieldNum = toNumber(yieldVal);
  if (yieldNum && yieldNum > 0 && yieldNum <= 50) servings = Math.round(yieldNum);

  let imageUrl: string | null = null;
  const img = data.image ?? data.thumbnailUrl;
  if (img) {
    if (typeof img === 'string') imageUrl = img;
    else if (Array.isArray(img)) imageUrl = typeof img[0] === 'string' ? img[0] : img[0]?.url ?? null;
    else if (img.url) imageUrl = img.url;
  }

  const totalTime = parseISO8601Duration(data.totalTime);
  const cookTime = parseISO8601Duration(data.cookTime);
  const prepTime = parseISO8601Duration(data.prepTime);

  return {
    title: decodeEntities(String(data.name || '')).trim(),
    description: decodeEntities(String(data.description || '')).replace(/<[^>]+>/g, '').trim(),
    ingredients,
    instructions: flattenInstructions(data.recipeInstructions),
    servings,
    prepTimeMinutes: prepTime,
    cookTimeMinutes: cookTime ?? (prepTime ? (totalTime ? Math.max(totalTime - prepTime, 0) : null) : totalTime),
    imageUrl: absoluteUrl(imageUrl, pageUrl),
    caloriesPerServing: normalizeCalories(nutrition.calories ?? nutrition.energyContent),
    proteinPerServing: normalizeMacro(nutrition.proteinContent),
    carbsPerServing: normalizeMacro(nutrition.carbohydrateContent),
    fatPerServing: normalizeMacro(nutrition.fatContent),
    fiberPerServing: normalizeMacro(nutrition.fiberContent),
  };
}

/* ---------- plain text extraction ---------- */

function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const regex = /<meta[^>]+(?:property|name)\s*=\s*["']([^"']+)["'][^>]*content\s*=\s*["']([^"']*)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) meta[m[1]] = decodeEntities(m[2]);
  const regex2 = /<meta[^>]+content\s*=\s*["']([^"']*)["'][^>]*(?:property|name)\s*=\s*["']([^"']+)["']/gi;
  while ((m = regex2.exec(html)) !== null) if (!meta[m[2]]) meta[m[2]] = decodeEntities(m[1]);
  return meta;
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|div|li|h1|h2|h3|h4|tr|section|br)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l, i, arr) => l.length > 0 && l !== arr[i - 1])
    .join('\n');
}

/* ---------- AI ---------- */

async function callAi(system: string, user: string, schemaHint: string): Promise<any | null> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return null;
  try {
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: `${system}\nSvara ENDAST med giltig JSON enligt: ${schemaHint}` },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!resp.ok) {
      console.error('AI gateway error', resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const cleaned = String(content).replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('AI parse failed', e);
    return null;
  }
}

async function aiParsePage(text: string, meta: Record<string, string>, pageUrl: string): Promise<Partial<ParsedRecipe> | null> {
  const result = await callAi(
    'Du extraherar ett matrecept ur text från en receptsida. Behåll svensk originaltext. Hitta inte på ingredienser eller steg som inte finns.',
    `URL: ${pageUrl}\nTitel: ${meta['og:title'] || ''}\n\nSIDTEXT:\n${text.slice(0, 24000)}`,
    '{"title":string,"description":string,"servings":number|null,"prepTimeMinutes":number|null,"cookTimeMinutes":number|null,"ingredients":[{"amount":number|null,"unit":string,"ingredient":string}],"instructions":[string]}',
  );
  if (!result) return null;
  return {
    title: typeof result.title === 'string' ? result.title.trim() : '',
    description: typeof result.description === 'string' ? result.description.trim() : '',
    servings: toNumber(result.servings),
    prepTimeMinutes: toNumber(result.prepTimeMinutes),
    cookTimeMinutes: toNumber(result.cookTimeMinutes),
    ingredients: Array.isArray(result.ingredients)
      ? result.ingredients
          .map((i: any) =>
            typeof i === 'string'
              ? parseIngredientLine(i)
              : { amount: toNumber(i?.amount), unit: String(i?.unit || '').toLowerCase(), ingredient: String(i?.ingredient || '').trim() },
          )
          .filter((i: Ingredient) => i.ingredient.length > 0)
      : [],
    instructions: Array.isArray(result.instructions)
      ? result.instructions.map((s: any) => String(s).trim()).filter(Boolean)
      : [],
  };
}

async function aiEstimateNutrition(recipe: ParsedRecipe): Promise<Partial<ParsedRecipe> | null> {
  const list = recipe.ingredients
    .map((i) => `${i.amount ?? ''} ${i.unit} ${i.ingredient}`.trim())
    .join('\n');
  if (!list) return null;
  const result = await callAi(
    'Du är dietist. Uppskatta näringsinnehåll PER PORTION utifrån ingredienslistan och antal portioner. Var realistisk.',
    `Recept: ${recipe.title}\nPortioner: ${recipe.servings ?? 4}\nIngredienser:\n${list}`,
    '{"caloriesPerServing":number,"proteinPerServing":number,"carbsPerServing":number,"fatPerServing":number,"fiberPerServing":number}',
  );
  if (!result) return null;
  return {
    caloriesPerServing: normalizeCalories(result.caloriesPerServing),
    proteinPerServing: normalizeMacro(result.proteinPerServing),
    carbsPerServing: normalizeMacro(result.carbsPerServing),
    fatPerServing: normalizeMacro(result.fatPerServing),
    fiberPerServing: normalizeMacro(result.fiberPerServing),
  };
}

/* ---------- SSRF protection ---------- */

function isAllowedUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return false;
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('[') && hostname.endsWith(']')) hostname = hostname.slice(1, -1);
    if (
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' ||
      hostname.endsWith('.local') || hostname.endsWith('.internal') ||
      hostname.startsWith('10.') || hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ) return false;
    if (
      hostname === '::1' || hostname === '::' ||
      hostname.startsWith('fc') || hostname.startsWith('fd') ||
      hostname.startsWith('fe8') || hostname.startsWith('fe9') ||
      hostname.startsWith('fea') || hostname.startsWith('feb')
    ) return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchHtml(url: string, ua: string): Promise<string> {
  try {
    const resp = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': ua,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
      },
    });
    if (!resp.ok) return '';
    return await resp.text();
  } catch {
    return '';
  }
}

/* ---------- handler ---------- */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid or expired token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'URL krävs' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let pageUrl = url.trim();
    if (!pageUrl.startsWith('http')) pageUrl = `https://${pageUrl}`;
    if (!isAllowedUrl(pageUrl)) {
      return new Response(JSON.stringify({ success: false, error: 'Denna webbplats stöds inte för receptimport.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scraping recipe from:', pageUrl);

    // 1. Fetch as browser, fall back to crawler UA (needed for JS-rendered sites like coop.se)
    let html = await fetchHtml(pageUrl, BROWSER_UA);
    let jsonLd = html ? extractJsonLdRecipe(html) : null;
    if (!jsonLd) {
      const botHtml = await fetchHtml(pageUrl, BOT_UA);
      if (botHtml) {
        const botJsonLd = extractJsonLdRecipe(botHtml);
        if (botJsonLd || !html) {
          html = botHtml;
          jsonLd = botJsonLd;
        }
      }
    }

    if (!html) {
      return new Response(JSON.stringify({ success: false, error: 'Kunde inte hämta sidan. Kontrollera länken.' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const meta = extractMetaTags(html);
    const text = htmlToText(html);

    let recipe: ParsedRecipe = jsonLd
      ? parseRecipeFromJsonLd(jsonLd, pageUrl)
      : {
          title: meta['og:title'] || '',
          description: meta['og:description'] || meta['description'] || '',
          ingredients: [],
          instructions: [],
          servings: null,
          prepTimeMinutes: null,
          cookTimeMinutes: null,
          imageUrl: absoluteUrl(meta['og:image'] || null, pageUrl),
          caloriesPerServing: null,
          proteinPerServing: null,
          carbsPerServing: null,
          fatPerServing: null,
          fiberPerServing: null,
        };

    // 2. Fill in gaps with AI when structured data is incomplete (zeta.nu, bloggar m.fl.)
    if (recipe.ingredients.length === 0 || recipe.instructions.length === 0 || !recipe.title) {
      const ai = await aiParsePage(text, meta, pageUrl);
      if (ai) {
        recipe = {
          ...recipe,
          title: recipe.title || ai.title || '',
          description: recipe.description || ai.description || '',
          servings: recipe.servings ?? ai.servings ?? null,
          prepTimeMinutes: recipe.prepTimeMinutes ?? ai.prepTimeMinutes ?? null,
          cookTimeMinutes: recipe.cookTimeMinutes ?? ai.cookTimeMinutes ?? null,
          ingredients: recipe.ingredients.length ? recipe.ingredients : ai.ingredients || [],
          instructions: recipe.instructions.length ? recipe.instructions : ai.instructions || [],
        };
      }
    }

    if (!recipe.imageUrl) recipe.imageUrl = absoluteUrl(meta['og:image'] || null, pageUrl);
    if (!recipe.servings) recipe.servings = 4;

    if (!recipe.title || recipe.ingredients.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Kunde inte tolka receptet automatiskt. Prova att kopiera receptet och klistra in det manuellt.',
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Estimate nutrition only when the source lacks it
    if (recipe.caloriesPerServing === null || recipe.proteinPerServing === null) {
      const est = await aiEstimateNutrition(recipe);
      if (est) {
        recipe.caloriesPerServing = recipe.caloriesPerServing ?? est.caloriesPerServing ?? null;
        recipe.proteinPerServing = recipe.proteinPerServing ?? est.proteinPerServing ?? null;
        recipe.carbsPerServing = recipe.carbsPerServing ?? est.carbsPerServing ?? null;
        recipe.fatPerServing = recipe.fatPerServing ?? est.fatPerServing ?? null;
        recipe.fiberPerServing = recipe.fiberPerServing ?? est.fiberPerServing ?? null;
        recipe.nutritionEstimated = true;
      }
    }

    return new Response(JSON.stringify({ success: true, recipe, source: jsonLd ? 'json-ld' : 'ai' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error scraping recipe:', error);
    return new Response(JSON.stringify({ success: false, error: 'Något gick fel vid receptimport' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
