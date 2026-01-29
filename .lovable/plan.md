

## Lägg till symptomspårning i journalen

### Sammanfattning
Implementera en ny funktion för att logga och visa symptom i journalen. Symptom kan kopplas till måltider eller registreras fristående. Inkluderar röstinmatning via ElevenLabs Speech-to-Text samt visning i tidslinjens struktur.

---

### Del 1: Databasschema

**Ny tabell: `symptom_entries`**

```sql
CREATE TABLE public.symptom_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES public.nutrition_entries(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  symptom_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE public.symptom_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own symptoms" 
  ON public.symptom_entries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symptoms" 
  ON public.symptom_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own symptoms" 
  ON public.symptom_entries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own symptoms" 
  ON public.symptom_entries FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Dietists can view assigned patient symptoms" 
  ON public.symptom_entries FOR SELECT 
  USING (is_assigned_dietist(user_id));
```

---

### Del 2: Utöka useJournalData hook

**Nya typer:**
```typescript
export interface SymptomEntry {
  id: string;
  mealId: string | null;
  description: string;
  symptomTime: Date;
  createdAt: Date;
}
```

**Nya funktioner i hooken:**
- `symptoms: SymptomEntry[]` - Lista över dagens symptom
- `addSymptom(symptom)` - Lägg till nytt symptom
- `updateSymptom(id, updates)` - Uppdatera symptom
- `deleteSymptom(id)` - Ta bort symptom

---

### Del 3: Ny komponent - AddSymptomSheet

**Fil:** `src/components/journal/AddSymptomSheet.tsx`

**UI-struktur:**
```text
┌─────────────────────────────────────────┐
│  Lägg till symptom                      │
├─────────────────────────────────────────┤
│                                         │
│  Koppla till måltid                     │
│  ┌─────────────────────────────────────┐│
│  │ [Dropdown: Välj måltid...]          ││
│  │ • Ej kopplat till måltid            ││
│  │ • Frukost - Havregrynsgröt (08:15)  ││
│  │ • Lunch - Pasta carbonara (12:30)   ││
│  └─────────────────────────────────────┘│
│                                         │
│  Tid för symptom                        │
│  ┌──────────────┐                       │
│  │ [14:30]      │                       │
│  └──────────────┘                       │
│                                         │
│  Beskriv ditt symptom                   │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │  Fick ont i magen 30 min efter...   ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│        [🎤 Tala in]                     │
│                                         │
├─────────────────────────────────────────┤
│  [Avbryt]               [Lägg till]     │
└─────────────────────────────────────────┘
```

**Funktionalitet:**
- Dropdown med alla måltider för vald dag + "Ej kopplat"
- Tidsväljare som defaultar till nuvarande tid
- Textarea för symptombeskrivning
- Mikrofon-knapp för röstinmatning

---

### Del 4: ElevenLabs Speech-to-Text integration

**Steg 1: Anslut ElevenLabs connector**

Använd ElevenLabs-connectorn för att få API-nyckel.

**Steg 2: Skapa Edge Function för token**

**Fil:** `supabase/functions/elevenlabs-scribe-token/index.ts`

```typescript
serve(async (req) => {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  
  const response = await fetch(
    "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
    {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
    }
  );
  
  const { token } = await response.json();
  return new Response(JSON.stringify({ token }));
});
```

**Steg 3: React-komponent för röstinmatning**

Använd `@elevenlabs/react` och `useScribe` hook för realtidstranskribering.

---

### Del 5: Ny komponent - EditSymptomSheet

**Fil:** `src/components/journal/EditSymptomSheet.tsx`

Samma layout som AddSymptomSheet men med:
- Förpopulerade värden
- Uppdateringslogik istället för skapande
- Radera-knapp

---

### Del 6: Ny komponent - SymptomCard

**Fil:** `src/components/journal/SymptomCard.tsx`

**Design:**
```text
┌─────────────────────────────────────────┐
│  ⚠️  14:30                              │
│  Fick ont i magen 30 min efter lunch    │
│  [Kopplat till: Lunch - Pasta...]       │
└─────────────────────────────────────────┘
```

- Varningsikon i orange/gul för att skilja från måltider
- Visar tid och beskrivning
- Länk till kopplad måltid om sådan finns

---

### Del 7: Uppdatera MealTimeline

**Ändra logik för att visa symptom:**

1. Kombinera `entries` och `symptoms` till en timeline
2. Sortera baserat på tid (måltider: createdAt, symptom: symptomTime)
3. Symptom kopplade till måltider visas som sub-items
4. Fristående symptom visas som egna items i tidslinjen

**Ny struktur:**
```typescript
interface TimelineItem {
  type: "meal" | "symptom";
  id: string;
  time: Date;
  data: NutritionEntry | SymptomEntry;
  linkedSymptoms?: SymptomEntry[]; // För måltider
}
```

---

### Del 8: Uppdatera Journal.tsx

**Lägg till knapp:**
```tsx
<div className="flex gap-3">
  <Button variant="outline" className="flex-1 gap-2" onClick={() => setIsAddMealOpen(true)}>
    <Plus className="w-4 h-4" />
    Lägg till måltid
  </Button>
  <Button 
    variant="outline" 
    className="flex-1 gap-2" 
    onClick={() => setIsAddSymptomOpen(true)}
    disabled={entries.length === 0}
  >
    <AlertCircle className="w-4 h-4" />
    Lägg till symptom
  </Button>
</div>
```

**Ny state:**
- `isAddSymptomOpen`
- `isEditSymptomOpen`
- `editingSymptom`

---

### Tekniska detaljer

**Nya beroenden:**
```bash
npm install @elevenlabs/react
```

**Filer som skapas:**

| Fil | Beskrivning |
|-----|-------------|
| `supabase/migrations/...` | Databasmigrering för `symptom_entries` |
| `supabase/functions/elevenlabs-scribe-token/index.ts` | Edge function för token |
| `src/components/journal/AddSymptomSheet.tsx` | Sheet för att lägga till symptom |
| `src/components/journal/EditSymptomSheet.tsx` | Sheet för att redigera symptom |
| `src/components/journal/SymptomCard.tsx` | Kort för visning av symptom |

**Filer som ändras:**

| Fil | Åtgärd |
|-----|--------|
| `src/hooks/useJournalData.ts` | Utöka med symptom-funktionalitet |
| `src/components/journal/MealTimeline.tsx` | Visa symptom i tidslinjen |
| `src/pages/Journal.tsx` | Lägg till symptom-knapp och sheets |

---

### Flöde för användaren

1. Användaren lägger till en måltid
2. "Lägg till symptom"-knappen blir aktiv
3. Användaren klickar på knappen
4. Sheet öppnas med dropdown för måltidsval
5. Användaren väljer måltid eller "Ej kopplat"
6. Tid sätts (default: nu)
7. Användaren skriver eller talar in beskrivning
8. Klickar "Lägg till"
9. Symptomet visas i tidslinjen:
   - Som sub-item under måltiden (om kopplat)
   - Som eget item (om ej kopplat)
10. Klick på symptomet öppnar redigering

