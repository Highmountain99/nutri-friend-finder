import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Terms() {
  return (
    <div className="min-h-screen bg-white safe-area-inset">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/auth">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Användarvillkor</h1>
      </header>

      {/* Content */}
      <main className="px-6 py-8 max-w-lg mx-auto">
        <div className="prose prose-sm text-foreground/80 space-y-6">
          <p>
            Dessa användarvillkor gäller för din användning av EatSuite-appen och 
            tjänsterna som tillhandahålls av EatSuite AB.
          </p>

          <h2 className="text-lg font-semibold text-foreground">1. Tjänsten</h2>
          <p>
            EatSuite erbjuder digitala dietist- och kostrådgivningstjänster via 
            videosamtal och app-baserade verktyg för näringsspårning.
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. Användarkonto</h2>
          <p>
            För att använda tjänsten behöver du skapa ett konto med BankID. 
            Du ansvarar för att hålla dina inloggningsuppgifter säkra.
          </p>

          <h2 className="text-lg font-semibold text-foreground">3. Hälsoinformation</h2>
          <p>
            Informationen i appen ersätter inte professionell medicinsk rådgivning. 
            Kontakta alltid en läkare vid akuta hälsoproblem.
          </p>

          <h2 className="text-lg font-semibold text-foreground">4. Betalning</h2>
          <p>
            Priser och betalningsvillkor presenteras i samband med bokning. 
            Vissa tjänster kan vara kostnadsfria om de omfattas av regionen.
          </p>

          <h2 className="text-lg font-semibold text-foreground">5. Ändringar</h2>
          <p>
            Vi förbehåller oss rätten att uppdatera dessa villkor. 
            Väsentliga ändringar meddelas via appen eller e-post.
          </p>

          <p className="text-muted-foreground text-xs pt-4">
            Senast uppdaterad: Januari 2026
          </p>
        </div>
      </main>
    </div>
  );
}
