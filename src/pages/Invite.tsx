import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Heart, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Invite() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [dietitianName, setDietitianName] = useState("");
  const [mode, setMode] = useState<"info" | "signup">("info");
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const inviteCode = useMemo(() => {
    if (!code) return null;
    const match = code.match(/([a-f0-9]{6,})$/i);
    return match ? match[1] : code;
  }, [code]);

  const invitePath = code ? `/invite/${code}` : "/invite";
  const loginRedirectUrl = `/auth?openLogin=1&redirect=${encodeURIComponent(invitePath)}`;

  useEffect(() => {
    if (!inviteCode) return;

    (async () => {
      const { data, error } = await supabase.rpc("get_invitation_preview" as any, {
        _invite_code: inviteCode,
      } as any);

      const inv = Array.isArray(data) ? (data[0] as any) : null;

      if (error || !inv?.is_valid) {
        setLoading(false);
        return;
      }

      setInvitation(inv);

      if (inv.patient_email) {
        setForm((f) => ({ ...f, email: inv.patient_email }));
      }

      if (inv.dietitian_first_name) {
        setDietitianName(`${inv.dietitian_first_name} ${inv.dietitian_last_name ?? ""}`.trim());
      }
      setLoading(false);
    })();
  }, [inviteCode]);

  /** Accepts the invite, links the dietitian and sends the patient straight into the app. */
  const completeInvite = async () => {
    if (!inviteCode) {
      toast.error("Ogiltig inbjudningskod");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      navigate(loginRedirectUrl);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("accept_invitation_and_assign" as any, {
        _invite_code: inviteCode,
        _primary_concern: "general_health",
        _free_text: null,
      } as any);

      if (error) throw error;
      if (!data) {
        setFormError("Inbjudan kunde inte kopplas till det här kontot. Kontrollera att du använder samma e-postadress som inbjudan skickades till, eller logga in med rätt konto.");
        return;
      }

      navigate("/home", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Något gick fel");
    } finally {
      setSubmitting(false);
    }
  };

  /** Translates common auth errors into clear Swedish messages. */
  const friendlySignupError = (err: any): string => {
    const code = err?.code || "";
    const msg = (err?.message || "").toLowerCase();
    if (code === "weak_password" || msg.includes("weak") || msg.includes("password")) {
      return "Lösenordet är för svagt eller har läckt i tidigare intrång. Välj ett längre lösenord med blandade tecken, siffror och symboler.";
    }
    if (code === "user_already_exists" || msg.includes("already registered") || msg.includes("already been registered")) {
      return "Det finns redan ett konto med den här e-postadressen. Logga in istället via knappen nedan.";
    }
    if (msg.includes("invalid") && msg.includes("email")) {
      return "E-postadressen verkar inte vara giltig. Kontrollera stavningen.";
    }
    return "Något gick fel vid skapandet av kontot. Försök igen om en liten stund.";
  };

  const handleSignup = async () => {
    setFormError(null);
    if (!form.email || !form.password || !form.firstName) {
      setFormError("Fyll i alla obligatoriska fält");
      return;
    }
    if (form.password.length < 6) {
      setFormError("Lösenordet måste vara minst 6 tecken");
      return;
    }

    setSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}${invitePath}`,
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            invite_code: inviteCode,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Kunde inte skapa konto");

      if (!signUpData.session) {
        toast.success("Konto skapat! Bekräfta din e-post och logga in för att fortsätta.");
        navigate(loginRedirectUrl);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles" as any)
        .upsert(
          {
            user_id: signUpData.user.id,
            first_name: form.firstName,
            last_name: form.lastName,
          },
          { onConflict: "user_id" }
        );

      if (profileError) {
        console.error("Error upserting profile during invite signup:", profileError);
      }

      await completeInvite();
    } catch (err: any) {
      setFormError(friendlySignupError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-lg font-medium">Inbjudan hittades inte</p>
            <p className="text-sm text-muted-foreground">
              Länken kan ha gått ut eller redan använts.
            </p>
            <Button onClick={() => navigate("/")}>Gå till inloggning</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="max-w-md w-full shadow-elevated">
        <CardContent className="p-6 space-y-6">
          {mode === "info" ? (
            <>
              <div className="text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-xl font-bold">Välkommen till Gut Feeling</h1>
                {dietitianName && (
                  <p className="text-muted-foreground">
                    Du har blivit inbjuden av{" "}
                    <span className="font-medium text-foreground">{dietitianName}</span>
                  </p>
                )}
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Skapa ditt konto så är du igång direkt:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Direktkontakt med din dietist via chatt och videosamtal</li>
                  <li>Personlig kostplan och receptförslag</li>
                  <li>Smarta verktyg för att följa din hälsa</li>
                </ul>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={submitting}
                onClick={() => (user ? completeInvite() : setMode("signup"))}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {user ? "Fortsätt" : "Skapa konto"}
                {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>

              {!user ? (
                <p className="text-xs text-center text-muted-foreground">
                  Har du redan ett konto?{" "}
                  <button className="text-primary underline" onClick={() => navigate(loginRedirectUrl)}>
                    Logga in
                  </button>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-xl font-bold">Skapa ditt konto</h1>
                {dietitianName && (
                  <p className="text-sm text-muted-foreground">{dietitianName} blir din dietist</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Förnamn *</Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      placeholder="Anna"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Efternamn</Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      placeholder="Andersson"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-postadress *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="anna@email.com"
                    readOnly={!!invitation.patient_email}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lösenord *</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Minst 6 tecken"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSignup();
                    }}
                  />
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleSignup} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Skapa konto och kom igång
              </Button>

              <button
                className="w-full text-xs text-muted-foreground underline"
                onClick={() => setMode("info")}
              >
                Tillbaka
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
