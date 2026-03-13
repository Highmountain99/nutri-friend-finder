import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Terms() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center gap-3 z-10">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/auth">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Användarvillkor</h1>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <main className="px-6 py-8 max-w-lg mx-auto pb-safe">
          <div className="prose prose-sm text-foreground/80 space-y-6">
            <p>
              Genom att använda Gut Feelings Tjänster godkänner du dessa Allmänna villkor (nedan kallat "Avtalet"). 
              Läs Avtalet noggrant innan du använder Gut Feelings Tjänster (enligt definitionen i punkt 2.1). 
              Om du inte accepterar Avtalet ska du inte använda Gut Feelings Tjänster.
            </p>

            <h2 className="text-lg font-semibold text-foreground">1. Avtalets omfattning och tillämplighet</h2>
            
            <h3 className="text-base font-medium text-foreground">1.1</h3>
            <p>
              Detta Avtal reglerar användningen av onlinegränssnitt och egendom (till exempel webbplats och appar) 
              som ägs och kontrolleras av EatSuite AB (nedan kallat "EatSuite", "vi", "oss" och "vår"), inklusive 
              EatSuites appar (nedan kallat "Appen") och webbplatserna eatsuitecare.com och eatsuite.se 
              (tillsammans "Webbplatsen"), samt Tjänsterna som är tillgängliga för Användare och Dietister 
              och/eller Kostrådgivare (enligt definitionen nedan) via Appen och/eller Webbplatsen.
            </p>

            <h3 className="text-base font-medium text-foreground">1.2</h3>
            <p>
              EatSuite är registrerad vårdgivare (nedan kallat "Vårdgivare") under tillsyn av Inspektionen för 
              vård och omsorg (IVO) och arbetar uteslutande med etablerade, legitimerade dietister och/eller 
              kvalificerade kostrådgivare i enlighet med gällande krav.
            </p>

            <h2 className="text-lg font-semibold text-foreground">2. Tjänster</h2>
            
            <h3 className="text-base font-medium text-foreground">2.1</h3>
            <p>
              Du registrerar dig som användare (nedan kallat "Användare", "du" och "din") genom att skapa ett 
              personligt konto (nedan kallat "Användarkonto") och använder det kontot för att boka ett möte med 
              en legitimerad dietist och/eller kvalificerad kostrådgivare (nedan kallat "Dietist/Kostrådgivare") 
              och/eller använda andra Tjänster som tillhandahålls i Appen eller på Webbplatsen, inklusive, men 
              inte begränsat till, internetbaserade program för kost- och livsstilsförändring (nedan kallat 
              "IKL-program") och digitala rådgivningssamtal med Dietist/Kostrådgivare (nedan kallat "Tjänster"). 
              Appen kan också användas för självmonitorering (t.ex. matdagbok, måltidsvanor, symptom, aktivitet 
              och andra relevanta uppgifter).
            </p>
            <p>
              Det bokade mötet sker genom ett videosamtal via Appen och/eller Webbplatsen. Under videosamtalet 
              kan Användaren beskriva sitt tillstånd mer ingående för Dietist/Kostrådgivaren. Användaren kan 
              också lämna information om sitt tillstånd via sitt personliga Användarkonto. Baserat på Användarens 
              uppgifter föreslår Dietist/Kostrådgivaren lämpliga åtgärder inom kost, nutrition och livsstil, 
              exempelvis måltidsplanering, beteendestöd, utbildning, uppföljning och vid behov rekommendation 
              att kontakta annan vårdinstans.
            </p>

            <h3 className="text-base font-medium text-foreground">2.2</h3>
            <p>
              EatSuite har avtal med Paean Hälsa AB om digitala vårdtjänster mellan Dietister/Kostrådgivare och 
              deras patienter. Den vård som du som patient får via Appen tillhandahålls av en vårdcentral till 
              vilken EatSuite är en underleverantör. Dina vårdkontakter registreras hos följande vårdcentral: 
              Frösjö Vårdcentral, Sörmland. I samband med kontakt med en Dietist/Kostrådgivare registreras 
              därför vårdbesöket i din journal som ett besök på den aktuella vårdcentralen.
            </p>

            <h3 className="text-base font-medium text-foreground">2.3</h3>
            <p>
              EatSuite erbjuder Användare kost- och nutritionsrådgivning på primärvårdsnivå. Detta motsvarar den 
              vårdnivå som normalt kan erbjudas via en vårdcentral. EatSuite kan därför inte erbjuda vård som 
              kräver specialistkompetens, avancerad medicinsk utredning, akuta insatser eller specialistbehandling 
              (t.ex. vid allvarliga medicinska tillstånd eller svåra ätstörningar). Det betyder att 
              Dietist/Kostrådgivaren kan komma att avbryta rådgivningen om Dietist/Kostrådgivaren bedömer att 
              EatSuite inte är rätt vårdnivå för Användaren.
            </p>

            <h3 className="text-base font-medium text-foreground">2.4</h3>
            <p>
              Om Användaren använder Tjänsten i detta Avtal genom abonnemang, ersättnings- eller löneförmån, 
              centralt upphandlat avtal via arbetsgivare eller liknande gäller inte bestämmelserna i punkt 4.1–4.3, 
              kapitel 7 och punkt 11.1, utan ett separat avtal ska gälla i dessa fall.
            </p>

            <h3 className="text-base font-medium text-foreground">2.5</h3>
            <p>
              Detta Avtal och annan information om EatSuites Tjänster finns i Appen och på Webbplatsen.
            </p>

            <h3 className="text-base font-medium text-foreground">2.6</h3>
            <p>
              Vid allvarliga sjukdomssymtom eller tillstånd som kräver akut eller omfattande medicinsk bedömning 
              är EatSuite inte rätt vårdnivå, utan Användaren ska då söka adekvat vård via till exempel vårdcentral 
              eller akutmottagning. I en akut situation (t.ex. allvarliga bröstsmärtor, andningssvårigheter, 
              misstänkt allvarlig allergisk reaktion, kraftig uttorkning, eller annan akutsituation) ska 
              Användaren inte heller vända sig till EatSuite, utan till en adekvat akut instans alternativt 
              ringa 112 för vägledning och råd. Vid misstanke om allvarlig ätstörning, snabb försämring eller 
              annan situation som kräver specialistvård ska Användaren kontakta vården skyndsamt.
            </p>

            <h2 className="text-lg font-semibold text-foreground">3. Appen, Webbplatsen och Användarkonto</h2>

            <h3 className="text-base font-medium text-foreground">3.1</h3>
            <p>
              Användarkontot är personligt och får endast användas av den Användare som har registrerat 
              Användarkontot. Ett Användarkonto får inte överlåtas till eller användas av en annan person.
            </p>

            <h3 className="text-base font-medium text-foreground">3.2</h3>
            <p>
              Användaren ansvarar för all aktivitet som sker genom Användarens Användarkonto.
            </p>

            <h3 className="text-base font-medium text-foreground">3.3</h3>
            <p>
              EatSuite ansvarar inte för otillåten användning av ett Användarkonto av en extern person och inte 
              heller för eventuella konsekvenser och/eller skada som uppstår av sådan användning.
            </p>

            <h3 className="text-base font-medium text-foreground">3.4</h3>
            <p>
              För att kunna skapa ett Användarkonto måste Användaren vara minst 18 år gammal och ha tillgång 
              till BankID för identifiering.
            </p>

            <h3 className="text-base font-medium text-foreground">3.5</h3>
            <p>
              Användaren ansvarar för att tillämpa rimlig omsorg vid tillhandahållandet av uppgifter, inklusive 
              kontaktuppgifter och hälsouppgifter i förekommande fall, när Avtalet ingås. EatSuite ansvarar inte 
              för rådgivning eller åtgärder som påverkas av att Användaren anger felaktiga uppgifter. Användaren 
              förbinder sig att hålla sin personliga profil i Appen uppdaterad och aktuell under hela 
              avtalsperioden. EatSuite ska snarast meddelas om eventuella ändringar genom en uppdatering direkt 
              i Appen eller via e-post till info@eatsuite.se.
            </p>

            <h3 className="text-base font-medium text-foreground">3.6</h3>
            <p>
              Användaren är personligen ansvarig för den information som hen tillhandahåller i eller genom Appen 
              och/eller på Webbplatsen. Mer information om hur EatSuite hanterar personuppgifter finns i EatSuites 
              integritetspolicy som finns tillgänglig i Appen eller på Webbplatsen.
            </p>

            <h3 className="text-base font-medium text-foreground">3.7</h3>
            <p>
              Genom att registrera ett Användarkonto i Appen och/eller på Webbplatsen bekräftar och accepterar 
              Användaren de tekniska specifikationer, villkor och restriktioner för Appen och/eller Webbplatsen 
              som anges i EatSuites aktuella beskrivningar av Tjänsten, vilka finns tillgängliga i Appen 
              och/eller på Webbplatsen.
            </p>

            <h3 className="text-base font-medium text-foreground">3.8</h3>
            <p>
              Genom att registrera ett Användarkonto i Appen och/eller på Webbplatsen bekräftar och godkänner 
              Användaren att EatSuite kan använda de kontaktuppgifter som Användaren har angett för att kontakta 
              Användaren genom utskick (post eller e-post), telefonsamtal, meddelanden och notiser med information 
              och erbjudanden. Användaren kan när som helst avregistrera sig från marknadsföringskommunikation 
              (enligt definitionen i punkt 13). Läs mer om hur EatSuite lagrar information och behandlar 
              personuppgifter i Integritetspolicyn.
            </p>

            <h3 className="text-base font-medium text-foreground">3.9</h3>
            <p>
              För att kunna använda Tjänsten måste Användaren ge Appen och/eller Webbplatsen tillgång till ljud 
              och bild på Användarens enhet och vara ansluten till ett nätverk. Ljud och rörliga bilder raderas 
              i realtid och sparas inte på något sätt efter mötet. Information om Användarens möten med 
              Dietist/Kostrådgivare och information som Användaren laddar upp till Tjänsten genom frågeformulär 
              registreras och sparas i Användarens journal för att ge Användaren insyn i vården och för att 
              uppfylla våra juridiska skyldigheter. I samband med tillhandahållandet av Tjänsten kan administrativ 
              personal göra administrativa anteckningar i journalen. Läs mer om lagring av journaler och hur vi 
              behandlar personuppgifter i vår integritetspolicy.
            </p>

            <h3 className="text-base font-medium text-foreground">3.10</h3>
            <p>
              Innehåll som EatSuite publicerar eller tillhandahåller i Appen och/eller på Webbplatsen kan användas 
              som en del av Tjänsten eller som förebyggande egenvård. IKL-program som används som en del av 
              Tjänsten är ett komplement till Tjänsten som Dietist/Kostrådgivaren erbjuder Användaren och är 
              inte avsedda att användas i stället för en Dietist/Kostrådgivares professionella bedömning. 
              IKL-program är avsedda att användas som ett hjälpmedel för att Dietist/Kostrådgivaren ska kunna 
              ge Användaren effektiv kost- och nutritionsrelaterad vård och rådgivning.
            </p>

            <h3 className="text-base font-medium text-foreground">3.11</h3>
            <p>
              Användaren ansvarar för att Användarkontot används i enlighet med detta Avtal, övriga villkor och 
              instruktioner i Appen och/eller på Webbplatsen och i enlighet med gällande lag vid varje given tidpunkt.
            </p>

            <h2 className="text-lg font-semibold text-foreground">4. Priser och betalning</h2>

            <h3 className="text-base font-medium text-foreground">4.1</h3>
            <p>
              Tjänsterna i Appen tillhandahålls till det pris som framgår av vid var tid gällande prislista i 
              Appen. Tjänsternas pris framgår alltid innan Användaren gör en bokning eller påbörjar ett IKL-program.
            </p>

            <h3 className="text-base font-medium text-foreground">4.2</h3>
            <p>
              Användare kan inte påbörja ett videosamtal innan betalningsmetoden för samtalet har bekräftats. 
              Genom att använda Tjänsten godkänner du att bli fakturerad enligt det svenska hälso- och 
              sjukvårdsregleringssystemet. EatSuite förbehåller sig rätten att ta ut påminnelseavgift. 
              Vid utebliven betalning lämnas ärendet vidare till inkasso.
            </p>

            <h3 className="text-base font-medium text-foreground">4.3</h3>
            <p>
              Frikort gäller på EatSuite och EatSuite är ansluten till e-frikortstjänsten för de regioner där 
              det är tillämpligt. Om en Användare har ett elektroniskt frikort kommer uppgifterna att samlas 
              in genom e-frikortstjänsten. Frikort i pappersformat gäller också och Användaren kan uppge 
              frikortsnumret vid bokning/betalning. EatSuite registrerar endast patientavgifter om Användaren 
              är folkbokförd i en region som är ansluten till e-frikortstjänsten.
            </p>

            <h3 className="text-base font-medium text-foreground">4.4 Betalningsvillkor för företag</h3>
            <p>
              EatSuite har särskilda erbjudanden för företag som vill erbjuda Tjänsterna till sina anställda. 
              Pris- och betalningsvillkor för dessa Tjänster beskrivs i detalj i de särskilda villkor som 
              EatSuite skickar till företaget för godkännande. Genom att acceptera dessa särskilda villkor 
              förbinder sig företaget att kommunicera detta Avtal till de anställda som använder Tjänsterna.
            </p>

            <h3 className="text-base font-medium text-foreground">4.5 Betalningsvillkor för privat rådgivning</h3>
            <p>
              EatSuite har ett erbjudande för privat rådgivning som privatpersoner kan köpa på webbplatsen. 
              Användaren kan köpa samtalspaket som ger tillgång till Tjänsterna i Appen. Betalning sker på 
              Webbplatsen och Användaren får en kod via e-post inom en (1) arbetsdag. Koden ska användas 
              som betalning i Appen.
            </p>
            <p>
              Användaren kan begära full återbetalning inom fjorton (14) dagar efter köpet, utan någon särskild 
              anledning. Om koden har använts som betalning för ett videosamtal i Appen kan Användaren endast 
              få återbetalning i de fall Dietist/Kostrådgivaren avråder från ytterligare samtal efter det första 
              samtalet. I ovannämnda fall kommer Användaren att få tillbaka hela beloppet exklusive priset för 
              ett videosamtal, vilket är 800 kr. Om mer än ett videosamtal har genomförts eller om Användaren 
              har påbörjat ett IKL-program, görs ingen återbetalning. Kontakta EatSuites Customer Service för 
              att begära återbetalning.
            </p>

            <h2 className="text-lg font-semibold text-foreground">5. Ansvarsbegränsning</h2>

            <h3 className="text-base font-medium text-foreground">5.1</h3>
            <p>
              Inom de gränser som anges i detta kapitel 5 ansvarar EatSuite för att Appen och/eller Webbplatsen 
              är tillgänglig i enlighet med punkterna 5.2, 5.3 och 5.5 nedan. EatSuite ansvarar dessutom för 
              lagring av den information som tillhandahålls och laddas upp i Appen och/eller på Webbplatsen 
              av Användaren och Dietist/Kostrådgivaren.
            </p>

            <h3 className="text-base font-medium text-foreground">5.2</h3>
            <p>
              EatSuites mål är att se till att Appen och/eller Webbplatsen upprätthåller en hög nivå av 
              tillgänglighet och att Användaren har tillgång till sitt Användarkonto när som helst på dygnet. 
              Videosamtalen bokas av Användaren via de bokningsfunktioner som tillhandahålls via Appens och/eller 
              Webbplatsens bokningssystem eller av Dietist/Kostrådgivaren. Appen och videosamtalen tillhandahålls 
              i enlighet med ovanstående, med undantag för planerade avbrott för underhåll som annonserats i 
              Appen i förväg eller avbrott utanför EatSuites kontroll.
            </p>

            <h3 className="text-base font-medium text-foreground">5.3</h3>
            <p>
              EatSuite ska inte ansvara för eventuella avbrott i Tjänsten eller tillgängligheten som uppstått 
              på grund av: i) fel i Användarens hårdvara/utrustning, anslutande nätverk, Användarens programvara 
              eller fel i programvara som utgör tredjepartsprodukt och som EatSuite inte kan avhjälpa, trots 
              att vi på ett fackmannamässigt sätt försökt åtgärda eller kringgå dem, ii) andra omständigheter 
              som Användaren är ansvarig för enligt Avtalet, iii) virus eller andra angrepp på säkerheten trots 
              att EatSuite har vidtagit professionella åtgärder, eller iv) omständigheter som utgör force majeure 
              enligt kapitel 12 nedan.
            </p>

            <h3 className="text-base font-medium text-foreground">5.4</h3>
            <p>
              Fel eller avbrott i Appens funktion eller tillgänglighet kan utan dröjsmål anmälas till EatSuites 
              Customer Service på info@eatsuite.se eller via Appen. Customer Service är tillgängliga 08:00-17:00 
              på vardagar (med undantag för helgdagar).
            </p>

            <h3 className="text-base font-medium text-foreground">5.5</h3>
            <p>
              EatSuite ska ansvara för driften av Appen och/eller Webbplatsen, inklusive tillhandahållande av 
              videosamtal mellan Användare och Dietister/Kostrådgivare och Tjänster som är förknippade med detta, 
              som lagring av information och annan information som EatSuite tillhandahåller i Appen och/eller 
              på Webbplatsen.
            </p>

            <h3 className="text-base font-medium text-foreground">5.6</h3>
            <p>
              EatSuite ansvarar inte för innehållet i länkar i Appen och/eller på Webbplatsen.
            </p>

            <h3 className="text-base font-medium text-foreground">5.7</h3>
            <p>
              Eventuella fel ska i första hand åtgärdas genom felsökning, om det kan göras utan onödiga kostnader 
              eller olägenheter för EatSuite. EatSuite har alltid rätt att på egen bekostnad rätta felet, förutsatt 
              att detta kan göras inom rimlig tid och utan betydande olägenhet för Användaren. Om felet inte kan 
              avhjälpas har Användaren rätt till ett rimligt prisavdrag och ersättning för bevisad, direkt skada 
              enligt de begränsningar som anges nedan.
            </p>

            <h3 className="text-base font-medium text-foreground">5.8</h3>
            <p>
              Under inga omständigheter ska EatSuite ansvara för skador på grund av fel som orsakats av Användaren 
              eller någon omständighet som Användaren är ansvarig för. I den utsträckning det är möjligt enligt 
              gällande lagstiftning: (i) ska EatSuites totala ansvar enligt detta Avtal vara begränsat under alla 
              omständigheter till ansvar för styrkt, direkt skada och till ett maximalt belopp motsvarande tolv 
              tusen (12 000) kronor; och (ii) ska EatSuite under inga omständigheter ansvara för eventuella 
              följdskador, utebliven inkomst, utebliven förväntad besparing och/eller andra indirekta skador 
              enligt detta Avtal.
            </p>

            <h3 className="text-base font-medium text-foreground">5.9</h3>
            <p>
              EatSuite åtar sig att följa och upprätthålla det ansvar för Appen som följer av lagen (2002:562) 
              om elektronisk handel och andra informationssamhällets tjänster och lagen (2005:59) om distansavtal 
              och avtal utanför affärslokaler.
            </p>

            <h2 className="text-lg font-semibold text-foreground">6. Immateriella rättigheter</h2>

            <h3 className="text-base font-medium text-foreground">6.1</h3>
            <p>
              Upphovsrätt, äganderätt och andra immateriella rättigheter till EatSuites varumärken, företagsnamn, 
              Appen och samtliga dokument som används och/eller tillhandahålls av EatSuite i Appen eller på vår 
              Webbplats tillhör EatSuite med ensamrätt. Det innebär att EatSuite har rätt att fritt förfoga över 
              sådana immateriella rättigheter.
            </p>

            <h3 className="text-base font-medium text-foreground">6.2</h3>
            <p>
              All kopiering, ändring, överlåtelse och/eller annan användning av EatSuites material som inte 
              uttryckligen skriftligen medgivits av EatSuite är förbjuden. Användaren är införstådd med och 
              samtycker till att otillåten användning av EatSuites immateriella rättigheter utgör ett brott 
              mot detta Avtal. I synnerhet är det förbjudet för Användaren att på något sätt, direkt och/eller 
              indirekt, reproducera, anpassa, ändra, omvandla, översätta, publicera och kommunicera delar av 
              Appen och/eller Webbplatsen.
            </p>

            <h3 className="text-base font-medium text-foreground">6.3</h3>
            <p>
              Alla immateriella rättigheter som uppstår som ett resultat av EatSuites tillhandahållande av 
              Appen och/eller andra Tjänster tillfaller EatSuite med alla rättigheter förbehållna. Sådana 
              ensamrätter omfattar EatSuites rätt att fritt förfoga över sådana resultat, inklusive rätten 
              att fritt ändra, överföra och bevilja dem.
            </p>

            <h3 className="text-base font-medium text-foreground">6.4</h3>
            <p>
              Bestämmelserna i detta kapitel 6 ska gälla oavsett på vilket sätt och i vilken form resultaten 
              producerades och oavsett om resultaten producerades av EatSuite ensamt eller som ett samarbete. 
              Bestämmelserna i detta kapitel gäller även efter det att Avtalet mellan EatSuite och Användaren 
              har upphört att gälla.
            </p>

            <h2 className="text-lg font-semibold text-foreground">7. Bokning och avbokning av videosamtal</h2>

            <h3 className="text-base font-medium text-foreground">7.1</h3>
            <p>
              Användaren får endast boka videosamtal med en (1) Dietist/Kostrådgivare åt gången och det är 
              förbjudet att boka flera tider med olika Dietister/Kostrådgivare parallellt. Efter ett avslutat 
              videosamtal med en Dietist/Kostrådgivare kan Användaren boka en tid med en annan Dietist/Kostrådgivare.
            </p>

            <h3 className="text-base font-medium text-foreground">7.2</h3>
            <p>
              Ett bokat videosamtal kan avbokas kostnadsfritt fram till 24 timmar innan videosamtalets starttid. 
              Om avbokning sker inom denna tid återbetalar EatSuite avgiften för det avbokade videosamtalet 
              inom fjorton (14) dagar.
            </p>

            <h3 className="text-base font-medium text-foreground">7.3</h3>
            <p>
              Om Användaren avbokar senare än 24 timmar innan bokad tid eller uteblir från videosamtalet, får 
              Användaren betala en avgift på 410 kronor för uteblivet besök. Denna avgift gäller även om du 
              har frikort eller om du har bokat ett besök till reducerat pris. Om Användaren ansluter till 
              videosamtalet och avbryter samtalet får Användaren betala avgift för uteblivet besök eftersom 
              videosamtalet inte kan anses vara genomfört. Användaren får en faktura via e-post och i appen. 
              Betalningsvillkor är 30 dagar från fakturadatum. EatSuite förbehåller sig rätten att ta ut 
              påminnelseavgift och dröjsmålsränta om inte betalning sker enligt villkoren.
            </p>

            <h3 className="text-base font-medium text-foreground">7.4</h3>
            <p>
              EatSuite förbehåller sig rätten att neka en Användare att boka samtal eller använda andra 
              Tjänster om Användaren inte helt eller delvis har fullgjort betalning för en tidigare bokning 
              eller användning av andra Tjänster, eller om det finns en pågående betalningstvist.
            </p>

            <h3 className="text-base font-medium text-foreground">7.5</h3>
            <p>
              Om Användaren använder Tjänsten genom till exempel abonnemang, ersättnings- eller löneförmån, 
              centralt upphandlat avtal via arbetsgivare eller liknande gäller andra avbokningsregler enligt 
              separat avtal.
            </p>

            <h3 className="text-base font-medium text-foreground">7.6</h3>
            <p>
              Om Användaren använder Tjänsten genom vårt privata erbjudande och uteblir eller avbokar senare 
              än 24 timmar innan bokad tid anses samtalet förbrukat och ingen återbetalning görs.
            </p>

            <h2 className="text-lg font-semibold text-foreground">8. Otillåten användning</h2>

            <h3 className="text-base font-medium text-foreground">8.1</h3>
            <p>
              EatSuite ser allvarligt på all otillåten användning av Appen och/eller Webbplatsen och 
              Användarkontot i strid med detta Avtal och/eller våra vid varje given tidpunkt gällande 
              policyer avseende databehandling, säkerhet, etik etc. EatSuite kommer att vidta åtgärder mot 
              faktisk eller befarad obehörig användning av Appen och/eller Webbplatsen, Användarkontot etc. 
              Potentiella scenarier för obehörig användning som kan resultera i åtgärder inkluderar men är 
              inte begränsat till:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Att boka samtal med flera Dietister/Kostrådgivare parallellt.</li>
              <li>Att byta Dietist/Kostrådgivare mer än tre gånger under en rådgivningsperiod (om det inte motiveras av särskilda krav på insatsen).</li>
              <li>Att avboka eller utebli från samtal upprepade gånger.</li>
              <li>Att boka samtal med en Dietist/Kostrådgivare trots tidigare hänvisning till annan instans eller trots att EatSuites Dietist/Kostrådgivare gjort den professionella bedömningen att EatSuite inte är en lämplig insats för Användaren.</li>
              <li>Att kontakta Dietisten/Kostrådgivaren via Dietistens/Kostrådgivarens privata sociala medier, e-post, telefon etc.</li>
              <li>Att filma vårdpersonal under en session, om det inte godkänts av vårdpersonalen.</li>
              <li>Att fortsätta köra bil eller hantera tunga maskiner under ett samtal trots uppmaning att inte göra det.</li>
              <li>Att ta videosamtalet i en miljö som inte uppfyller kraven på att vara lugn, väl upplyst och privat, vilket kan hindra kommunikationen mellan Dietist/Kostrådgivare och patient och äventyra integriteten.</li>
              <li>Att använda applikationen med en otillräcklig eller instabil internetuppkoppling, vilket leder till avbrutna samtal och påverkar rådgivningskvaliteten.</li>
              <li>Att Dietist/Kostrådgivaren känner sig hotad på grund av (men inte begränsat till): skrikande, svordomar, otillbörlig fysisk exponering, rasistiska påhopp, diskriminerande mikroaggressioner och riktade hot.</li>
            </ul>

            <h3 className="text-base font-medium text-foreground">8.2</h3>
            <p>
              EatSuite förbehåller sig rätten att ta bort information från Appen och/eller Webbplatsen, stänga 
              Användarkontot eller vidta andra åtgärder om Användaren bryter mot Avtalet eller för att skydda 
              EatSuites rykte och/eller för att skydda Appen och/eller Webbplatsen från olämplig användning 
              när som helst med eller utan föregående varning eller meddelande och utan ansvar för eventuella 
              konsekvenser. I händelse av en sådan stängning har EatSuite också rätt att säga upp Avtalet i 
              enlighet med kapitel 11 nedan.
            </p>

            <h3 className="text-base font-medium text-foreground">8.3</h3>
            <p>
              I fall där Användaren bryter mot Avtalet eller tillämplig lag eller om hen har använt Appen 
              och/eller Webbplatsen på ett olagligt sätt eller på ett sätt som inte är tillåtet, är Användaren 
              skyldig att kompensera och ersätta EatSuite för all skada som därigenom åsamkas EatSuite 
              (inklusive men inte begränsat till ombudskostnader, rättegångskostnader och alla anspråk från 
              tredje part).
            </p>

            <h2 className="text-lg font-semibold text-foreground">9. Skydd av personuppgifter</h2>

            <h3 className="text-base font-medium text-foreground">9.1</h3>
            <p>
              Bestämmelserna om behandlingen av Användarens personuppgifter finns i EatSuites Integritetspolicy, 
              tillgänglig i Appen och/eller på Webbplatsen.
            </p>

            <h2 className="text-lg font-semibold text-foreground">10. Ändring av funktion och villkor</h2>

            <h3 className="text-base font-medium text-foreground">10.1</h3>
            <p>
              EatSuite förbehåller sig rätten att göra ändringar i Tjänsterna som erbjuds i Appen och/eller 
              på Webbplatsen. De Tjänster som tillhandahålls i Appen och/eller på Webbplatsen, inklusive men 
              inte begränsat till, beskrivningar, bilder, referenser, specifikationer i layout, innehåll, 
              egenskaper eller funktioner, kan ändras, vilket kan innebära att Avtalet påverkas. När utvecklingen 
              av nya Tjänster påverkar detta Avtal kommer Användaren att informeras om ändringarna i Appen 
              och/eller på Webbplatsen eller via e-post och kan uppmanas att samtycka till ändringen av de 
              Allmänna villkoren.
            </p>

            <h3 className="text-base font-medium text-foreground">10.2</h3>
            <p>
              Detta avtal, som kan uppdateras från tid till annan, ska gälla från och med att det accepteras 
              av Användaren, under den tid som Användaren använder Tjänsten, eller tills EatSuite stänger ned 
              kontot i enlighet med uppsägningsbestämmelserna nedan. De allmänna villkor som gäller vid varje 
              tidpunkt finns tillgängliga i Appen och/eller på Webbplatsen.
            </p>

            <h3 className="text-base font-medium text-foreground">10.3</h3>
            <p>
              I händelse av vägran av Avtalet erkänner Användaren uttryckligen att hen inte kommer att kunna 
              komma åt de tjänster som erbjuds via Appen och/eller Webbplatsen.
            </p>

            <h2 className="text-lg font-semibold text-foreground">11. Meddelande om uppsägning</h2>

            <h3 className="text-base font-medium text-foreground">11.1</h3>
            <p>
              Användaren har alltid rätt att säga upp Avtalet med omedelbar verkan. Om meddelande om uppsägning 
              lämnas kommer EatSuite att ta bort Användarens Användarkonto och ta bort information om Användaren 
              som tillhandahålls och lagras, utan onödigt dröjsmål. Viss information kan behållas för att uppfylla 
              rättsliga skyldigheter i enlighet med EatSuites integritetspolicy. Om Användaren har bokat ett 
              möte med en Dietist/Kostrådgivare som infaller efter uppsägningstidpunkten måste mötet avbokas 
              enligt de vanliga avbokningsreglerna.
            </p>

            <h3 className="text-base font-medium text-foreground">11.2</h3>
            <p>
              EatSuite har rätt att säga upp Avtalet eller blockera Användarkontot med omedelbar verkan om 
              Användaren bryter mot eller sannolikt förväntas bryta mot detta Avtal. Vid en sådan uppsägning 
              stängs Användarens Användarkonto, och Avtalet upphör automatiskt att gälla. Information om 
              Användaren som lagras i Appen kommer att raderas eller anonymiseras i enlighet med sekretesspolicyn. 
              Om blockering har bedömts vara nödvändigt gäller följande tidsramar:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>3 månader:</strong> vid upprepade uteblivna besök eller sena avbokningar, bokning av flera Dietister/Kostrådgivare parallellt eller upprepade byten av Dietist/Kostrådgivare.</li>
              <li><strong>6 månader:</strong> om Användaren fortsätter att boka nya videosamtal trots tidigare hänvisning till annan vårdinstans.</li>
              <li><strong>12 månader:</strong> vid kränkande beteende gentemot Dietist/Kostrådgivaren eller annan anställd på EatSuite.</li>
              <li><strong>Livstid:</strong> vid upprepat kränkande beteende mot EatSuites Dietister/Kostrådgivare eller en enstaka kränkande händelse av så allvarlig grad att avstängning på obestämd tid bedöms vara nödvändig.</li>
            </ul>

            <h3 className="text-base font-medium text-foreground">11.3</h3>
            <p>
              Användare som har fått sitt Användarkonto stängt i enlighet med punkt 11.2 har ingen rätt att 
              omregistrera sig eller registrera sig för ett nytt Användarkonto utan att erhålla särskilt 
              tillstånd från EatSuite för detta ändamål.
            </p>

            <h3 className="text-base font-medium text-foreground">11.4</h3>
            <p>
              EatSuite har rätt att när som helst säga upp Avtalet med trettio (30) dagars varsel om EatSuite 
              inte längre kan tillhandahålla Tjänsterna till Användaren, särskilt på grund av tekniska eller 
              operativa orsaker utanför EatSuites kontroll eller på grund av nedläggning av EatSuites Tjänster. 
              Dessutom har EatSuite rätt att, när det krävs enligt lag eller på grund av säkerhetsproblem, när 
              som helst och utan föregående meddelande avbryta eller avsluta funktioner eller ta bort hela eller 
              delar av Appen och/eller Webbplatsen om EatSuite anser det tillrådligt.
            </p>

            <h3 className="text-base font-medium text-foreground">11.5</h3>
            <p>
              EatSuite har rätt att avsluta Användarkontot om det inte har använts på 24 månader.
            </p>

            <h2 className="text-lg font-semibold text-foreground">12. Force majeure</h2>

            <h3 className="text-base font-medium text-foreground">12.1</h3>
            <p>
              EatSuite betalar inte ersättning till följd av strejker, brand, utövande av offentlig makt, 
              arbetskonflikter, olyckor, fel eller förseningar hos underleverantörer, avbrott i offentliga 
              kommunikationssystem eller andra omständigheter utanför EatSuites kontroll som EatSuite inte 
              rimligen kunde förväntas ha räknat med och vars konsekvenser EatSuite inte rimligen kunde ha 
              undvikit eller övervunnit. Om en omständighet enligt denna punkt fortsätter att gälla under en 
              period som överstiger trettio (30) dagar har en part rätt att säga upp Avtalet med omedelbar 
              verkan. Under sådana omständigheter har Användaren rätt till återbetalning av belopp som betalats 
              i förväg för videomöten som bokats men som inte ägt rum.
            </p>

            <h2 className="text-lg font-semibold text-foreground">13. Marknadsföring av tjänster och produkter</h2>

            <h3 className="text-base font-medium text-foreground">13.1</h3>
            <p>
              EatSuite har rätt att skicka marknadsföringsmejl och push-notiser till Användare för att dela 
              information om produkter eller Tjänster. Användaren kan när som helst avregistrera sig från alla 
              e-postlistor och avbryta denna form av kommunikation.
            </p>

            <h2 className="text-lg font-semibold text-foreground">14. Meddelanden och notifikationer</h2>

            <h3 className="text-base font-medium text-foreground">14.1</h3>
            <p>
              Användaren ska i Användarkontot ange den e-postadress och det telefonnummer till vilka hen vill 
              att EatSuite emellanåt ska kunna skicka meddelanden, som bekräftelser och information om erbjudna 
              produkter och tjänster.
            </p>

            <h3 className="text-base font-medium text-foreground">14.2</h3>
            <p>
              Meddelande om uppsägning enligt detta Avtal måste skickas via e-post.
            </p>

            <h3 className="text-base font-medium text-foreground">14.3</h3>
            <p>
              Meddelanden enligt detta Avtal ska anses ha mottagits av mottagaren:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>om de skickas via e-post: när mottagandet vederbörligen bekräftas, vilket kan ske t.ex genom ett läskvitto</li>
              <li>om de skickas via Appen: den första (1) dagen efter avsändningsdagen</li>
              <li>om de skickas till registrerad adress: fem (5) arbetsdagar efter avsändandet, eller</li>
              <li>om det levereras med budfirma: vid överlämnandet.</li>
            </ul>

            <h3 className="text-base font-medium text-foreground">14.4</h3>
            <p>
              Användaren måste meddela EatSuite utan dröjsmål om hen ändrar sina kontaktuppgifter genom att 
              uppdatera dem via Användarkontot eller skicka meddelande till info@eatsuite.se.
            </p>

            <h3 className="text-base font-medium text-foreground">14.5</h3>
            <p>
              När Användaren använder Appen och/eller Webbplatsen eller Tjänsterna, eller skickar e-post, 
              meddelanden och annan kommunikation till EatSuite, kommunicerar Användaren med EatSuite 
              elektroniskt. Användaren godkänner att hen genom att använda eller gå in i Appen och/eller på 
              Webbplatsen eller använda Tjänsterna, samtycker till att göra affärer med EatSuite elektroniskt 
              och Användaren godkänner att (a) alla avtal och samtycken kan undertecknas elektroniskt och 
              (b) alla meddelanden, upplysningar och annan kommunikation som EatSuite tillhandahåller Användaren 
              elektroniskt uppfyller alla juridiska krav på att sådana meddelanden och annan kommunikation ska 
              vara skriftlig.
            </p>

            <h2 className="text-lg font-semibold text-foreground">15. Överlåtelse av avtalet och skyldigheter enligt avtalet</h2>

            <h3 className="text-base font-medium text-foreground">15.1</h3>
            <p>
              Användaren har ingen rätt att överlåta detta Avtal eller rättigheter och/eller skyldigheter som 
              följer av detta Avtal till någon annan person.
            </p>

            <h3 className="text-base font-medium text-foreground">15.2</h3>
            <p>
              EatSuite har obegränsad rätt att anlita underleverantörer för att fullgöra sina skyldigheter 
              enligt detta Avtal.
            </p>

            <h2 className="text-lg font-semibold text-foreground">16. Tillämplig lag och lösning av tvister</h2>

            <h3 className="text-base font-medium text-foreground">16.1</h3>
            <p>
              Tvister som uppstår i samband med tolkningen och tillämpningen av detta avtal och det rättsliga 
              förhållandet i anslutning till detta ska avgöras i enlighet med svensk lag av allmän domstol, 
              med Stockholms tingsrätt som första instans om inget annat avtalats.
            </p>

            <h3 className="text-base font-medium text-foreground">16.2</h3>
            <p>
              Om någon del eller bestämmelse i detta Avtal anses vara ogiltig eller icke verkställbar av 
              behörig domstol, ska denna del av Avtalet begränsas eller avlägsnas i minimal omfattning så 
              att Avtalet i övrigt förblir gällande och verkställbart.
            </p>

            <h3 className="text-base font-medium text-foreground">16.3</h3>
            <p>
              Vid indrivning av betalning som grundar sig på betalningsskyldighet enligt detta Avtal får 
              ärendet hänskjutas till Kronofogdemyndigheten eller annat indrivningsförfarande, utan hinder 
              av vad som i övrigt föreskrivs i detta kapitel.
            </p>

            <h3 className="text-base font-medium text-foreground">16.4</h3>
            <p>
              Om du har klagomål relaterade till EatSuites Tjänster (t.ex. något som omfattas av detta Avtal 
              eller vår Integritetspolicy) vänligen kontakta oss på info@eatsuite.se så kommer vi att sträva 
              efter att svara dig inom 28 dagar för att lösa ditt klagomål, eller skicka det till den vårdcentral 
              där vårdbesöket registreras, patientnämnden i din region eller, i tillämpliga fall, till IVO.
            </p>

            <p className="text-muted-foreground text-xs pt-8">
              Senast uppdaterad: Januari 2026
            </p>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
}
