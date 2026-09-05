# Gut Feeling - PT

Appbeskrivning 

I första hand är EatSuite är en app som gör det enkelt för människor att snabbt få digital behandling och kontinuerlig hjälp av dietister och/eller kostrådgivare. 
Det är också en plattform där man på ett interaktivt sätt kan följa sin kost och hälsa genom ett tilltalande gränssnitt. Du kan hitta recept som passar dina behov, kostrådgivning i allmänhet och genom att använda appen inspireras till bättre hälsa. 
Appen är en vårdgivare och kommer få sina intäkter från regionerna där patienter som får hjälp har sin hemvist. 
Appen är öppen även för personer som inte per definition behöver vård utan i allmänhet vill förbättra sin hälsa. Dessa kommer att falla under en separat intäktsmodell som är marknadsekonomisk och inte baserad på ersättningsmodeller via vården. Denna ersättning kommer med stor sannolikhet att vara högre och patienten/användaren ska avgränsas i ett tidigt skede av UX:en. De marknadsekonomiska ersättningsmodellerna kan för kunden gå att ta på sitt friskvårdsbidrag via jobbet eller sin privata försäkring. Detta ska det finnas funktioner för också, smidiga format för insändning av kvitton till exempel.
Appen kommer linjera väl med rådande hälsotrender och vara perfekt för de som vill monitorera sina hälsoframsteg, likt Strava för löpning. Däremot finns ingen ambition att införa sociala mediefunktioner utan appen är till för användarens bästa. 
Tonen ska vara hälsosam och stöttande och inte uppfordrande, det är din stöttande vän. Det sista vi vill är att kunden blir manisk kring sin kost. 
I och med att appen är en vårdgivare krävs starka och säkra system för journalföring i enlighet med gdpr och patientskyddslagen. 
Det kommer finnas en framsida som syns för de som brukar appens tjänster och en baksida där dietister och kostrådgivare hanterar sina arbetsflöden. 


Till skillnad från andra tjänster som finns idag som hjälper människor med att gå ned i vikt, räkna kalorier, komma i form eller träffa en läkare, så är EatSuite en tjänst specifikt utformad för att hjälpa människor med exakt de behov de efterfrågar (inom sfären dietist). Oavsett om det handlar om att få bukt med ens diabetes, glutenintolerans, IBS eller bara inte vill ha ont i magen så är tjänsten designad för just ditt behov. 

En stor del inom dieti handlar om att försöka förstå varför symptom uppstår och vad inom en patients kost som påverkar. Med dagens teknik som majoriteten av människor idag har runt handleden, fingret eller i fickan, mäter vi otroligt mycket av våra värden som en dietist kan dra enorm nytta av. 

Eatsuite är Sveriges enda tjänst där en personlig dietist behandlar en kontinuerligt och får direkt tillgång och uppdatering på patientens vanor, kost och mående.

Hur fungerar det? (använd för Lovable)
Övergripande beskrivning:

Appen ska kunna ge användaren möjlighet att beskriva sin problematik. Detta har två syften:
För att appen ska kunna bedöma vad för typ av vård patienten är i behov av.
Är det vård som en dietist kan ge?
Vad för typ av dietist är mest lämpad att bistå med rätt vård?
Är det en problematik som kan klassas som vårdbehövande?
Diarré pga löpning är inte ett vårdfall. 
Detta i syfte att urskilja på vilka som behöver vård och dem som inte behöver vård. Detta då ej “vårdklassade” symptom ej går att ta betalt för.

Beroende på ens svar bör man hamna i en av två kategorier: 
Ej vårdklassade symptom (går att använda appen i friskvårdssyfte = 100kr för samtal) Går att dra på friskvårdsbidrag.
Vårdklassat symptom (0kr i patientavgift). Betalas av regionen till Vårdgivare: EatSuite.

Efter att bedömningen är klar så ska man enkelt kunna boka ett initialt videosamtal med en dietist. Gränssnittet ska vara enkelt. Välj en dag i kalendern och en tidsslot där man vill genomföra sitt samtal och boka in det.
det ska finnas en textruta som säger att no-show debiteras med 275kr.

Därefter ska man komma till appens startsida/hemskärm.

Hemskärm för kund:
Layout
Överst en header med en text som välkomnar användaren. Favicon längst upp i högra hörnet. Längst upp i det vänstra hörnet är en knapp för att öppna en sidomeny (denna ska vara tillgänglig på samtliga sidor)

Sedan en tydlig sektion där du ser ditt kommande videosamtal med dietist. Här ska det synas: 
Dag, datum och tid. 
En knapp för ombokning (klicka på denna och man kommer till fönstret för tidsbokning. 
Om man inte har en inbokad tid med dietist ska sektionen visa att man inte har någon bokad tid med dietist och en knapp där det står “boka”
klicka på denna och man kommer till fönstret för tidsbokning

Från mitten på sidan ska det sedan vara tre efterföljande knappar.

Chatta med din dietist (brödtext “skicka ett meddelande när som helst”) 
Klicka på denna och det tar en till sidan för Meddelanden (finns också i huvudmenyn)
Min hälsoprofil (brödtext “visa hälsoprofil”)
klicka på denna och man kommer till en sida för sin hälsoprofil.

Profilinställningar (brödtext “uppdatera din information”)
Klicka på denna och man kommer till sina kontoinställningar.


I botten på sidan är en statisk huvudmeny. Denna ska vara indelad i 5 olika sidor:
Hem (hemskärm som beskriven ovan)
Journal
Meddelanden
Recept 
Utveckling

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nutri-friend-finder.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a068803a-d135-471c-9692-a25275b0dee6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
