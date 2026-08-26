import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { OnboardingModal } from "./OnboardingModal";
import { LoginSheet } from "./LoginSheet";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { useAuth } from "@/contexts/AuthContext";

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

  // iOS-style: dim & scale the splash when the onboarding sheet is up
  const sheetUp = showOnboarding;

  return (
    <div
      className="min-h-dvh flex flex-col safe-area-inset overflow-hidden relative"
      style={{ background: "#EBE5D6" }}
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
        {/* Wordmark zone */}
        <div className="flex-1 flex flex-col items-center justify-center px-9 text-center">
          <h1
            className="m-0 font-serif"
            style={{
              fontFamily: '"Instrument Serif", serif',
              fontWeight: 400,
              fontSize: "clamp(64px, 18vw, 96px)",
              lineHeight: 0.95,
              color: "#1F3A2E",
              letterSpacing: "-0.01em",
            }}
          >
            Gut<span className="italic">feeling</span>
          </h1>
          <p
            className="mt-5 italic"
            style={{
              fontFamily: '"Instrument Serif", serif',
              fontSize: 25,
              color: "#2D4F3E",
            }}
          >
            Lita på din magkänsla.
          </p>
        </div>

        {/* Bottom action zone */}
        <div
          className="px-7 pt-6 pb-12"
          style={{ borderTop: "1px solid rgba(31,42,34,0.12)" }}
        >
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="w-full rounded-full font-semibold transition-transform active:scale-[0.98]"
              style={{
                padding: "17px 20px",
                background: "#142319",
                color: "#EBE5D6",
                fontFamily: "Geist, sans-serif",
                fontSize: 16.5,
                boxShadow: "0 10px 26px -14px rgba(20,35,25,0.7)",
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
                border: "1.5px solid rgba(31,42,34,0.34)",
                color: "#142319",
                fontFamily: "Geist, sans-serif",
                fontSize: 16.5,
              }}
            >
              Ny användare
            </button>
          </div>

          <p
            className="mx-auto mt-5 text-center"
            style={{
              maxWidth: "34ch",
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 10.5,
              lineHeight: 1.7,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#2D4F3E",
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
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 11.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#6F8A6C",
              }}
            >
              Logga in som dietist
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
