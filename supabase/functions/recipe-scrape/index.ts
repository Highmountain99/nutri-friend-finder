import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { batchSize = 10 } = await req.json().catch(() => ({}));

    // Get pending recipes from queue
    const { data: pendingRecipes, error: fetchError } = await supabase
      .from('recipe_import_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(batchSize);

    if (fetchError) {
      console.error('Error fetching pending recipes:', fetchError);
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

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const recipe of pendingRecipes) {
      try {
        // Mark as processing
        await supabase
          .from('recipe_import_queue')
          .update({ status: 'processing' })
          .eq('id', recipe.id);

        console.log(`Scraping: ${recipe.source_url}`);

        // Scrape the recipe page
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: recipe.source_url,
            formats: ['markdown', 'html'],
            onlyMainContent: true,
            waitFor: 2000, // Wait for dynamic content
          }),
        });

        const scrapeData = await response.json();

        if (!response.ok || !scrapeData.success) {
          throw new Error(scrapeData.error || `Scrape failed with status ${response.status}`);
        }

        // Update queue with scraped data
        await supabase
          .from('recipe_import_queue')
          .update({ 
            scraped_data: {
              markdown: scrapeData.data?.markdown,
              html: scrapeData.data?.html,
              metadata: scrapeData.data?.metadata
            },
            status: 'pending', // Reset to pending for AI parsing
            processed_at: new Date().toISOString()
          })
          .eq('id', recipe.id);

        results.success++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error scraping ${recipe.source_url}:`, errorMsg);
        
        await supabase
          .from('recipe_import_queue')
          .update({ 
            status: 'failed',
            error_message: errorMsg,
            processed_at: new Date().toISOString()
          })
          .eq('id', recipe.id);

        results.failed++;
        results.errors.push(`${recipe.source_url}: ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Scraped ${results.success} recipes, ${results.failed} failed`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recipe-scrape:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
