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

  // Verify admin role using service role key
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
    // Verify admin authentication
    const authResult = await verifyAdmin(req);
    if (authResult instanceof Response) return authResult;

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { limit = 100, search } = await req.json().catch(() => ({}));

    console.log('Starting recipe discovery with Firecrawl MAP...');

    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.ica.se/recept/',
        search: search,
        limit: Math.min(limit, 5000),
        includeSubdomains: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl MAP error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipeUrls = (data.links || []).filter((url: string) => {
      return url.match(/\/recept\/[a-z0-9-]+-\d+\/?$/i);
    });

    console.log(`Found ${recipeUrls.length} recipe URLs`);

    const { data: existingUrls } = await supabase
      .from('recipe_import_queue')
      .select('source_url');
    
    const existingSet = new Set((existingUrls || []).map(r => r.source_url));
    
    const { data: importedRecipes } = await supabase
      .from('recipes')
      .select('source_url')
      .not('source_url', 'is', null);
    
    const importedSet = new Set((importedRecipes || []).map(r => r.source_url));

    const newUrls = recipeUrls.filter((url: string) => 
      !existingSet.has(url) && !importedSet.has(url)
    );

    if (newUrls.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new recipes to import',
          stats: { discovered: recipeUrls.length, already_queued: existingSet.size, already_imported: importedSet.size, new_to_queue: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: insertError } = await supabase
      .from('recipe_import_queue')
      .insert(newUrls.map((url: string) => ({ source_url: url, status: 'pending' })));

    if (insertError) {
      console.error('Error inserting to queue:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Queued ${newUrls.length} recipes for import`,
        stats: { discovered: recipeUrls.length, already_queued: existingSet.size, already_imported: importedSet.size, new_to_queue: newUrls.length }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recipe-discover:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
