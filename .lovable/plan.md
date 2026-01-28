
# Plan: Logga Måltider med AI-bildanalys

## Översikt
Bygg ut den befintliga måltidsloggningsfunktionen med ett förbättrat UX-flöde och integration med Livsmedelsverkets databas för mer exakta näringsvärden.

## Nuvarande tillstånd
- **Journal.tsx**: Har redan en flytande kameraknapp (FAB) och `AddMealSheet`
- **AddMealSheet.tsx**: Har tre inmatningsmetoder (kamera, galleri, text) och AI-analys
- **analyze-food edge function**: Fungerar med Lovable AI för bildanalys
- **MealTimeline.tsx** och **MealEntryCard.tsx**: Visar loggade måltider i en tidslinje

## Planerade förändringar

### 1. Förbättra FAB-knappen
**Fil:** `src/pages/Journal.tsx`
- Flytta FAB till ett mer framträdande läge med rätt färg (accent/coral enligt designsystemet)
- Visa FAB alltid (inte bara när AI tracking är aktiverat) för bättre UX
- Lägg till visuella detaljer som matchar referensbilden (glitter-ikon)

### 2. Uppdatera analyze-food Edge Function
**Fil:** `supabase/functions/analyze-food/index.ts`

Lägg till integration med Livsmedelsverkets öppna API:
- Använd `/api/v1/livsmedel` för att söka efter identifierade ingredienser
- Hämta exakta näringsvärden från `/api/v1/livsmedel/{nummer}/naringsvarden`
- Om ingen match hittas, fall tillbaka på AI-uppskattning
- Retunera `dataSource: "livsmedelsverket" | "ai_estimation"` för transparens

**API-endpoints att använda:**
```text
GET https://dataportal.livsmedelsverket.se/livsmedel/api/v1/livsmedel
GET https://dataportal.livsmedelsverket.se/livsmedel/api/v1/livsmedel/{nummer}/naringsvarden
```

### 3. Förbättra AddMealSheet med nytt flöde
**Fil:** `src/components/journal/AddMealSheet.tsx`

**Steg 1 - Val av inmatningsmetod:**
- Ta foto (snabbknapp med kamera)
- Välj bild från galleri
- Skriv in manuellt

**Steg 2 - Analys och resultatvisning:**
- Visa bilden i litet format
- Visa AI-genererad måltidstitel
- Visa måltidskategori baserat på tid (Frukost, Lunch, Middag etc.)
- Visa näringsvärden med färgkodning:
  - Svart/grå: Kalorier
  - Primär (grön): Protein  
  - Amber/gul: Kolhydrater
  - Grön: Fett
- Visa datakälla (Livsmedelsverket eller AI-uppskattning)

**Steg 3 - Justering och bekräftelse:**
- Snabbval för mängd (hälften, 3/4, 1.5x)
- Fritextjustering för omräkning
- Visa ingredienslista
- Bekräfta och spara

### 4. Uppdatera MealEntryCard för tidslinjen
**Fil:** `src/components/journal/MealEntryCard.tsx`

Matcha referensbilden:
- Visa måltidskategori + tid (t.ex. "Breakfast • 8:42 AM")
- Bilden till vänster
- Måltidsnamn
- Färgkodade makron inline (• 95 • 25g • 0.5g • 0.3g)

### 5. Databasuppdatering
Lägg till kolumn för att spara måltidskategori (meal_type) i `nutrition_entries` tabellen om den inte redan finns där.

---

## Tekniska detaljer

### Edge Function: Livsmedelsverkets API-integration
```text
1. AI analyserar bilden och identifierar ingredienser
2. För varje ingrediens:
   a. Sök i Livsmedelsverket: GET /api/v1/livsmedel?query={ingrediens}
   b. Om match hittas: Hämta näringsvärden
   c. Om ingen match: Använd AI-uppskattning
3. Summera näringsvärden från alla ingredienser
4. Returnera med källa för varje ingrediens
```

### Färgkodning (enligt index.css)
- Kalorier: `text-foreground` (mörk)
- Protein: `text-primary` (sage green)
- Kolhydrater: `text-amber-500` (befintlig)
- Fett: `text-green-500` (befintlig)

### Måltidskategorier baserat på tid
```text
05:00-10:00 → Frukost
10:00-12:00 → Förmiddagssnack
12:00-14:00 → Lunch
14:00-17:00 → Mellanmål
17:00-21:00 → Middag
21:00-05:00 → Kvällssnack
```

---

## Filer att skapa/ändra

| Fil | Åtgärd |
|-----|--------|
| `supabase/functions/analyze-food/index.ts` | Uppdatera med Livsmedelsverket-integration |
| `src/pages/Journal.tsx` | Visa FAB alltid, använd accent-färg |
| `src/components/journal/AddMealSheet.tsx` | Förbättra resultatvyn med datakälla |
| `src/components/journal/MealEntryCard.tsx` | Uppdatera layout för att matcha design |
| `src/hooks/useJournalData.ts` | Säkerställ mealType sparas korrekt |

---

## Stegordning för implementation

1. **Databas**: Verifiera att `meal_type` sparas i `nutrition_entries`
2. **Edge Function**: Lägg till Livsmedelsverket-sökning med fallback till AI
3. **FAB**: Visa alltid, använd accent-färg, lägg till sparkle-ikon
4. **AddMealSheet**: Uppdatera resultatvyn med källa och förbättrad design
5. **MealEntryCard**: Uppdatera layout för tidslinje-visning
6. **Testa**: Flödet från foto → analys → bekräftelse → tidslinje
