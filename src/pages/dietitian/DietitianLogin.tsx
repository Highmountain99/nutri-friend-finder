import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Mode = "login" | "register";

export default function DietitianLogin() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
        toast.error("Det här kontot har inte dietistbehörighet. Registrera dig som ny dietist istället.");
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

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Fyll i för- och efternamn");
      return;
    }

    setLoading(true);
    try {
      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dietitian`,
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      if (!signUpData.user) {
        toast.error("Kunde inte skapa konto");
        return;
      }

      // Call edge function to set up dietitian role + profile
      const { error: setupError } = await supabase.functions.invoke("setup-dietitian", {
        body: {
          userId: signUpData.user.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      });

      if (setupError) {
        toast.error("Konto skapades men det gick inte att ställa in dietistprofil. Kontakta support.");
        return;
      }

      toast.success("Konto skapat! Kontrollera din e-post för att verifiera kontot.");
      setMode("login");
    } catch (e: any) {
      toast.error(e.message || "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") handleLogin();
    else handleRegister();
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
            <h1 className="text-2xl font-bold text-foreground">EatSuite Pro</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "Logga in som dietist" : "Skapa dietistkonto"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Förnamn</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Anna"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Efternamn</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Svensson"
                    required
                  />
                </div>
              </div>
            )}

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
              {mode === "login" ? "Logga in" : "Skapa konto"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Ny dietist?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="font-semibold text-foreground underline"
                >
                  Skapa konto
                </button>
              </>
            ) : (
              <>
                Har redan konto?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-semibold text-foreground underline"
                >
                  Logga in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
