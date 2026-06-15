import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BankIdLogo } from "./BankIdLogo";
import { OnboardingModal } from "./OnboardingModal";
import { LoginSheet } from "./LoginSheet";
import { useAuth } from "@/contexts/AuthContext";

export function AuthLanding() {
  const { session, isLoading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!isLoading && session) {
      nav("/home", { replace: true });
    }
  }, [session, isLoading, nav]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const redirectParam = searchParams.get("redirect");
  const redirectTo = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/home";
  const shouldOpenLogin = searchParams.get("openLogin") === "1";

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(shouldOpenLogin);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-inset">
      {/* Top meta strip */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <span className="eyebrow">{"\n"}</span>
        <span className="eyebrow opacity-60">{"\n"}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow mb-6">{"\n"}</p>
        <h1 className="font-serif text-primary text-[clamp(64px,18vw,128px)] leading-[0.86] tracking-[-0.035em]">
          Gut<span className="italic">feeling</span>
        </h1>
        <p className="lede text-xl md:text-2xl mt-8 max-w-[22ch]">
          Lita på din magkänsla.
        </p>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3 bg-background border-t border-border">
        <Button onClick={() => setShowLogin(true)} size="xl" className="w-full h-14 text-base font-medium rounded-full">
          Logga in
        </Button>

        <Button onClick={() => setShowOnboarding(true)} variant="outline" size="xl" className="w-full h-14 text-base font-medium rounded-full border-primary/30 text-primary hover:bg-secondary">
          Ny användare
        </Button>

        <p className="eyebrow text-[10px] text-center pt-4 pb-safe opacity-70 normal-case tracking-normal" style={{ fontFamily: 'Geist, sans-serif', letterSpacing: 0 }}>
          Genom att fortsätta godkänner du våra{" "}
          <Link to="/terms" className="underline text-primary">
            användarvillkor
          </Link>{" "}
          och vår{" "}
          <Link to="/privacy" className="underline text-primary">
            integritetspolicy
          </Link>
          .
        </p>

        <div className="flex justify-center">
          <button
            onClick={() => navigate("/dietitian/login")}
            className="eyebrow opacity-60 hover:opacity-100 transition-opacity"
          >
            Logga in som dietist →
          </button>
        </div>
      </div>

      <OnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <LoginSheet open={showLogin} onClose={() => setShowLogin(false)} redirectTo={redirectTo} />
    </div>
  );
}
