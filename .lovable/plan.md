# Hemvyn: rensa, tidsanpassa och snabbuppdatering

## 1. Ta bort "Dagens tanke"
Det mörkgröna kortet med "Dagens tanke" tas bort helt från startsidan.

## 2. Tidsanpassade knappar
Journal-kortet (och dess text) anpassas efter klockslag:

- 05–10: "Logga frukost"
- 10–14: "Logga lunch"
- 14–17: "Logga mellanmål"
- 17–05: "Logga middag"

Texten uppdateras när sidan visas. Klicket går fortfarande till journalen som idag.

## 3. Snabbknappar för vikt och midjemått
Två nya knappar på startsidan: "Uppdatera vikt" och "Uppdatera midjemått". Varje knapp öppnar samma bottensheet som redan används i Hälsoprofilen, förifylld med senaste värdet. Sparat värde skrivs till samma ställe som Hälsoprofilen använder, vilket innebär att utvecklingsplanens block för vikt och midjemått automatiskt hämtar det nya värdet.

Knapparna visar också senaste värdet (t.ex. "Vikt · 82 kg") så man ser vad som gäller nu.

## Tekniskt
- `src/pages/Home.tsx`: ta bort tanke-sektionen, lägg till tidsbaserad etikett för journal-kortet, och lägg till de två snabbknapparna.
- Återanvänd `useHealthProfile` (`updateWeight`, `updateWaist`) samt befintliga `EditWeightSheet` och `EditWaistSheet`.
- Ingen databasändring: vikt sparas i `user_nutrition_settings` + dagspost, midjemått som `waist_circumference` i `health_tracking_entries` — precis som idag, så progress-blocken populeras direkt via befintlig cache-invalidering.
