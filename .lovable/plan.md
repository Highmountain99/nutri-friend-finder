
# Plan: Redigera Loggade Måltider med Utökade Justeringsalternativ

## Översikt
Bygg ut "Lägg till måltid"-sheeten till en universell måltidshanterare som kan användas både för att lägga till nya måltider och redigera befintliga. Lägg även till nya fält för att justera måltidstyp, tid, bild och titel.

## Nuvarande tillstånd
- **AddMealSheet.tsx**: Hanterar endast nya måltider med foto/text-input → AI-analys → bekräftelse
- **MealEntryCard.tsx**: Har onClick-prop men ingen faktisk funktionalitet
- **Journal.tsx**: Har en TODO-kommentar vid `onEntryClick` som bara loggar till console
- **useJournalData.ts**: Har `updateEntry`-funktion men saknar stöd för `meal_type` och `created_at`

## Planerade förändringar

### 1. Skapa EditMealSheet-komponent (eller utöka AddMealSheet)
**Beslut:** Skapa en ny `EditMealSheet.tsx` komponent för tydlig separation av ansvar.

**Ny fil:** `src/components/journal/EditMealSheet.tsx`

Denna komponent kommer att:
- Ta emot en befintlig `NutritionEntry` som prop
- Visa samma resultat-vy som AddMealSheet men med redigeringsfält
- Inkludera nya fält:
  - **Måltidstitel**: Redigerbart textfält (Input)
  - **Måltidstyp**: Dropdown med alternativen (Frukost, Förmiddagssnack, Lunch, Mellanmål, Middag, Kvällssnack)
  - **Tid för måltid**: Datumväljare + tidsväljare för att justera `created_at`
  - **Byta bild**: Två knappar ovanpå bilden (Kamera / Galleri)
- Ha "Spara ändringar" och "Ta bort måltid" knappar

**Visuell struktur:**
```text
+--------------------------------+
|     ✕    Redigera måltid       |
+--------------------------------+
|                                |
|  [BILD med knappar ovanpå]     |
|  [📷 Ny bild] [🖼️ Galleri]     |
|                                |
|  Måltidstyp: [Dropdown ▼]      |
|  Tid: [Datumväljare] [Klocka]  |
|  Titel: [___________________]  |
|                                |
|  +---------------------------+ |
|  | Livsmedelsverket badge    | |
|  | Lax med potatis           | |
|  | Hög säkerhet              | |
|  +---------------------------+ |
|  | Kcal | Protein | Kolh | F | |
|  | 450  |   32g   |  28g | 18g|
|  +---------------------------+ |
|                                |
|  [Justera mängd]               |
|  [Hälften] [3/4] [1.5x]        |
|  [Skriv justering...] [↻]      |
|                                |
|  [Ta bort]  [Spara ändringar]  |
+--------------------------------+
```

### 2. Uppdatera AddMealSheet med nya fält i resultat-vyn
**Fil:** `src/components/journal/AddMealSheet.tsx`

Lägg till i resultat-vyn (viewState === "result"):
- Redigerbar måltidstitel (Input-fält istället för bara text)
- Dropdown för måltidstyp
- Knappar för att byta bild (kamera/galleri) ovanpå befintlig bildförhandsvisning
- Tidväljare för när måltiden åts

**Ändringar i state:**
```typescript
const [editedMealName, setEditedMealName] = useState("");
const [editedMealType, setEditedMealType] = useState("");
const [mealTime, setMealTime] = useState<Date>(new Date());
```

### 3. Uppdatera useJournalData för full uppdatering
**Fil:** `src/hooks/useJournalData.ts`

Utöka `updateEntry`-funktionen för att hantera:
- `meal_type` - måltidstyp
- `created_at` - tidpunkt för måltiden
- `entry_date` - kan behöva uppdateras om tiden ändras till annan dag

```typescript
const updateEntry = useCallback(
  async (id: string, updates: Partial<NutritionEntry & { mealTime?: Date }>) => {
    // Hantera created_at och potentiell entry_date-ändring
    const updateData = {
      meal_name: updates.mealName,
      meal_type: updates.mealType,
      calories: updates.calories,
      protein: updates.protein,
      carbs: updates.carbs,
      fat: updates.fat,
      is_ai_estimated: updates.isAiEstimated,
      image_url: updates.imageUrl,
      created_at: updates.mealTime?.toISOString(),
      // Om mealTime ändras, uppdatera entry_date också
      entry_date: updates.mealTime 
        ? format(updates.mealTime, "yyyy-MM-dd") 
        : undefined,
    };
    // ... resten av logiken
  },
  [user, entries, calculateTotals]
);
```

### 4. Koppla ihop i Journal.tsx
**Fil:** `src/pages/Journal.tsx`

Lägg till:
- State för vald entry att redigera: `editingEntry`
- State för att visa EditMealSheet: `isEditMealOpen`
- Callback för `onEntryClick` som öppnar EditMealSheet
- Handler för att spara och ta bort måltid

```typescript
const [editingEntry, setEditingEntry] = useState<NutritionEntry | null>(null);
const [isEditMealOpen, setIsEditMealOpen] = useState(false);

const handleEntryClick = (entry: NutritionEntry) => {
  setEditingEntry(entry);
  setIsEditMealOpen(true);
};

const handleUpdateEntry = async (updates: Partial<NutritionEntry>) => {
  if (!editingEntry) return;
  await updateEntry(editingEntry.id, updates);
  setIsEditMealOpen(false);
  setEditingEntry(null);
};

const handleDeleteEntry = async () => {
  if (!editingEntry) return;
  await deleteEntry(editingEntry.id);
  setIsEditMealOpen(false);
  setEditingEntry(null);
};
```

### 5. Skapa MealTypeDropdown-komponent
**Ny fil:** `src/components/journal/MealTypeDropdown.tsx`

Återanvändbar dropdown med måltidstyper:
```typescript
const MEAL_TYPES = [
  "Frukost",
  "Förmiddagssnack", 
  "Lunch",
  "Mellanmål",
  "Middag",
  "Kvällssnack",
] as const;
```

### 6. Skapa MealTimeSelector-komponent
**Ny fil:** `src/components/journal/MealTimeSelector.tsx`

Komponent för att välja datum och tid:
- Datumväljare (react-day-picker via Calendar)
- Tidsväljare (hour/minute selects eller input type="time")

---

## Tekniska detaljer

### Meal Type Options
```typescript
const MEAL_TYPES = [
  { value: "Frukost", label: "🌅 Frukost" },
  { value: "Förmiddagssnack", label: "☀️ Förmiddagssnack" },
  { value: "Lunch", label: "🍽️ Lunch" },
  { value: "Mellanmål", label: "🍎 Mellanmål" },
  { value: "Middag", label: "🌙 Middag" },
  { value: "Kvällssnack", label: "🌜 Kvällssnack" },
];
```

### Bildbytesfunktionalitet
Knappar som triggar samma hidden input-fält som används vid första valet:
```typescript
<div className="absolute top-2 right-2 flex gap-2">
  <Button size="sm" variant="secondary" onClick={() => cameraInputRef.current?.click()}>
    <Camera className="w-4 h-4 mr-1" /> Ny bild
  </Button>
  <Button size="sm" variant="secondary" onClick={() => galleryInputRef.current?.click()}>
    <Image className="w-4 h-4 mr-1" /> Galleri
  </Button>
</div>
```

### Bekräftelsedialog för borttagning
Använd befintlig `AlertDialog` från shadcn för att bekräfta borttagning av måltid.

---

## Filer att skapa/ändra

| Fil | Åtgärd |
|-----|--------|
| `src/components/journal/EditMealSheet.tsx` | Skapa ny komponent för redigering |
| `src/components/journal/MealTypeDropdown.tsx` | Skapa återanvändbar dropdown |
| `src/components/journal/MealTimeSelector.tsx` | Skapa tid/datumväljare |
| `src/components/journal/AddMealSheet.tsx` | Utöka med redigeringsfält |
| `src/hooks/useJournalData.ts` | Uppdatera `updateEntry` med nya fält |
| `src/pages/Journal.tsx` | Koppla ihop redigeringsflödet |

---

## Stegordning för implementation

1. **MealTypeDropdown**: Skapa dropdown-komponent för måltidstyper
2. **MealTimeSelector**: Skapa tid/datum-väljare
3. **useJournalData**: Uppdatera `updateEntry` för att hantera alla nya fält
4. **AddMealSheet**: Lägg till redigeringsfält i resultat-vyn (titel, typ, tid, bild-knappar)
5. **EditMealSheet**: Skapa ny komponent för redigering av befintliga måltider
6. **Journal.tsx**: Koppla ihop allt - öppna EditMealSheet vid klick på måltid

---

## Design/UX-detaljer

### Bild med knappar
- Knappar visas ovanpå bilden i övre högra hörnet
- Semi-transparent bakgrund för läsbarhet
- Små, kompakta knappar med ikoner

### Måltidstyp-dropdown
- Använder `Select` från shadcn/ui
- Visar emoji + text för varje alternativ
- Standard: AI-vald typ, men går att ändra

### Tidsväljare
- Datum: Mini-kalender (react-day-picker)
- Tid: Två dropdowns (timme 00-23, minut 00-55 i 5-minutersintervall)
- Alternativt: native `input type="time"` för mobil

### Ta bort-knapp
- Röd färg för tydlighet
- Bekräftelsedialog innan borttagning
- Text: "Är du säker på att du vill ta bort denna måltid?"
