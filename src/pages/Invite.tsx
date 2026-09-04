import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Heart, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const display: React.CSSProperties = {
  fontFamily: "MentiDisplay, Anton, sans-serif",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "-0.01em",
};
const text: React.CSSProperties = {
  fontFamily: "MentiText, Manrope, sans-serif",
};

const ROW_ONE = [
  { label: "Kostråd från din PT", color: "#DCC08A" },
  { label: "Matdagbok", color: "#F5EFE2" },
  { label: "Chatt med din PT", color: "#8FAF7E" },
  { label: "Veckouppföljning", color: "#F5EFE2" },
  { label: "Proteinmål", color: "#D9A488" },
];
const ROW_TWO = [
  { label: "Måltidsmål", color: "#D9A488" },
  { label: "Recept", color: "#8FAF7E" },
  { label: "Feedback på måltider", color: "#F5EFE2" },
  { label: "Vanor & rutiner", color: "#DCC08A" },
  { label: "Din utveckling", color: "#F5EFE2" },
];

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        ...text,
        background: color,
        color: "#1F3A2E",
        borderRadius: 999,
        padding: "8px 16px",
        fontWeight: 600,
        fontSize: 13,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}


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
      setFormError("Något gick fel när inbjudan skulle aktiveras. Försök igen om en liten stund.");
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
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "#B7C4A9" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#1F3A2E" }} />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6" style={{ background: "#B7C4A9" }}>
        <div className="max-w-md w-full text-center space-y-4" style={{ color: "#1F3A2E" }}>
          <p className="text-lg font-semibold">Inbjudan hittades inte</p>
          <p className="text-sm opacity-70">Länken kan ha gått ut eller redan använts.</p>
          <button
            onClick={() => navigate("/")}
            className="rounded-full px-6 py-3 font-bold"
            style={{ background: "#1F3A2E", color: "#F5EFE2" }}
          >
            Gå till inloggning
          </button>
        </div>
      </div>
    );
  }

  if (mode === "info") {
    return (
      <div
        className="min-h-dvh flex flex-col safe-area-inset overflow-hidden"
        style={{ background: "#B7C4A9", color: "#1F3A2E" }}
      >
        {/* Topprad */}
        <div style={{ padding: "64px 24px 0" }}>
          <span style={{ ...display, fontSize: 18 }}>GUTFEELING</span>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center" style={{ padding: "0 24px" }}>
          <h1
            style={{
              ...display,
              fontSize: 46,
              lineHeight: 0.92,
              textWrap: "balance" as any,
              margin: 0,
            }}
          >
            TILLSAMMANS MOT DINA{" "}
            <span
              style={{
                background: "#DCC08A",
                borderRadius: 999,
                padding: "1px 14px 3px",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              MÅL
            </span>
            .
          </h1>
          <p
            style={{
              ...text,
              marginTop: 20,
              fontSize: 16,
              lineHeight: 1.5,
              maxWidth: "30ch",
            }}
          >
            Personlig vägledning från din PT, anpassad efter dig och din träning.
          </p>
        </div>

        {/* Chip-marquee */}
        <div className="flex flex-col overflow-hidden" style={{ gap: 8, padding: "0 0 12px" }}>
          <div className="gf-marquee-row gf-marquee-row--left">
            {[...ROW_ONE, ...ROW_ONE].map((c, i) => (
              <Chip key={`r1-${i}`} label={c.label} color={c.color} />
            ))}
          </div>
          <div className="gf-marquee-row gf-marquee-row--right">
            {[...ROW_TWO, ...ROW_TWO].map((c, i) => (
              <Chip key={`r2-${i}`} label={c.label} color={c.color} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col" style={{ padding: "12px 24px 40px" }}>
          <div
            className="self-center inline-flex items-center gap-2"
            style={{
              background: "#F5EFE2",
              borderRadius: "18px 18px 0 0",
              padding: "10px 18px 8px",
            }}
          >
            <span
              style={{ width: 8, height: 8, borderRadius: 999, background: "#5E7A4A", display: "block" }}
            />
            <span
              style={{
                ...text,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Inbjuden av {dietitianName || "din PT"}
            </span>
          </div>

          <button
            disabled={submitting}
            onClick={() => (user ? completeInvite() : setMode("signup"))}
            className="w-full rounded-full transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              background: "#1F3A2E",
              color: "#F5EFE2",
              ...text,
              fontWeight: 700,
              fontSize: 16,
              padding: "17px 20px",
            }}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Acceptera inbjudan
          </button>

          {formError && (
            <p className="text-center mt-3" style={{ ...text, fontSize: 12, color: "#7A2E2E" }}>
              {formError}
            </p>
          )}

          <p
            className="mx-auto text-center"
            style={{
              ...text,
              marginTop: 12,
              fontSize: 11,
              maxWidth: "36ch",
              color: "rgba(0,0,0,0.6)",
            }}
          >
            Genom att fortsätta godkänner du våra{" "}
            <Link to="/terms" className="underline">
              användarvillkor
            </Link>{" "}
            och vår{" "}
            <Link to="/privacy" className="underline">
              integritetspolicy
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4" style={{ background: "#B7C4A9" }}>
      <Card className="max-w-md w-full">
        <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-xl font-bold">Skapa ditt konto</h1>
                {dietitianName && (
                  <p className="text-sm text-muted-foreground">{dietitianName} blir din coach</p>
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

              {formError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {formError}
                </p>
              )}

              <Button className="w-full" size="lg" onClick={handleSignup} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Skapa konto och kom igång
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Har du redan ett konto?{" "}
                <button className="text-primary underline" onClick={() => navigate(loginRedirectUrl)}>
                  Logga in
                </button>
              </p>

              <button
                className="w-full text-xs text-muted-foreground underline"
                onClick={() => setMode("info")}
              >
                Tillbaka
              </button>
        </CardContent>

      </Card>
    </div>
  );
}
