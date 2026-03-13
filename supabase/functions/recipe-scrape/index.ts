import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batchSize = 10 } = await req.json().catch(() => ({}));

    const { data: pendingRecipes, error: fetchError } = await supabase
      .from('recipe_import_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(batchSize);

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingRecipes || pendingRecipes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending recipes to scrape', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping ${pendingRecipes.length} recipes...`);

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const recipe of pendingRecipes) {
      try {
        await supabase.from('recipe_import_queue').update({ status: 'processing' }).eq('id', recipe.id);

        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: recipe.source_url, formats: ['markdown', 'html'], onlyMainContent: true, waitFor: 2000 }),
        });

        const scrapeData = await response.json();

        if (!response.ok || !scrapeData.success) {
          throw new Error(scrapeData.error || `Scrape failed with status ${response.status}`);
        }

        await supabase.from('recipe_import_queue').update({ 
          scraped_data: { markdown: scrapeData.data?.markdown, html: scrapeData.data?.html, metadata: scrapeData.data?.metadata },
          status: 'pending',
          processed_at: new Date().toISOString()
        }).eq('id', recipe.id);

        results.success++;
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error scraping ${recipe.source_url}:`, errorMsg);
        await supabase.from('recipe_import_queue').update({ status: 'failed', error_message: errorMsg, processed_at: new Date().toISOString() }).eq('id', recipe.id);
        results.failed++;
        results.errors.push(`${recipe.source_url}: ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Scraped ${results.success} recipes, ${results.failed} failed`, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recipe-scrape:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
