import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { OnboardingModal } from "./OnboardingModal";
import { LoginSheet } from "./LoginSheet";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { useAuth } from "@/contexts/AuthContext";

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

export function AuthLanding() {
  const { session, isLoading } = useAuth();
  const nav = useNavigate();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!isLoading && session) {
      nav("/home", { replace: true });
    }
  }, [session, isLoading, nav]);

  const redirectParam = searchParams.get("redirect");
  const redirectTo = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/home";
  const shouldOpenLogin = searchParams.get("openLogin") === "1";

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(shouldOpenLogin);

  const sheetUp = showOnboarding;

  return (
    <div
      className="min-h-dvh flex flex-col safe-area-inset overflow-hidden relative"
      style={{ background: "#B7C4A9", color: "#1F3A2E" }}
    >
      <div
        className="flex-1 flex flex-col transition-all duration-[520ms]"
        style={{
          transformOrigin: "50% 42%",
          transform: sheetUp ? "scale(0.94)" : "scale(1)",
          opacity: sheetUp ? 0.5 : 1,
          transitionTimingFunction: "cubic-bezier(.16,1,.3,1)",
        }}
      >
        {/* Top wordmark */}
        <div style={{ padding: "64px 24px 0" }}>
          <span style={{ ...display, fontSize: 18 }}>GUTFEELING</span>
        </div>

        {/* Hero */}
        <div
          className="flex-1 flex flex-col justify-center"
          style={{ padding: "0 24px", marginTop: 8 }}
        >
          <h1
            style={{
              ...display,
              fontSize: 46,
              lineHeight: 1,
              textWrap: "balance" as any,
              margin: 0,
            }}
          >
            TILLSAMMANS MOT DINA{" "}
            <span
              style={{
                display: "inline-block",
                background: "#DCC08A",
                borderRadius: 999,
                padding: "1px 14px 3px",
                marginTop: 2,
                verticalAlign: "baseline",
              }}
            >
              MÅL
            </span>
            .
          </h1>
          <p
            style={{
              ...text,
              marginTop: 18,
              fontSize: 16,
              lineHeight: 1.5,
              maxWidth: "30ch",
            }}
          >
            Personlig vägledning från din PT, anpassad efter dig och din träning.
          </p>
        </div>

        {/* Chip marquee */}
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

        {/* Bottom action zone */}
        <div style={{ padding: "28px 24px 40px" }}>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="w-full rounded-full font-semibold transition-transform active:scale-[0.98]"
              style={{
                padding: "17px 20px",
                background: "#1F3A2E",
                color: "#F5EFE2",
                ...text,
                fontSize: 16.5,
                fontWeight: 700,
              }}
            >
              Logga in
            </button>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full rounded-full font-semibold transition-transform active:scale-[0.98]"
              style={{
                padding: "17px 20px",
                background: "transparent",
                border: "1.5px solid rgba(31,58,46,0.45)",
                color: "#1F3A2E",
                ...text,
                fontSize: 16.5,
                fontWeight: 700,
              }}
            >
              Ny användare
            </button>
          </div>

          <p
            className="mx-auto mt-5 text-center"
            style={{
              ...text,
              maxWidth: "36ch",
              fontSize: 11,
              lineHeight: 1.6,
              color: "rgba(0,0,0,0.6)",
            }}
          >
            Genom att fortsätta godkänner du våra{" "}
            <Link to="/terms" className="underline" style={{ textUnderlineOffset: 3 }}>
              användarvillkor
            </Link>{" "}
            och vår{" "}
            <Link to="/privacy" className="underline" style={{ textUnderlineOffset: 3 }}>
              integritetspolicy
            </Link>
            .
          </p>

          <div className="flex justify-center mt-5">
            <button
              onClick={() => navigate("/dietitian/login")}
              className="inline-flex items-center gap-2 whitespace-nowrap"
              style={{
                background: "transparent",
                ...text,
                fontSize: 11.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "#1F3A2E",
                opacity: 0.75,
              }}
            >
              Logga in som coach
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>

      <OnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <LoginSheet open={showLogin} onClose={() => setShowLogin(false)} redirectTo={redirectTo} />
      {!session && !showOnboarding && !showLogin && <InstallPrompt force />}
    </div>
  );
}
