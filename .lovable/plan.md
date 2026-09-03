# Fyra justeringar: resa-expandering, tangentbord, chatt-header, recept-header

## 1. "Din resa" ska rulla ner som en rullgardin
Idag öppnas resan som ett bottenark (`TreatmentJourneySheet` med `side="bottom"`), därför glider den upp underifrån.

Ändring:
- Innehållet i resan (rubrik, tidslinje, kort med statuspiller) flyttas ut ur bottenarket till en inline-panel som ligger direkt under den guldbeiga headern i utvecklingsvyn.
- Panelen expanderar nedåt med en höjd-/fade-animation (rullgardin) när man trycker eller drar headern nedåt, och fälls ihop uppåt när man trycker igen, drar uppåt eller trycker på stäng-knappen.
- Headern och panelen delar samma guldbeiga bakgrund så de ser ut som en sammanhängande yta som viks ut.
- Samma design som redan byggts: "DIN RESA"-pill, undertext, numrerad tidslinje och krämfärgade kort med Klart/Pågår/Väntar/Slutmål.
- Bottenarket tas bort från `Progress.tsx`.

## 2. Vikt/midjemått: inget markerat värde vid öppning
Bottenarken fokuserar automatiskt inmatningsfältet, vilket öppnar tangentbordet direkt.

Ändring i `EditWeightSheet`, `EditWaistSheet` och `EditHeightSheet`: blockera autofokus när arket öppnas, så fältet inte är markerat och tangentbordet visas först när man själv trycker i fältet.

## 3. Chattens topp enligt bilden
`ChatHeader` görs om till ett salviagrönt block som går kant i kant med skärmens topp och har rundade nedre hörn:
- Rund kräm-avatar med initialer till vänster
- Namnet i versaler, tung display-typografi
- Ingen online-status och ingen "Boka tid"-knapp (enligt instruktion)
- Titel/underrubrik behålls diskret under namnet
- Eskaleringsnotisen behålls som en rad under headern

## 4. Receptsidans header enligt bilden
Nuvarande "Recept / Hitta recept som passar dig" byts mot ett terrakotta/aprikosfärgat headerblock kant i kant med toppen och rundade nedre hörn:
- Stor rubrik i versaler: "MAT SOM FUNKAR FÖR DIG", där ordet "FUNKAR" ligger i en mörkgrön highlight-pill med kräm text
- Rund skannerknapp uppe till höger (befintlig funktion)
- Sökfältet och bläddra-knappen ligger kvar precis under headern

## Tekniska detaljer
- Filer: `src/components/progress/ProgressRouter.tsx`, `src/components/progress/TreatmentJourneySheet.tsx` (blir inline-panel), `src/pages/Progress.tsx`, `src/components/profile/EditWeightSheet.tsx`, `EditWaistSheet.tsx`, `EditHeightSheet.tsx`, `src/components/messages/ChatHeader.tsx`, `src/pages/Recipes.tsx`.
- Autofokus blockeras via `onOpenAutoFocus` på arkets innehåll.
- Kant-i-kant-headers löses med negativ marginal mot sidans padding plus `env(safe-area-inset-top)`.
- Ingen ändring av data, hooks, routing eller behörigheter.
