import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Heart, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

const CONCERN_OPTIONS = [
  { value: "weight_loss", label: "Viktnedgång" },
  { value: "gut_health", label: "Maghälsa" },
  { value: "diabetes", label: "Diabetes" },
  { value: "heart_health", label: "Hjärthälsa" },
  { value: "womens_health", label: "Kvinnohälsa" },
  { value: "eating_disorder", label: "Ätstörning" },
  { value: "emotional_eating", label: "Emotionellt ätande" },
  { value: "general_health", label: "Allmän hälsa" },
];

export default function Invite() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [dietitianName, setDietitianName] = useState("");
  const [mode, setMode] = useState<"info" | "signup" | "concern">("info");
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [signedUpUser, setSignedUpUser] = useState<any>(null);

  useEffect(() => {
    if (!code) return;
    const match = code.match(/([a-f0-9]{6,})$/);
    const inviteCode = match ? match[1] : code;

    (async () => {
      const { data, error } = await supabase
        .from("patient_invitations" as any)
        .select("*")
        .eq("invite_code", inviteCode)
        .eq("status", "pending")
        .limit(1);

      if (error || !data || data.length === 0) {
        setLoading(false);
        return;
      }

      const inv = data[0] as any;
      setInvitation(inv);

      if (inv.patient_email) {
        setForm((f) => ({ ...f, email: inv.patient_email }));
      }

      const { data: profile } = await supabase
        .from("dietitian_profiles")
        .select("first_name, last_name, title")
        .eq("user_id", inv.dietitian_id)
        .single();

      if (profile) {
        setDietitianName(`${profile.first_name} ${profile.last_name}`);
      }
      setLoading(false);
    })();
  }, [code]);

  const handleSignup = async () => {
    if (!form.email || !form.password || !form.firstName) {
      toast.error("Fyll i alla obligatoriska fält");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Lösenordet måste vara minst 6 tecken");
      return;
    }

    setSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { first_name: form.firstName, last_name: form.lastName, invite_code: code },
        },
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        await supabase.from("profiles" as any).insert({
          user_id: signUpData.user.id,
          first_name: form.firstName,
          last_name: form.lastName,
        });

        await supabase.from("dietist_patient_assignments" as any).insert({
          dietist_id: invitation.dietitian_id,
          patient_id: signUpData.user.id,
        });

        await supabase
          .from("patient_invitations" as any)
          .update({ status: "accepted", accepted_by: signUpData.user.id, accepted_at: new Date().toISOString() })
          .eq("id", invitation.id);

        // Save user reference and move to concern step
        setSignedUpUser(signUpData.user);
        setMode("concern");
      }
    } catch (err: any) {
      toast.error(err.message || "Något gick fel");
    } finally {
      setSubmitting(false);
    }
  };

  const finishWithConcern = async () => {
    if (!signedUpUser) return;
    setSubmitting(true);
    try {
      await supabase.from("intake_profiles" as any).insert({
        user_id: signedUpUser.id,
        completed_at: new Date().toISOString(),
        current_step: 9,
        care_seeker_type: "self",
        wants_dietist: true,
        triage_result: "approved",
        unified_concern_category: selectedConcern || "general_health",
        ai_free_text: freeText || null,
      });

      toast.success("Konto skapat! Välkommen till Gut Feeling.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Något gick fel");
    } finally {
      setSubmitting(false);
    }
  };

  const skipConcern = async () => {
    if (!signedUpUser) return;
    setSubmitting(true);
    try {
      await supabase.from("intake_profiles" as any).insert({
        user_id: signedUpUser.id,
        completed_at: new Date().toISOString(),
        current_step: 9,
        care_seeker_type: "self",
        wants_dietist: true,
        triage_result: "approved",
        unified_concern_category: "general_health",
      });

      toast.success("Konto skapat! Välkommen till EatSuite.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Något gick fel");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-lg font-medium">Inbjudan hittades inte</p>
            <p className="text-sm text-muted-foreground">
              Länken kan ha gått ut eller redan använts.
            </p>
            <Button onClick={() => navigate("/auth")}>Gå till inloggning</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="max-w-md w-full shadow-elevated">
        <CardContent className="p-6 space-y-6">
          {mode === "info" ? (
            <>
              <div className="text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-xl font-bold">Välkommen till EatSuite</h1>
                {dietitianName && (
                  <p className="text-muted-foreground">
                    Du har blivit inbjuden av <span className="font-medium text-foreground">{dietitianName}</span>
                  </p>
                )}
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Med EatSuite får du:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Direktkontakt med din dietist via chatt och videosamtal</li>
                  <li>Personlig kostplan och receptförslag</li>
                  <li>Smarta verktyg för att följa din hälsa</li>
                </ul>
              </div>

              <Button className="w-full" size="lg" onClick={() => setMode("signup")}>
                Skapa konto
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Har du redan ett konto?{" "}
                <button className="text-primary underline" onClick={() => navigate("/auth")}>
                  Logga in
                </button>
              </p>
            </>
          ) : mode === "signup" ? (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-xl font-bold">Skapa ditt konto</h1>
                {dietitianName && (
                  <p className="text-sm text-muted-foreground">
                    {dietitianName} blir din dietist
                  </p>
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
                  />
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSignup}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Fortsätt
              </Button>

              <button
                className="w-full text-xs text-muted-foreground underline"
                onClick={() => setMode("info")}
              >
                Tillbaka
              </button>
            </>
          ) : (
            /* Concern selection step */
            <>
              <div className="text-center space-y-2">
                <h1 className="text-xl font-bold">Vad vill du ha hjälp med?</h1>
                <p className="text-sm text-muted-foreground">
                  Välj det som bäst beskriver dig, eller skriv fritt nedan
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {CONCERN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedConcern(selectedConcern === opt.value ? null : opt.value)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                      selectedConcern === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {selectedConcern === opt.value && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                      <span>{opt.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Eller beskriv med egna ord</Label>
                <Textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="T.ex. jag vill äta bättre för att orka mer i vardagen..."
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={finishWithConcern}
                  disabled={submitting || (!selectedConcern && !freeText.trim())}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Fortsätt
                </Button>
                <button
                  className="w-full text-xs text-muted-foreground underline"
                  onClick={skipConcern}
                  disabled={submitting}
                >
                  Hoppa över
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
