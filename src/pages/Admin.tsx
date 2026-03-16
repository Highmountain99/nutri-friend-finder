import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { recipeImportApi } from "@/lib/api/recipeImport";
import { supabase } from "@/integrations/supabase/client";
import { 
  RefreshCw, 
  Search, 
  Download, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
  Trash2,
  Ticket,
  Copy,
  Check
} from "lucide-react";

interface ImportStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

const Admin = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<ImportStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [discoverLimit, setDiscoverLimit] = useState(100);
  const [searchFilter, setSearchFilter] = useState("");
  const [batchSize, setBatchSize] = useState(10);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const fetchStats = async () => {
    const data = await recipeImportApi.getStats();
    setStats(data);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleDiscover = async () => {
    setIsLoading("discover");
    setLastResult(null);
    
    try {
      const result = await recipeImportApi.discover({
        limit: discoverLimit,
        search: searchFilter || undefined,
      });

      if (result.success) {
        toast({
          title: "Recept hittade!",
          description: result.message || `Hittade ${result.stats?.discovered || 0} recept`,
        });
        setLastResult(`✅ ${result.message}\n\nStatistik:\n- Upptäckta: ${result.stats?.discovered || 0}\n- Redan i kö: ${result.stats?.already_queued || 0}\n- Redan importerade: ${result.stats?.already_imported || 0}\n- Nya i kö: ${result.stats?.new_to_queue || 0}`);
      } else {
        toast({
          title: "Fel vid sökning",
          description: result.error,
          variant: "destructive",
        });
        setLastResult(`❌ Fel: ${result.error}`);
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte köra discover",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
      fetchStats();
    }
  };

  const handleScrape = async () => {
    setIsLoading("scrape");
    setLastResult(null);

    try {
      const result = await recipeImportApi.scrape({ batchSize });

      if (result.success) {
        toast({
          title: "Scraping klar!",
          description: result.message,
        });
        setLastResult(`✅ ${result.message}\n\nResultat:\n- Lyckade: ${result.results?.success || 0}\n- Misslyckade: ${result.results?.failed || 0}`);
      } else {
        toast({
          title: "Fel vid scraping",
          description: result.error,
          variant: "destructive",
        });
        setLastResult(`❌ Fel: ${result.error}`);
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte köra scrape",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
      fetchStats();
    }
  };

  const handleParse = async () => {
    setIsLoading("parse");
    setLastResult(null);

    try {
      const result = await recipeImportApi.parse({ batchSize });

      if (result.success) {
        toast({
          title: "Parsing klar!",
          description: result.message,
        });
        setLastResult(`✅ ${result.message}\n\nResultat:\n- Parsade: ${result.results?.success || 0}\n- Importerade: ${result.results?.imported || 0}\n- Misslyckade: ${result.results?.failed || 0}`);
      } else {
        toast({
          title: "Fel vid parsing",
          description: result.error,
          variant: "destructive",
        });
        setLastResult(`❌ Fel: ${result.error}`);
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte köra parse",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
      fetchStats();
    }
  };

  const handleRunAll = async () => {
    setIsLoading("all");
    setLastResult("Kör alla steg...\n\n");

    try {
      // Step 1: Discover
      setLastResult(prev => prev + "1️⃣ Söker efter recept...\n");
      const discoverResult = await recipeImportApi.discover({
        limit: discoverLimit,
        search: searchFilter || undefined,
      });
      setLastResult(prev => prev + `   → ${discoverResult.message || discoverResult.error}\n\n`);

      if (discoverResult.success && (discoverResult.stats?.new_to_queue || 0) > 0) {
        // Step 2: Scrape
        setLastResult(prev => prev + "2️⃣ Scrapar receptsidor...\n");
        const scrapeResult = await recipeImportApi.scrape({ batchSize });
        setLastResult(prev => prev + `   → ${scrapeResult.message || scrapeResult.error}\n\n`);

        if (scrapeResult.success && (scrapeResult.results?.success || 0) > 0) {
          // Step 3: Parse
          setLastResult(prev => prev + "3️⃣ Parsar med AI...\n");
          const parseResult = await recipeImportApi.parse({ batchSize });
          setLastResult(prev => prev + `   → ${parseResult.message || parseResult.error}\n\n`);
          setLastResult(prev => prev + `✅ Klart! ${parseResult.results?.imported || 0} nya recept importerade.`);
        }
      } else {
        setLastResult(prev => prev + "ℹ️ Inga nya recept att importera.");
      }

      toast({
        title: "Import klar!",
        description: "Alla steg har körts",
      });
    } catch (error) {
      setLastResult(prev => prev + `\n❌ Fel: ${error}`);
      toast({
        title: "Fel",
        description: "Något gick fel under importen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
      fetchStats();
    }
  };

  const handleClearFailed = async () => {
    try {
      await recipeImportApi.clearFailed();
      toast({
        title: "Rensade misslyckade",
        description: "Alla misslyckade importer har tagits bort",
      });
      fetchStats();
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte rensa misslyckade",
        variant: "destructive",
      });
    }
  };

  const progressPercent = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Receptimport</h1>
        <p className="text-muted-foreground">Importera recept från ICA:s receptdatabas</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">Väntande</span>
          </div>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Bearbetar</span>
          </div>
          <p className="text-2xl font-bold">{stats.processing}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Klara</span>
          </div>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">Misslyckade</span>
          </div>
          <p className="text-2xl font-bold">{stats.failed}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Totalt</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
      </div>

      {stats.total > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

      {/* Import Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Steg 1: Hitta recept
            </CardTitle>
            <CardDescription>
              Använd Firecrawl för att hitta recept-URLer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="limit">Max antal recept</Label>
              <Input
                id="limit"
                type="number"
                value={discoverLimit}
                onChange={(e) => setDiscoverLimit(parseInt(e.target.value) || 100)}
                min={1}
                max={5000}
              />
            </div>
            <div>
              <Label htmlFor="search">Sökfilter (valfritt)</Label>
              <Input
                id="search"
                placeholder="t.ex. kyckling, pasta, vegan..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleDiscover}
              disabled={isLoading !== null}
              className="w-full"
            >
              {isLoading === "discover" ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Sök recept
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Steg 2 & 3: Hämta & Parsa
            </CardTitle>
            <CardDescription>
              Scrapa sidor och konvertera med AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="batchSize">Batch-storlek</Label>
              <Input
                id="batchSize"
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                min={1}
                max={50}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleScrape}
                disabled={isLoading !== null || stats.pending === 0}
                variant="outline"
              >
                {isLoading === "scrape" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Scrapa
              </Button>
              <Button 
                onClick={handleParse}
                disabled={isLoading !== null}
                variant="outline"
              >
                {isLoading === "parse" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Parsa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Snabbåtgärder</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button 
            onClick={handleRunAll}
            disabled={isLoading !== null}
            size="lg"
          >
            {isLoading === "all" ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Kör alla steg
          </Button>
          <Button 
            onClick={fetchStats}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera statistik
          </Button>
          {stats.failed > 0 && (
            <Button 
              onClick={handleClearFailed}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Rensa misslyckade ({stats.failed})
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Result Log */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Senaste resultat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-64">
              {lastResult}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Admin;
