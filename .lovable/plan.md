

## Redesign av Receptsökning - Söksida med kategorier och avancerade filter

### Sammanfattning
Omstrukturera sökupplevelsen i recept-fliken till en dedikerad sökvy med visuella kategorikort och avancerade dropdownfilter som endast visas vid textsökning.

---

### Ny användarresa

```text
Steg 1: Användaren klickar i sökfältet
        ↓
    ┌─────────────────────────────────────┐
    │  🔍 Vad vill du laga?   [Avbryt]    │
    ├─────────────────────────────────────┤
    │                                      │
    │  POPULARA KOK                        │
    │  ┌─────────┐ ┌─────────┐            │
    │  │ Medelhav│ │Asiatiskt│            │
    │  └─────────┘ └─────────┘            │
    │  ┌─────────┐ ┌─────────┐            │
    │  │Svenskt  │ │Mexikansk│            │
    │  └─────────┘ └─────────┘            │
    │  ┌─────────┐ ┌─────────┐            │
    │  │Italiensk│ │ Indiskt │            │
    │  └─────────┘ └─────────┘            │
    │                                      │
    │  MALTIDSTYPER                        │
    │  ┌─────────┐ ┌─────────┐            │
    │  │ Frukost │ │  Lunch  │            │
    │  └─────────┘ └─────────┘            │
    │  ┌─────────┐ ┌─────────┐            │
    │  │ Middag  │ │  Soppa  │            │
    │  └─────────┘ └─────────┘            │
    │  ┌─────────┐ ┌─────────┐            │
    │  │ Sallad  │ │ Förrätt │            │
    │  └─────────┘ └─────────┘            │
    └─────────────────────────────────────┘

Steg 2: Användaren börjar skriva
        ↓
    ┌─────────────────────────────────────┐
    │  🔍 Kyckling          [x] [Avbryt]  │
    ├─────────────────────────────────────┤
    │  [Kök v] [Måltid v] [Hälsa v] [...] │
    ├─────────────────────────────────────┤
    │  ┌────────────────────────────────┐ │
    │  │ 🖼️ Adobo Kyckling             │ │
    │  │    ⏱️ 35min  👥 4 port         │ │
    │  └────────────────────────────────┘ │
    │  ┌────────────────────────────────┐ │
    │  │ 🖼️ Dijon Kyckling             │ │
    │  │    ⏱️ 25min  👥 2 port         │ │
    │  └────────────────────────────────┘ │
    └─────────────────────────────────────┘
```

---

### Filterstruktur

| Filterkategori | Alternativ |
|----------------|------------|
| **Kök** | Medelhav, Asiatiskt, Svenskt, Mexikanskt, Italienskt, Indiskt |
| **Måltidstyp** | Frukost, Lunch, Middag, Sallad, Soppa, Huvudrätt, Förrätt |
| **Hälsoplan** | Låga kolhydrater, Högt fiber, Högt protein, Medelhavs, Bra för hjärta, Lågt sodium, Bra för njurar, Bra för diabetes |
| **Kostbehov** | Vegetarian, Vegan, Pescitarian, Keto, Paleo, Kosher |
| **Allergier** | Laktosfri, Glutenfri, Sojafri, Äggfri, Skaldjursfri, Jordnöttsfri, Nötfri, Sesamfri, Sulfitfri, FODMAPfri |

---

### Nya och uppdaterade filer

```text
src/
├── pages/
│   └── Recipes.tsx                      (uppdateras - ny vy-logik)
│
├── components/recipes/
│   ├── RecipeSearchView.tsx             (NY - sökvy med kategorier)
│   ├── CuisineCategoryGrid.tsx          (NY - 2-kolumns grid med bilder)
│   ├── MealTypeCategoryGrid.tsx         (NY - 2-kolumns grid med bilder)
│   ├── RecipeSearchBar.tsx              (uppdateras - fokushantering)
│   ├── RecipeSearchResults.tsx          (uppdateras - utökade filter)
│   ├── RecipeFiltersBar.tsx             (NY - filterknappar med dropdowns)
│   └── FilterDropdown.tsx               (NY - återanvändbar filterdropdown)
│
├── hooks/
│   └── useRecipeSearch.ts               (NY - söklogik med alla filter)
```

---

### Komponentdetaljer

**RecipeSearchView.tsx** (Ny dedikerad sökvy)

```text
┌─────────────────────────────────────────┐
│  [🔍 Vad vill du laga?]      [Avbryt]  │
├─────────────────────────────────────────┤
│                                         │
│  POPULARA KOK                           │
│  ┌───────────────┐ ┌───────────────┐    │
│  │   [Bild]      │ │   [Bild]      │    │
│  │   Medelhav    │ │   Asiatiskt   │    │
│  └───────────────┘ └───────────────┘    │
│  ┌───────────────┐ ┌───────────────┐    │
│  │   [Bild]      │ │   [Bild]      │    │
│  │   Mexikanskt  │ │   Svenskt     │    │
│  └───────────────┘ └───────────────┘    │
│         ...                             │
│                                         │
│  MALTIDSTYPER                           │
│  ┌───────────────┐ ┌───────────────┐    │
│  │   [Bild]      │ │   [Bild]      │    │
│  │   Frukost     │ │   Lunch       │    │
│  └───────────────┘ └───────────────┘    │
│         ...                             │
└─────────────────────────────────────────┘
```

**RecipeFiltersBar.tsx** (Filtrering vid textsökning)

```text
┌─────────────────────────────────────────────────────┐
│  [Kök ▼]  [Måltid ▼]  [Hälsa ▼]  [Kost ▼]  [...]   │
└─────────────────────────────────────────────────────┘

När expanderad:
┌─────────────────┐
│ ☐ Medelhav      │
│ ☐ Asiatiskt     │
│ ☐ Svenskt       │
│ ☐ Mexikanskt    │
│ ☐ Italienskt    │
│ ☐ Indiskt       │
└─────────────────┘
```

---

### Tillståndshantering i Recipes.tsx

```typescript
// Tre vylägen
type ViewMode = "default" | "search-browse" | "search-results";

// default: Normala vyn med Dagens tips, Mina recept, etc.
// search-browse: Sökvyn med kategorikort (när sökfältet är fokuserat men tomt)
// search-results: Sökresultat med filterbar (när text skrivits in)

interface FilterState {
  cuisineTypes: string[];
  mealTypes: string[];
  healthPlans: string[];
  dietaryNeeds: string[];
  allergenFree: string[];
}
```

---

### Kategoribildhantering

Eftersom vi inte har faktiska bilder för kategorierna, använder vi:
1. **Platsbilder via Unsplash/gradient-bakgrunder** med textöverlägg
2. **Emojis som visuell representation** i en stiliserad kortdesign

```typescript
const cuisineCategories = [
  { id: "medelhav", label: "Medelhav", gradient: "from-amber-500 to-orange-600" },
  { id: "asiatiskt", label: "Asiatiskt", gradient: "from-red-500 to-pink-600" },
  { id: "svenskt", label: "Svenskt", gradient: "from-blue-500 to-yellow-400" },
  { id: "mexikanskt", label: "Mexikanskt", gradient: "from-green-500 to-red-500" },
  { id: "italienskt", label: "Italienskt", gradient: "from-green-600 to-red-600" },
  { id: "indiskt", label: "Indiskt", gradient: "from-orange-500 to-yellow-500" },
];
```

---

### Implementationsordning

1. **Skapa RecipeSearchView.tsx**
   - Sökvyn med kategorier i 2-kolumns grid
   - Hantera klick på kategori som sätter filter

2. **Skapa CuisineCategoryGrid.tsx och MealTypeCategoryGrid.tsx**
   - Visuella kort med gradient-bakgrund och text
   - Klickbara för att välja filter

3. **Skapa RecipeFiltersBar.tsx och FilterDropdown.tsx**
   - Horisontell scrollbar med filter-knappar
   - Dropdown med checkboxar för multi-select

4. **Uppdatera RecipeSearchBar.tsx**
   - Lägg till fokus/blur-hantering
   - Visa Avbryt-knapp vid fokus
   - Clear-knapp när text finns

5. **Skapa useRecipeSearch.ts hook**
   - Hantera alla filtertyper
   - Bygg Supabase-query med array-contains

6. **Uppdatera Recipes.tsx**
   - Implementera tre vylägen (default/search-browse/search-results)
   - Koordinera mellan komponenter

7. **Uppdatera RecipeSearchResults.tsx**
   - Integrera med nya filter
   - Visa aktiva filter som borttagbara chips

---

### Tekniska detaljer

**Array-filtrering i Supabase:**

```typescript
// Filtrera på array-kolumner med contains
let query = supabase.from("recipes").select("*");

if (filters.cuisineTypes.length > 0) {
  query = query.contains("cuisine_types", filters.cuisineTypes);
}
if (filters.mealTypes.length > 0) {
  query = query.contains("meal_types", filters.mealTypes);
}
// ... etc för övriga filter
```

**Fokushantering för sökfält:**

```typescript
const [isSearchFocused, setIsSearchFocused] = useState(false);

// Visa search-browse vy när fokuserat men ingen text
const viewMode = isSearchFocused && !searchQuery 
  ? "search-browse" 
  : searchQuery.length > 0 || hasActiveFilters
    ? "search-results"
    : "default";
```

