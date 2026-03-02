import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BankIdLogo } from "./BankIdLogo";
import { OnboardingModal } from "./OnboardingModal";
import { LoginSheet } from "./LoginSheet";

export function AuthLanding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col safe-area-inset">
      {/* Main content - centered slogan */}
      <div className="flex-1 flex items-center justify-center px-6">
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground text-center leading-tight">
          Bättre vanor tillsammans.
        </h1>
      </div>

      {/* Bottom sticky area */}
      <div className="px-6 pb-8 pt-4 space-y-4 bg-white">
        {/* Primary button - Logga in */}
        <Button
          onClick={() => setShowLogin(true)}
          size="xl"
          className="w-full h-14 text-base font-medium relative"
        >
          Logga in
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            <BankIdLogo className="h-5 w-auto text-primary-foreground" />
          </span>
        </Button>

        {/* Secondary button - Ny användare */}
        <Button
          onClick={() => setShowOnboarding(true)}
          variant="outline"
          size="xl"
          className="w-full h-14 text-base font-medium"
        >
          Ny användare
        </Button>

        {/* Terms and privacy text */}
        <p className="text-sm text-muted-foreground text-center pt-2 pb-safe">
          Genom att fortsätta godkänner du våra{" "}
          <Link 
            to="/terms" 
            className="font-semibold underline text-foreground"
          >
            användarvillkor
          </Link>{" "}
          och vår{" "}
          <Link 
            to="/privacy" 
            className="font-semibold underline text-foreground"
          >
            integritetspolicy
          </Link>
          .
        </p>

        <button
          onClick={() => navigate("/dietitian")}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Logga in som dietist
        </button>
        
      </div>

      {/* Modals */}
      <OnboardingModal 
        open={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
      <LoginSheet 
        open={showLogin} 
        onClose={() => setShowLogin(false)} 
      />
    </div>
  );
}
