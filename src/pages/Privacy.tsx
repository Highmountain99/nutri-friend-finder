import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white safe-area-inset">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/auth">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Integritetspolicy</h1>
      </header>

      {/* Content */}
      <main className="px-6 py-8 max-w-lg mx-auto">
        <div className="prose prose-sm text-foreground/80 space-y-6">
          <p>
            Din integritet är viktig för oss. Denna policy förklarar hur EatSuite AB 
            samlar in, använder och skyddar dina personuppgifter.
          </p>

          <h2 className="text-lg font-semibold text-foreground">1. Vilka uppgifter vi samlar in</h2>
          <p>
            Vi samlar in: namn, personnummer (via BankID), kontaktuppgifter, 
            hälsoinformation du delar med oss, och data från näringsspårning.
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. Hur vi använder uppgifterna</h2>
          <p>
            Uppgifterna används för att: tillhandahålla dietistvård, 
            förbättra tjänsten, skicka påminnelser och uppfylla lagkrav.
          </p>

          <h2 className="text-lg font-semibold text-foreground">3. Lagring och säkerhet</h2>
          <p>
            Vi lagrar data säkert enligt GDPR och patientdatalagen. 
            Journaler sparas enligt gällande arkiveringsregler.
          </p>

          <h2 className="text-lg font-semibold text-foreground">4. Dina rättigheter</h2>
          <p>
            Du har rätt att: begära tillgång till dina uppgifter, 
            rätta felaktiga uppgifter, och i vissa fall radera data.
          </p>

          <h2 className="text-lg font-semibold text-foreground">5. Kontakt</h2>
          <p>
            Har du frågor om hur vi hanterar dina personuppgifter? 
            Kontakta oss på privacy@eatsuite.se.
          </p>

          <p className="text-muted-foreground text-xs pt-4">
            Senast uppdaterad: Januari 2026
          </p>
        </div>
      </main>
    </div>
  );
}
