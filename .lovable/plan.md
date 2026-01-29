

## Förbättringar i redigera måltid-vyn

### Sammanfattning
Tre funktionella förbättringar i EditMealSheet-komponenten:
1. Snabbknappar för mängdjustering (Hälften, 3/4, 1.5x) ska endast kunna klickas en gång
2. När titeln ändras ska AI:n kunna analysera den nya beskrivningen
3. Näringsinput-fält ska bli tomma (inte visa "0") vid redigering

---

### Del 1: Begränsa snabbknappar till ett klick

**Problem:** Knapparna "Hälften", "3/4" och "1.5x" kan klickas flera gånger, vilket multiplicerar värdena exponentiellt (t.ex. hälften av hälften = 25%).

**Lösning:** Lägg till en state-variabel som spårar vilken multiplikator som har applicerats. När en knapp klickats blir den inaktiverad och visuellt markerad.

**Ny state:**
```typescript
const [appliedMultiplier, setAppliedMultiplier] = useState<number | null>(null);
```

**Reset vid entry-ändring:**
- Återställ `appliedMultiplier` till `null` när `entry` ändras i `useEffect`

**Uppdaterad handleQuickAdjust:**
```typescript
const handleQuickAdjust = (multiplier: number) => {
  if (appliedMultiplier !== null) return; // Redan applicerad
  
  setAppliedMultiplier(multiplier);
  setCalories(Math.round(calories * multiplier));
  // ... resten av logiken
};
```

**Uppdaterade knappar:**
- Disabled om `appliedMultiplier !== null`
- Visuell markering på den aktiva knappen (variant "default" istället för "outline")

---

### Del 2: AI-analys vid titeländring

**Problem:** När användaren ändrar titeln händer ingenting automatiskt. Användaren förväntar sig samma beteende som "beskriv din måltid" i AddMealSheet.

**Lösning:** Lägg till en "Analysera"-knapp bredvid titelfältet som triggar AI-analys baserat på den nya titeln.

**Ny UI-struktur:**
```text
┌─────────────────────────────────────────┐
│  Titel                                  │
│  ┌───────────────────────┐ ┌──────────┐ │
│  │ Pasta carbonara...    │ │ 🔄 Analys│ │
│  └───────────────────────┘ └──────────┘ │
└─────────────────────────────────────────┘
```

**Ny funktion:**
```typescript
const handleReanalyzeFromTitle = async () => {
  if (!mealName.trim()) return;
  
  setIsAnalyzing(true);
  try {
    const { data: result, error } = await supabase.functions.invoke("analyze-food", {
      body: {
        analysisType: "text",
        textDescription: mealName,
      },
    });
    
    if (error) throw error;
    
    // Uppdatera alla värden från AI-analysen
    const estimation = result as FoodEstimation;
    setCalories(estimation.calories);
    setProtein(estimation.protein);
    // ... etc
    
    toast({ title: "Måltid analyserad" });
  } catch (error) {
    toast({ title: "Analys misslyckades", variant: "destructive" });
  } finally {
    setIsAnalyzing(false);
  }
};
```

---

### Del 3: Tomma fält istället för "0"

**Problem:** När ett näringsfält visar "0" och användaren vill skriva ett nytt värde måste de först radera nollan.

**Lösning:** Använd string-state för input-värden och konvertera endast vid behov. När värdet är 0 ska fältet vara tomt.

**Ändrad state-hantering:**

```typescript
// Istället för: const [calories, setCalories] = useState(0);
// Använd string för input:
const [caloriesInput, setCaloriesInput] = useState("");
const [proteinInput, setProteinInput] = useState("");
const [carbsInput, setCarbsInput] = useState("");
const [fatInput, setFatInput] = useState("");

// Parsade värden för beräkningar:
const calories = parseFloat(caloriesInput) || 0;
const protein = parseFloat(proteinInput) || 0;
const carbs = parseFloat(carbsInput) || 0;
const fat = parseFloat(fatInput) || 0;
```

**Uppdaterad useEffect (vid entry-laddning):**
```typescript
useEffect(() => {
  if (entry && isOpen) {
    setCaloriesInput(entry.calories > 0 ? String(entry.calories) : "");
    setProteinInput(entry.protein > 0 ? String(entry.protein) : "");
    setCarbsInput(entry.carbs > 0 ? String(entry.carbs) : "");
    setFatInput(entry.fat > 0 ? String(entry.fat) : "");
    // ... resten
  }
}, [entry, isOpen]);
```

**Uppdaterade Input-komponenter:**
```tsx
<Input
  type="number"
  value={caloriesInput}
  onChange={(e) => setCaloriesInput(e.target.value)}
  placeholder="0"
  // ...
/>
```

**handleQuickAdjust uppdateras:**
```typescript
const handleQuickAdjust = (multiplier: number) => {
  if (appliedMultiplier !== null) return;
  
  setAppliedMultiplier(multiplier);
  const newCalories = Math.round(calories * multiplier);
  setCaloriesInput(newCalories > 0 ? String(newCalories) : "");
  // ... samma för protein, carbs, fat
};
```

---

### Tekniska detaljer

**Filer som ändras:**

| Fil | Åtgärd |
|-----|--------|
| `src/components/journal/EditMealSheet.tsx` | Alla tre förändringar |

**Ingen databasändring krävs.**

**Sammanfattning av ändringar:**

1. **Ny state:** `appliedMultiplier` för att spåra om snabbknapp använts
2. **Ny funktion:** `handleReanalyzeFromTitle()` för AI-analys baserat på titel
3. **Ändrad state-modell:** String-inputs för näringsfält med tom sträng för 0-värden
4. **UI-uppdateringar:** 
   - Snabbknappar får `disabled` och visuell markering
   - Ny "Analysera"-knapp bredvid titelfältet
   - Input-placeholder visar "0" när fältet är tomt

