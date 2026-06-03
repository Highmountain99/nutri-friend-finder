## Ändringar

### 1. Receptdetaljvy (`RecipeDetailSheet.tsx`)
- **Ingredienser**: rendera tydligt format med belopp+enhet i fet stil och ingrediens i normal vikt, t.ex. **100 g** smör eller margarin. Liknande look som "Cooking mode" (uppdatera punktlistan så `qty` + `unit` är bold och namnet regular).
- **Näring per portion**: lägg etiketterna ("kcal", "Protein", "Kolhydrater", "Fett") ovanför värdet för alla fyra kolumner. Ta bort Flame-ikonen. Importen av `Flame` tas bort.

### 2. Cooking mode (`CookingModeSheet.tsx`)
- **Instruktioner – design-uppfräschning**:
  - Lägg ett stort stegnummer (1, 2, 3…) ovanför instruktionstexten i kortet (serif font, primary färg).
  - Snyggare kort (border, lite padding, mjuk skugga) istället för bara `bg-muted/50`.
- **Swipe mellan steg**: använd projektets `useSwipeGesture`-hook på instruktionspanelen så att swipe vänster/höger triggar `goToNext`/`goToPrevious`. Pilknapparna ligger kvar.

### 3. Receptbank – sortering (`Recipes.tsx`, `RecipeSearchResultsList.tsx`, `useRecipeSearch.ts`)
- Lägg till `sort`-state (`"rating" | "time" | "newest"`, default `"rating"`) i `Recipes.tsx` och skicka till `RecipeSearchResultsList` → `useRecipeSearch`.
- I `useRecipeSearch` byts `.order("rating", …)` till att välja kolumn baserat på sort:
  - `rating` → `rating desc`
  - `time` → `time_minutes asc`
  - `newest` → `created_at desc`
- UI: liten sorterings-`Select`/dropdown ovanför listan i `search-results`-vyn (bredvid filter-bar). Alternativ: "Bäst betyg", "Snabbast", "Senaste".

### 4. Progress-sidan – "Min resa"-knapp (`ProgressRouter.tsx`)
- Byt den runda flagg-knappen i toppen mot en pill-knapp med text **"Min resa"** + en snyggare flagg-ikon (`Map` eller `Route` från lucide; väljer `Route` för "resa"-känsla).
- Behåll `onOpenJourney`. Knapp: `rounded-full bg-primary text-primary-foreground px-4 h-10 gap-2 shadow-md`, ikon `w-4 h-4`. Behåll position top-right.

### 5. Header – ta bort "g"-bubblan (`Header.tsx`)
- Ta bort den runda primary-bubblan med "g" i högra hörnet.
- För att behålla centrerad layout läggs en osynlig `w-10` spacer in på höger sida (matchar menyknappens bredd till vänster).

## Filer som ändras
- `src/components/recipes/RecipeDetailSheet.tsx`
- `src/components/recipes/CookingModeSheet.tsx`
- `src/pages/Recipes.tsx`
- `src/components/recipes/RecipeSearchResultsList.tsx`
- `src/hooks/useRecipeSearch.ts`
- `src/components/progress/ProgressRouter.tsx`
- `src/components/layout/Header.tsx`

Inga DB- eller backend-ändringar behövs.