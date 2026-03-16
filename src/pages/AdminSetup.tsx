import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function AdminSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [setupKey, setSetupKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Du måste vara inloggad för att aktivera admin.");
      return;
    }

    if (!setupKey.trim()) {
      toast.error("Ange din setup-nyckel");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-admin", {
        body: { setupKey: setupKey.trim() },
      });

      if (error) {
        // Try to parse error body for message
        toast.error("Ogiltig setup-nyckel eller en admin finns redan.");
        return;
      }

      if (data?.success) {
        toast.success("Du är nu administratör!");
        navigate("/admin", { replace: true });
      } else {
        toast.error(data?.error || "Något gick fel");
      }
    } catch (e: any) {
      toast.error(e.message || "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin-setup</h1>
            <p className="text-sm text-muted-foreground">
              Ange den hemliga setup-nyckeln för att bli den första administratören.
              Detta kan bara göras en gång.
            </p>
          </div>

          {!user ? (
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Du måste vara inloggad först.
              </p>
              <Button onClick={() => navigate("/auth")} variant="outline">
                Logga in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setupKey">Setup-nyckel</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="setupKey"
                    type="password"
                    value={setupKey}
                    onChange={(e) => setSetupKey(e.target.value)}
                    placeholder="Ange din hemliga nyckel"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Aktivera admin
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
