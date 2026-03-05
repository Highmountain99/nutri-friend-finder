

# Plan: Dietist-dashboard Receptverktyg

## Nuläge
- `DietitianRecipes.tsx` är en enkel sida (~290 rader) med grundläggande skapa/sök/föreslå-funktionalitet
- `recipes`-tabellen har redan `cuisine_types`, `meal_types`, `health_plans`, `dietary_needs`, `allergen_free`, `source_url` som array-kolumner
- Tabellen saknar `is_published`, `prep_time_minutes` och `fiber_per_serving`
- Firecrawl-connector och edge functions för discover/scrape/parse finns redan
- Ingen storage bucket `recipe-images` existerar ännu

## Databasändringar

**Migration 1** – Lägg till kolumner i `recipes`:
- `is_published boolean DEFAULT true` (befintliga recept blir publicerade)
- `prep_time_minutes integer` (separat från `time_minutes` som blir cook_time)
- `fiber_per_serving numeric`

**Migration 2** – Skapa storage bucket `recipe-images` (public)

**Migration 3** – Skapa `recipe_suggestions`-tabell (separat från `user_recipe_interactions` för renare modell):
```
id uuid PK
recipe_id uuid FK → recipes
dietitian_id uuid
patient_id uuid
message text nullable
status text DEFAULT 'suggested' (suggested/saved/dismissed)
created_at timestamp
```
Med RLS: dietister kan hantera för sina tilldelade patienter, patienter kan se och uppdatera sina egna.

**Migration 4** – Seed 15 demo-recept + 4 recipe_suggestions

## Frontend-komponenter (ny filstruktur)

Befintliga `DietitianRecipes.tsx` skrivs om helt och bryts ut i delkomponenter under `src/components/dietitian/recipes/`:

### 1. `DietitianRecipesPage.tsx` (huvudsida)
- Action-bar med rubrik + 3 knappar: "Skapa recept", "Importera recept", "Hämta från länk"
- Kollapsbar filtersektion med 5 grupper av chip-taggar + sökfält + "Rensa filter" + "Visar X av Y"
- Receptrutnät (3/2/1 kolumner), skeleton loading
- Hanterar state för filter, sök, modaler

### 2. `RecipeFilterPanel.tsx`
- Kollapsbar panel med filter-ikon + badge för aktiva filter
- 5 grupper med chip-knappar (toggle grön/grå)
- Sökfält och "Rensa filter"
- Tagmappning: DB-värden (english) ↔ visningsnamn (svenska)

### 3. `DietitianRecipeCard.tsx`
- Bild/platshållare, titel (max 2 rader), tid, portioner, max 3 taggar + "+N till"
- Tre-pricks-meny: Föreslå, Redigera, Duplicera, Ta bort
- Visar "Utkast"-badge om `is_published === false`

### 4. `CreateRecipeSheet.tsx` (fullskärmsmodal/sheet)
- Formulär: titel, beskrivning, bilduppladdning (drag-and-drop → `recipe-images` bucket)
- Tider & portioner (3 fält i rad)
- Ingredienslista med mängd/enhet-dropdown/ingrediens + "Klistra in lista"-parser
- Numrerade instruktionssteg med drag-and-drop
- Näringsvärden (expanderbar): kcal, protein, kolhydrater, fett, fiber
- Tagg-sektion med alla 5 filtergrupper
- Knappar: Spara utkast / Publicera / Avbryt

### 5. `ImportRecipeModal.tsx`
- Tabs med 3 alternativ: Klistra in text / Ladda upp fil / Flera filer
- **Klistra in text**: textarea + "Tolka recept"-knapp med regex-parser
- **Ladda upp fil**: drag-and-drop för .txt/.docx/.pdf/.csv – parsear via edge function eller client-side text
- **Flera filer**: multi-fil-uppladdning
- Förhandsgranskning av tolkade recept med checkboxar
- Importerar som utkast, visar resultat

### 6. `FetchRecipeFromUrlModal.tsx`
- URL-fält + "Hämta recept"-knapp
- Anropar ny edge function `scrape-recipe` som:
  1. Fetchar URL server-side
  2. Extraherar JSON-LD (`@type: Recipe`) från HTML
  3. Fallback till meta-taggar + Firecrawl scraping
  4. Returnerar strukturerad data
- Förhandsvisning i redigerbart formulär
- Auto-taggning baserat på innehåll (sparkle-ikon)
- Spara som utkast eller publicera

### 7. `SuggestRecipeModal.tsx` (uppgraderad)
- Från receptkort: visar receptinfo + sökbar patientlista med checkboxar + allergibadges + meddelandefält
- Från patientprofil: auto-applicerar patientens allergier/kostbehov som filter + filtrerad receptlista
- Sparar till `recipe_suggestions` + skickar chattmeddelande

### 8. `EditRecipeSheet.tsx`
- Samma formulär som CreateRecipeSheet men förpopulerat med befintlig data
- Uppdaterar via `.update()`

## Edge Function: `scrape-recipe`

Ny edge function under `supabase/functions/scrape-recipe/index.ts`:
- Tar emot `{ url: string }`
- Fetchar HTML server-side (eller via Firecrawl om direkt fetch misslyckas)
- Parsear JSON-LD structured data (`schema.org/Recipe`)
- Fallback: meta-taggar + Firecrawl scrape + AI-parsning
- Returnerar `{ success, recipe: { title, ingredients, instructions, image, nutrition, ... } }`

## Ingrediens-parser (client-side utility)

`src/lib/recipeParser.ts`:
- `parseIngredientList(text: string)` – splittar på newlines, regex: `(\d+\.?\d*)\s*(g|kg|ml|dl|l|msk|tsk|st|krm)?\s*(.+)`
- `parseRecipeText(text: string)` – extraherar titel, ingredienser, instruktioner, portioner, tid från fritext
- `autoSuggestTags(recipe)` – föreslår taggar baserat på ingredienser/titel

## Tagmappning

Konstant-fil `src/lib/recipeTags.ts` med mappning mellan DB-värden och svenska visningsnamn:
```typescript
export const TAG_GROUPS = {
  cuisine: { label: 'Kök', options: [{ id: 'mediterranean', label: 'Medelhav' }, ...] },
  mealType: { label: 'Måltidstyp', options: [...] },
  // ...
};
```
Används av både dietist-dashboard och patient-sidan (ersätter duplicerade listor i `RecipeFiltersBar.tsx`).

## Sammanfattning av arbetsuppgifter

1. Databasmigration: `is_published`, `prep_time_minutes`, `fiber_per_serving`, `recipe_suggestions`-tabell, `recipe-images` bucket
2. Seed 15 demo-recept + 4 suggestions
3. Utility-filer: `recipeTags.ts`, `recipeParser.ts`
4. Edge function: `scrape-recipe`
5. Komponenter: FilterPanel, RecipeCard, CreateRecipeSheet, ImportRecipeModal, FetchFromUrlModal, SuggestRecipeModal, EditRecipeSheet
6. Huvudsida: `DietitianRecipes.tsx` omskriven med ny layout
7. Uppdatera `RecipeFiltersBar.tsx` på patientsidan att använda delade tagg-konstanter

