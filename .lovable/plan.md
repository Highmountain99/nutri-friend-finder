

## EatSuite Recept - Komplett Receptupplevelse

### Sammanfattning
Bygg en komplett receptupplevelse med personliga "Dagens tips" (swipeable stack), "Mina recept" (sparade), detaljsidor med näringsinformation, "Börja laga"-läge, samt avancerad sök och filtrering.

---

### Databasschema - Nya tabeller och ändringar

**1. Utöka `recipes`-tabellen med nya kolumner:**

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| calories_per_serving | integer | Kalorier per portion |
| protein_per_serving | numeric | Protein i gram |
| carbs_per_serving | numeric | Kolhydrater i gram |
| fat_per_serving | numeric | Fett i gram |
| nutrition_details | jsonb | Detaljerad näringsprofil (fiber, natrium, etc.) |
| cuisine_types | text[] | Köktyper (Medelhav, Asiatiskt, Svenskt) |
| meal_types | text[] | Måltidstyper (Frukost, Lunch, Middag) |
| health_plans | text[] | Hälsoplaner (Högprotein, Låg natrium) |
| dietary_needs | text[] | Kostbehov (Vegetariskt, Veganskt) |
| allergens | text[] | Allergener (Glutenfri, Äggfri) |
| similar_recipe_ids | uuid[] | ID:n för liknande recept |
| rating_count | integer | Antal betyg |

**2. Ny tabell: `user_recipe_interactions`**

```text
user_recipe_interactions
+------------------+------------------+--------------------------------------+
| Kolumn           | Typ              | Beskrivning                          |
+------------------+------------------+--------------------------------------+
| id               | uuid (PK)        | Primärnyckel                         |
| user_id          | uuid (NOT NULL)  | Användar-ID                          |
| recipe_id        | uuid (NOT NULL)  | Recept-ID                            |
| status           | text             | "suggested" | "saved" | "skipped"    |
| suggested_date   | date             | Datum då receptet föreslogs          |
| source           | text             | "algo" | "dietitian"                 |
| dietitian_id     | uuid             | Dietist-ID om rekommenderat          |
| created_at       | timestamptz      |                                      |
| updated_at       | timestamptz      |                                      |
+------------------+------------------+--------------------------------------+
UNIQUE(user_id, recipe_id, suggested_date)
```

**3. Ny tabell: `recipe_ratings`**

```text
recipe_ratings
+------------------+------------------+--------------------------------------+
| Kolumn           | Typ              | Beskrivning                          |
+------------------+------------------+--------------------------------------+
| id               | uuid (PK)        | Primärnyckel                         |
| user_id          | uuid (NOT NULL)  | Användar-ID                          |
| recipe_id        | uuid (NOT NULL)  | Recept-ID                            |
| rating           | integer          | Betyg 1-5                            |
| review_text      | text             | Frivillig kommentar                  |
| created_at       | timestamptz      |                                      |
| updated_at       | timestamptz      |                                      |
+------------------+------------------+--------------------------------------+
UNIQUE(user_id, recipe_id)
```

**4. RLS-policyer**

- `user_recipe_interactions`: Användare kan endast läsa/skriva sin egen data
- `recipe_ratings`: Användare kan läsa alla betyg, men endast skriva/uppdatera sina egna
- Dietister kan skapa rekommendationer för sina tilldelade patienter

---

### Filstruktur - Nya komponenter

```text
src/
├── pages/
│   ├── Recipes.tsx                    (refaktoreras helt)
│   └── RecipeDetail.tsx               (ny - detaljsida)
│
├── components/recipes/
│   ├── RecipeMainView.tsx             (huvudvy med sektioner)
│   ├── DailyPicksSection.tsx          (Dagens tips-stack)
│   ├── SwipeableRecipeCard.tsx        (swipeable receptkort)
│   ├── MyRecipesSection.tsx           (Mina recept-lista)
│   ├── RecipeCard.tsx                 (listvy-kort)
│   ├── RecipeSearchBar.tsx            (sökfält)
│   ├── RecipeFilters.tsx              (filter-chips modal)
│   ├── CuisineShortcuts.tsx           (Populära kök-genvägar)
│   ├── MealTypeShortcuts.tsx          (Måltidstyper-genvägar)
│   ├── RecipeDetailSheet.tsx          (detaljvy som sheet)
│   ├── NutritionSummary.tsx           (näringssammanfattning)
│   ├── NutritionDetailModal.tsx       (full näringsprofil)
│   ├── IngredientsSection.tsx         (ingredienslista)
│   ├── InstructionsSection.tsx        (steglista)
│   ├── SimilarRecipesCarousel.tsx     (liknande recept)
│   ├── RecipeRating.tsx               (betygsättning)
│   ├── CookingModeSheet.tsx           (Börja laga-läge)
│   ├── CookingInstructionsView.tsx    (steg-för-steg)
│   ├── CookingIngredientsView.tsx     (ingrediensvy)
│   ├── EmptyDailyPicks.tsx            (tomt-läge)
│   ├── EmptyMyRecipes.tsx             (tomt-läge)
│   └── DietitianBadge.tsx             (rekommenderad-badge)
│
├── hooks/
│   ├── useRecipes.ts                  (uppdateras)
│   ├── useDailyPicks.ts               (ny - dagens tips)
│   ├── useMyRecipes.ts                (ny - sparade recept)
│   ├── useRecipeDetail.ts             (ny - receptdetalj)
│   ├── useRecipeRating.ts             (ny - betygsättning)
│   └── useRecipeFilters.ts            (ny - filterhantering)
```

---

### Komponentstruktur

**Recipes.tsx (Refaktorerad huvudsida)**

```text
┌─────────────────────────────────────────┐
│  🔍 Sök recept...                       │
├─────────────────────────────────────────┤
│                                         │
│  DAGENS TIPS                            │
│  ┌─────────────────────────────────┐    │
│  │  [Swipeable Card Stack]         │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │  🍽️ Laxsallad med quinoa  │  │    │
│  │  │  🏷️ Rekommenderad av...   │  │    │
│  │  │  ⏱️ 25 min  👥 2 port     │  │    │
│  │  │                           │  │    │
│  │  │  [Hoppa över] [Spara]     │  │    │
│  │  └───────────────────────────┘  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  MINA RECEPT (3)           Se alla →    │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 🍝  │ │ 🥗  │ │ 🍰  │               │
│  └─────┘ └─────┘ └─────┘               │
│                                         │
│  POPULÄRA KÖK                           │
│  [Medelhav] [Asiatiskt] [Svenskt] ...   │
│                                         │
│  MÅLTIDSTYPER                           │
│  [Frukost] [Lunch] [Middag] [Dessert]   │
│                                         │
└─────────────────────────────────────────┘
```

**SwipeableRecipeCard (Swipe-kort)**

```text
                 SWIPE LEFT = HOPPA ÖVER
                        ←
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │
│  │         [Recipe Image]          │    │
│  │                                 │    │
│  │  🏷️ Rekommenderad av dietist   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Laxsallad med quinoa                   │
│  Fräsch sallad med ugnsbakad lax...     │
│                                         │
│  ⏱️ 25 min   👥 2 port   ⭐ 4.3         │
│  🔥 450 kcal   💪 32g protein           │
│                                         │
│  [Hoppa över]          [Spara ❤️]       │
└─────────────────────────────────────────┘
                        →
                  SWIPE RIGHT = SPARA
```

**RecipeDetailSheet (Detaljvy)**

```text
┌─────────────────────────────────────────┐
│  ← Tillbaka                             │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │         [Recipe Image]          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Laxsallad med quinoa              ❤️   │
│  ⏱️ 25 min   👥 2 port   📊 Enkel       │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  NÄRING PER PORTION             │    │
│  │  🔥 450   💪 32g   🍞 28g   🧈 18g  │
│  │           [Visa detaljer →]     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  INGREDIENSER (8)                       │
│  • 200g laxfilé                         │
│  • 100g quinoa                          │
│  • ...                                  │
│                                         │
│  INSTRUKTIONER                          │
│  1. Värm ugnen till 200°C               │
│  2. Lägg laxen på en plåt...            │
│  3. ...                                 │
│                                         │
│  [⭐ Betygsätt detta recept]            │
│                                         │
│  LIKNANDE RECEPT                        │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 🥗  │ │ 🐟  │ │ 🥙  │               │
│  └─────┘ └─────┘ └─────┘               │
│                                         │
│  [      🍳 BÖRJA LAGA      ]            │
└─────────────────────────────────────────┘
```

**CookingModeSheet (Börja laga-läge)**

```text
┌─────────────────────────────────────────┐
│  ✕ Avsluta                              │
├─────────────────────────────────────────┤
│  [Instruktioner]  [Ingredienser]        │
├─────────────────────────────────────────┤
│                                         │
│              STEG 2 AV 6                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │   Koka quinoa enligt förpack-   │    │
│  │   ningens anvisningar. Låt      │    │
│  │   svalna något.                 │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│         [●]  [○]  [○]  [○]  [○]  [○]    │
│                                         │
│  [ ← Föregående ]    [ Nästa → ]        │
│                                         │
└─────────────────────────────────────────┘
```

---

### Hooks och datahantering

**useDailyPicks.ts**

```typescript
// Hämtar dagens rekommendationer baserat på datum
// Hanterar spara/hoppa över-logik
// Återställer hoppade recept vid "Granska hoppade"

interface DailyPicksReturn {
  picks: RecipeWithStatus[];
  isLoading: boolean;
  saveRecipe: (recipeId: string) => Promise<void>;
  skipRecipe: (recipeId: string) => Promise<void>;
  reviewSkipped: () => Promise<void>;
  hasSkippedRecipes: boolean;
}
```

**useRecipeFilters.ts**

```typescript
// Hanterar filterlogik och kombinationer

interface FilterState {
  cuisineTypes: string[];
  mealTypes: string[];
  healthPlans: string[];
  dietaryNeeds: string[];
  allergens: string[];
}
```

---

### Routingändringar

Uppdatera `App.tsx` med ny route för receptdetaljer:

```tsx
<Route path="/recipes" element={<Recipes />} />
<Route path="/recipes/:recipeId" element={<RecipeDetail />} />
```

---

### Implementationsordning

**Fas 1: Databas och grundläggande struktur**
1. Skapa databasmigration för nya tabeller och kolumner
2. Lägg till RLS-policyer
3. Uppdatera hooks-grundstruktur

**Fas 2: Huvudvy (Recipes.tsx)**
4. Refaktorera Recipes.tsx till ny layout
5. Implementera RecipeSearchBar
6. Implementera CuisineShortcuts och MealTypeShortcuts
7. Implementera MyRecipesSection

**Fas 3: Dagens tips**
8. Implementera useDailyPicks hook
9. Implementera SwipeableRecipeCard med svep-gester
10. Implementera DailyPicksSection med kortstack
11. Implementera EmptyDailyPicks med "Granska hoppade"
12. Lägg till DietitianBadge för rekommenderade recept

**Fas 4: Receptdetaljer**
13. Skapa RecipeDetailSheet/RecipeDetail-sida
14. Implementera NutritionSummary och NutritionDetailModal
15. Implementera IngredientsSection och InstructionsSection
16. Implementera SimilarRecipesCarousel
17. Implementera RecipeRating

**Fas 5: Börja laga**
18. Implementera CookingModeSheet
19. Implementera CookingInstructionsView med stegnavigering
20. Implementera CookingIngredientsView

**Fas 6: Sök och filter**
21. Implementera useRecipeFilters
22. Implementera RecipeFilters modal med kombinerbara filter
23. Koppla ihop sök + filter

---

### Tekniska detaljer

**Svep-implementation för kortstack:**

Använder befintlig `useSwipeGesture` hook men utökas med:
- Visuell feedback under svepning (opacity, rotation)
- Threshold på 100px för aktivering
- Animering vid borttagning

```tsx
const swipeHandlers = useSwipeGesture({
  onSwipeLeft: () => skipRecipe(currentRecipe.id),
  onSwipeRight: () => saveRecipe(currentRecipe.id),
  threshold: 100
});
```

**Datumbaserad stack-logik:**

```typescript
// Lokalt datum för att avgöra "idag"
const today = format(new Date(), 'yyyy-MM-dd');

// Hämta recept som inte har status för idag
const picks = await supabase
  .from('recipes')
  .select('*, user_recipe_interactions!left(*)')
  .or(`suggested_date.neq.${today},suggested_date.is.null`, 
      { foreignTable: 'user_recipe_interactions' });
```

**RLS för dietist-rekommendationer:**

```sql
-- Dietister kan skapa rekommendationer för sina patienter
CREATE POLICY "Dietists can recommend to patients"
ON user_recipe_interactions FOR INSERT
TO authenticated
WITH CHECK (
  source = 'dietitian' AND
  is_assigned_dietist(user_id)
);
```

