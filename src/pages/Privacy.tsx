import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Privacy() {
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center gap-3 z-10">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Integritetspolicy</h1>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <main className="px-6 py-8 max-w-lg mx-auto pb-safe">
          <div className="prose prose-sm text-foreground/80 space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Integritetspolicy – EatSuite</h2>

            <h3 className="text-lg font-semibold text-foreground">Inledning</h3>
            <p>
              Varje vecka träffar tusentals klienter runt om i världen en Dietist och/eller Kostrådgivare 
              via EatSuite. Det innebär att EatSuite har ett stort ansvar – för att skydda dina uppgifter, 
              men också gentemot det nutritionella fältet och världen i stort. Vi måste kunna tolka den 
              stora mängden data och se till att använda den för att erbjuda alla våra klienter en ständigt 
              förbättrad vård.
            </p>
            <p>
              Genom att dela dina uppgifter med EatSuite hjälper du oss i vårt arbete med att göra behandlingen 
              av kostrelaterad och metabol ohälsa mer effektiv. Vi kommer att använda dina uppgifter för att 
              bättre förstå vilken typ av behandling som fungerar bäst och du spelar därmed en viktig roll i 
              utvecklingen av världens mest effektiva behandlingar inom nutrition och hälsa.
            </p>
            <p>
              Vi strävar efter att dela våra anonymiserade och aggregerade insikter med statliga organ, 
              forskningsinstitut och allmänheten så att EatSuite – med din hjälp – kan bidra till att förbättra 
              kost- och näringsvården för alla.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Introduktion till vår policy</h3>
            <p>
              Din integritet och säkerhet är av yttersta vikt för oss på EatSuite. Vi strävar efter att göra 
              vår policy tydlig och begriplig. Vi vill att du ska känna dig trygg med hur vi behandlar dina 
              personuppgifter.
            </p>
            <p>
              All behandling är strikt konfidentiell och din kommunikation med en Dietist och/eller 
              Kostrådgivare delas inte under några omständigheter med en obehörig part.
            </p>
            <p>
              Vi kan komma att uppdatera denna integritetspolicy från tid till annan till följd av juridisk, 
              teknisk eller affärsmässig utveckling. All information som samlas in av oss via webbplatsen 
              eller appen kommer att regleras av vår senaste integritetspolicy som finns publicerad på 
              webbplatsen och i appen. Om du har några frågor ber vi dig kontakta oss på privacy@eatsuite.se.
            </p>
            <p>
              EatSuite har utsett Bird & Bird DPO Services SRL till vårt dataskyddsombud (DPO). Om du har 
              frågor eller klagomål kring hur vi behandlar personuppgifter kan du kontakta DPO via 
              dpo@eatsuite.se.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">Adress:</p>
              <p>Bird & Bird DPO Services SRL</p>
              <p>Avenue Louise 235 b 1</p>
              <p>1050 Brussels, Belgium</p>
            </div>

            <h3 className="text-lg font-semibold text-foreground">Policyn</h3>
            <p>
              Denna integritetspolicy beskriver hur EatSuite samlar in och behandlar personuppgifter när du 
              använder EatSuites plattform ("Tjänsten") via app på Android- eller iOS-enhet ("Appen") eller 
              via webbplatsen https://eatsuite.se/ ("Webbplatsen").
            </p>
            <p>
              Dokumentet beskriver även dina rättigheter. Villkoren för användning av Tjänsten regleras i 
              våra Allmänna villkor.
            </p>
            <p>
              EatSuite är registrerad vårdgivare under tillsyn av Inspektionen för vård och omsorg (IVO) och 
              arbetar uteslutande med legitimerade Dietister och/eller Kostrådgivare vars vårdgivaransvar 
              omfattas av gällande svensk hälso- och sjukvårdslagstiftning, inklusive:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Hälso- och sjukvårdslagen (2017:30)</li>
              <li>Patientlagen (2014:821)</li>
              <li>Patientsäkerhetslagen (2010:659)</li>
              <li>Patientdatalagen (2008:355)</li>
            </ul>
            <p>
              Den vård du får via Appen tillhandahålls av en vårdcentral som EatSuite är underleverantör till. 
              Dina vårdkontakter registreras hos relevant vårdcentral. Vid kontakt med en Dietist och/eller 
              Kostrådgivare registreras därför besöket i din journal.
            </p>
            <p>
              När du använder Tjänsten är EatSuite personuppgiftsansvarig och behandlar personuppgifter i 
              enlighet med GDPR och annan tillämplig lagstiftning.
            </p>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">Personuppgiftsansvarig:</p>
              <p>EatSuite AB</p>
              <p>Organisationsnummer: 559150-0722</p>
              <p>Hovslagargatan 3</p>
              <p>111 48 Stockholm</p>
              <p>Sverige</p>
            </div>

            <h2 className="text-lg font-semibold text-foreground">1. Behandling nödvändig för att tillhandahålla hälso- och sjukvård</h2>
            
            <h4 className="text-base font-medium text-foreground">1.1 Personuppgifter</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Namn, personnummer, telefonnummer, e-post</li>
              <li>Demografiska uppgifter (län, kommun, listning)</li>
              <li>Hälsouppgifter om fysisk och psykisk hälsa</li>
              <li>Journalanteckningar, självskattningsformulär, IKBT-program</li>
              <li>Ingen inspelning av ljud, bild eller video</li>
            </ul>

            <h4 className="text-base font-medium text-foreground">1.2 Ändamål</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Identifiering och ålderskontroll</li>
              <li>Akuthantering</li>
              <li>Tillhandahållande av kost- och nutritionsbehandling</li>
              <li>Uppföljning och utvärdering av behandling</li>
            </ul>

            <h4 className="text-base font-medium text-foreground">1.3 Rättslig grund</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Rättslig förpliktelse (GDPR 6.1 c)</li>
              <li>GDPR 9.2 h och patientdatalagen</li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground">2. Behandling nödvändig för att tillhandahålla Tjänsten</h2>
            
            <h4 className="text-base font-medium text-foreground">Personuppgifter</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kontakt- och adressuppgifter</li>
              <li>Betalningsinformation</li>
              <li>Tekniska data (enhet, IP, bokningar, status)</li>
            </ul>

            <h4 className="text-base font-medium text-foreground">Ändamål</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Administration av konto och betalning</li>
              <li>Planering av möten</li>
              <li>Anpassning av användarupplevelse</li>
            </ul>

            <h4 className="text-base font-medium text-foreground">Rättslig grund</h4>
            <p>Avtal (GDPR 6.1 b)</p>

            <h2 className="text-lg font-semibold text-foreground">3. Kommunikation</h2>
            
            <h4 className="text-base font-medium text-foreground">Ändamål</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kontakta dig vid tekniska problem eller uteblivna möten</li>
              <li>Skicka viktig information om Tjänsten</li>
            </ul>

            <h4 className="text-base font-medium text-foreground">Rättslig grund</h4>
            <p>Avtal (GDPR 6.1 b)</p>

            <h2 className="text-lg font-semibold text-foreground">4. Marknadsföring</h2>
            
            <h4 className="text-base font-medium text-foreground">Personuppgifter</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kontaktuppgifter</li>
              <li>Cookiedata</li>
              <li>Hälsouppgifter (endast vid uttryckligt samtycke)</li>
            </ul>

            <h4 className="text-base font-medium text-foreground">Ändamål</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nyhetsbrev och information</li>
              <li>Riktad marknadsföring</li>
            </ul>

            <h4 className="text-base font-medium text-foreground">Rättslig grund</h4>
            <p>Samtycke (GDPR 6.1 a, 9.2 a)</p>

            <h2 className="text-lg font-semibold text-foreground">5. Utvärdering och förbättring av Tjänsten</h2>
            
            <h4 className="text-base font-medium text-foreground">Ändamål</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Förbättra användarupplevelse</li>
              <li>Analysera behandlingsresultat</li>
              <li>Forskning och statistik (pseudonymiserad och aggregerad)</li>
            </ul>

            <h4 className="text-base font-medium text-foreground">Rättslig grund</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Berättigat intresse (GDPR 6.1 f)</li>
              <li>Samtycke för hälsodata (GDPR 9.2 a)</li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground">6. Customer service</h2>
            
            <h4 className="text-base font-medium text-foreground">Ändamål</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Support och felsökning</li>
              <li>Hantering av klagomål</li>
            </ul>

            <h4 className="text-base font-medium text-foreground">Rättslig grund</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Avtal (GDPR 6.1 b)</li>
              <li>GDPR 9.2 h vid vårdrelaterade ärenden</li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground">7. Företagstjänster och försäkring</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Endast aggregerad, anonym statistik delas</li>
              <li>Minst 15 användare krävs för rapportering</li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground">8. Spårning och annonsering</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>App-användning</li>
              <li>Reklam-ID</li>
              <li>Samtyckesbaserad behandling</li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground">9. Forskning</h2>
            
            <h4 className="text-base font-medium text-foreground">Personuppgifter</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Demografiska uppgifter</li>
              <li>Hälsodata</li>
              <li>Självskattningar</li>
            </ul>

            <h4 className="text-base font-medium text-foreground">Rättslig grund</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Allmänt intresse (GDPR 6.1 e)</li>
              <li>GDPR 9.2 h</li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground">10. Kvalitetssäkring</h2>
            
            <h4 className="text-base font-medium text-foreground">Ändamål</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Patientsäkerhet</li>
              <li>Årlig patientsäkerhetsrapport</li>
            </ul>

            <h4 className="text-base font-medium text-foreground">Rättslig grund</h4>
            <p>Rättslig förpliktelse (GDPR 6.1 c)</p>

            <h2 className="text-lg font-semibold text-foreground">Lagring av uppgifter</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Konto: tills radering eller 2 års inaktivitet</li>
              <li>Journal: 10 år enligt lag</li>
              <li>Supportärenden: 365 dagar</li>
              <li>Betalningsdata: minst 7 år</li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground">Dina rättigheter</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tillgång och dataportabilitet</li>
              <li>Rättelse och radering</li>
              <li>Begränsning och invändning</li>
              <li>Återkalla samtycke</li>
              <li>Klagomål till IMY</li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground">Kontakt</h2>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p>📧 privacy@eatsuite.se</p>
              <p>📍 EatSuite AB, Hovslagargatan 3, 111 48 Stockholm</p>
            </div>
            
            <p className="pt-4">Klagomål kan lämnas till:</p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">Integritetsskyddsmyndigheten (IMY)</p>
              <p>Box 8114, 104 20 Stockholm</p>
              <p>https://www.imy.se</p>
            </div>

            <p className="text-muted-foreground text-xs pt-8">
              Senast uppdaterad: Januari 2026
            </p>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
}
