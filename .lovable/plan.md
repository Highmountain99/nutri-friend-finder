

## Flytta synlighetsinställningar till "Justera mål"-dialogen

### Sammanfattning
Ta bort den fristående "Spåra kalorier"-knappen och integrera synlighetsinställningar direkt i "Justera mål"-dialogen. Varje näringsämne (kalorier, protein, kolhydrater, fett) får en individuell switch för att dölja/visa det i journalen. Data fortsätter att spåras i bakgrunden för dietistens åtkomst.

---

### Del 1: Uppdatera databasschemat

**Ändring i `user_nutrition_settings`-tabellen:**

Byt ut den enstaka `calorie_tracking_enabled`-kolumnen mot fyra separata kolumner:
- `show_calories` (boolean, default true)
- `show_protein` (boolean, default true)  
- `show_carbs` (boolean, default true)
- `show_fat` (boolean, default true)

---

### Del 2: Uppdatera Settings.tsx

**Ta bort:**
- "Spåra kalorier" toggle-knappen (rad 219-230)
- `handleToggleCalorieTracking` funktionen

**Uppdatera "Justera mål"-dialogen:**
- Lägg till en Switch under varje näringsämne-input
- Switcharna styr synlighet: "Visa i journal"
- Spara synlighetsinställningar tillsammans med målen

**Ny dialogstruktur:**
```text
┌─────────────────────────────────┐
│  Justera dagliga mål            │
├─────────────────────────────────┤
│  Kalorier (kcal)                │
│  [Input: 2000]                  │
│  ○ Visa i journal    [Switch]   │
│                                 │
│  Protein (g)                    │
│  [Input: 50]                    │
│  ○ Visa i journal    [Switch]   │
│                                 │
│  Kolhydrater (g)                │
│  [Input: 250]                   │
│  ○ Visa i journal    [Switch]   │
│                                 │
│  Fett (g)                       │
│  [Input: 65]                    │
│  ○ Visa i journal    [Switch]   │
├─────────────────────────────────┤
│  [Avbryt]           [Spara mål] │
└─────────────────────────────────┘
```

---

### Del 3: Uppdatera useJournalData hook

**Utöka NutritionSettings-typen:**
```typescript
interface NutritionSettings {
  aiTrackingEnabled: boolean;
  aiTrackingOnboardingCompleted: boolean;
  // Nya synlighetsfält
  showCalories: boolean;
  showProtein: boolean;
  showCarbs: boolean;
  showFat: boolean;
  // Övriga fält...
}
```

**Uppdatera loadData och updateSettings:**
- Ladda de nya synlighetsfälten från databasen
- Spara synlighetsinställningar vid uppdatering

---

### Del 4: Uppdatera Journal.tsx

**Filtrera nutritionCards baserat på synlighet:**

```typescript
const visibleNutritionCards = nutritionCards.filter(card => {
  if (card.label === "Kalorier") return settings.showCalories;
  if (card.label === "Protein") return settings.showProtein;
  if (card.label === "Kolhydrater") return settings.showCarbs;
  if (card.label === "Fett") return settings.showFat;
  return true;
});
```

**Dynamisk grid-layout:**
- Anpassa grid baserat på antal synliga kort (1-4 kort)
- Behåll 2x2 layout om alla visas, annars responsiv justering

---

### Del 5: MealEntryCard och EditMealSheet

**Dölj dolda näringsämnen i måltidskorten:**
- Filtrera bort dolda makros från visningen
- Data finns fortfarande kvar i databasen

---

### Tekniska detaljer

**Databasmigrering:**
```sql
-- Lägg till nya synlighetskolumner
ALTER TABLE user_nutrition_settings
ADD COLUMN show_calories BOOLEAN DEFAULT true,
ADD COLUMN show_protein BOOLEAN DEFAULT true,
ADD COLUMN show_carbs BOOLEAN DEFAULT true,
ADD COLUMN show_fat BOOLEAN DEFAULT true;

-- Ta bort gammal kolumn (valfritt, kan behållas för bakåtkompatibilitet)
-- ALTER TABLE user_nutrition_settings DROP COLUMN calorie_tracking_enabled;
```

**Filer som ändras:**

| Fil | Åtgärd |
|-----|--------|
| `supabase/migrations/...` | Databasmigrering för nya kolumner |
| `src/pages/Settings.tsx` | Ta bort toggle, uppdatera dialog |
| `src/hooks/useJournalData.ts` | Utöka NutritionSettings, hantera nya fält |
| `src/pages/Journal.tsx` | Filtrera synliga nutritionskort |
| `src/components/journal/MealEntryCard.tsx` | Dölj osynliga makros |
| `src/components/journal/EditMealSheet.tsx` | Dölj osynliga makros i redigering |

---

### Viktig funktionalitet

**Dietistens åtkomst bevaras:**
- Data spåras alltid i `nutrition_entries`-tabellen
- Synlighetsinställningar påverkar endast användarens vy
- Dietister kan fortfarande se all data via sin dashboard

