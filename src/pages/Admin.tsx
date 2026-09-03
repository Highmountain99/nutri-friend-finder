import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Ticket, Copy, Check } from "lucide-react";

const Admin = () => {
  const { toast } = useToast();
  const [inviteCodes, setInviteCodes] = useState<any[]>([]);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchInviteCodes = async () => {
    const { data } = await supabase
      .from("dietitian_invite_codes" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInviteCodes(data);
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from("dietitian_invite_codes" as any)
        .insert({ created_by: user.id });

      if (error) {
        toast({ title: "Fel", description: "Kunde inte skapa inbjudningskod", variant: "destructive" });
        return;
      }

      toast({ title: "Kod skapad!", description: "En ny inbjudningskod har genererats" });
      fetchInviteCodes();
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-8">
      <div>
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Administration</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Coach-inbjudningar
            </CardTitle>
            <CardDescription>
              Skapa inbjudningskoder som nya coacher använder för att registrera sig
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGenerateCode} disabled={generatingCode}>
              {generatingCode ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ticket className="h-4 w-4 mr-2" />
              )}
              Skapa ny inbjudningskod
            </Button>

            {inviteCodes.length > 0 && (
              <div className="space-y-2">
                {inviteCodes.map((ic: any) => (
                  <div key={ic.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <code className="rounded bg-muted px-2 py-1 text-sm font-mono font-semibold">
                        {ic.code}
                      </code>
                      {ic.used_by ? (
                        <Badge variant="secondary">Använd</Badge>
                      ) : (
                        <Badge variant="outline" className="text-primary border-primary/30">Tillgänglig</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(ic.created_at).toLocaleDateString("sv-SE")}
                      </span>
                      {!ic.used_by && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyCode(ic.code)}
                        >
                          {copiedCode === ic.code ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
