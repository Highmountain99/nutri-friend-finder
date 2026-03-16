import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function DietitianLogin() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
        return;
      }

      // Check if user has dietist role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kunde inte hämta användare");
        return;
      }

      const { data: hasRole } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "dietist" as const,
      });

      if (!hasRole) {
        toast.error("Det här kontot har inte dietistbehörighet. Kontakta en administratör.");
        await supabase.auth.signOut();
        return;
      }

      navigate("/dietitian", { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Gut Feeling</h1>
            <p className="text-xs font-medium tracking-wider text-muted-foreground/60 uppercase">EatSuite</p>
            <p className="text-sm text-muted-foreground">
              Logga in som dietist
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anna@klinik.se"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Logga in
            </Button>
          </form>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
            <ShieldAlert className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dietistkonton skapas av en administratör. Kontakta din klinikadministratör om du behöver ett konto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
