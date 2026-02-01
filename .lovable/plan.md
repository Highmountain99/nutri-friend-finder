

## Anpassningsbar Utvecklingssida

### Bakgrund

Utvecklingssidan behöver visa olika innehåll beroende på användarens hälsobehov som anges i kvalificeringsflödet. Olika tillstånd kräver olika behandlingsmodeller:

| Tillstånd | Behandlingsmodell | Fokusområden |
|-----------|-------------------|--------------|
| **Viktminskning** | 12-veckors fasindelad plan | BMI-trend, kalorimål, vikt-loggning, milstolpar |
| **Diabetes** | Kontinuerlig övervakning | Blodsockernivåer, HbA1c-trender, kolhydratintag |
| **Tarmhälsa (IBS)** | 3-fas FODMAP-protokoll | Eliminering, återintroduktion, personalisering |
| **Ätstörning** | Stadiebaserad återhämtning | Psykologisk trygghet, regelbundna måltider |
| **Hjärthälsa** | Livsstilsförändring | Kolesterol, blodtryck, kostmönster |
| **Kvinnohälsa (PCOS)** | Hormonbalans-fokus | Insulin, androgener, vikthantering |
| **Allmän hälsa** | Balanserat näringsfokus | Kalorier, makros, aktivitet |

---

### Arkitektur

```text
Progress.tsx
    │
    ├── useProgressData.ts (NY hook)
    │       └── Hämtar intake_profiles + relevanta metrics
    │
    ├── ProgressRouter.tsx (NY)
    │       └── Väljer rätt layout baserat på primaryConcernCategory
    │
    └── Layouts per tillstånd:
            ├── WeightLossProgress.tsx
            ├── DiabetesProgress.tsx
            ├── GutHealthProgress.tsx
            ├── EatingDisorderProgress.tsx
            ├── HeartHealthProgress.tsx
            ├── WomensHealthProgress.tsx
            └── GeneralHealthProgress.tsx
```

---

### Datamodell - Ny tabell

Eftersom olika tillstånd kräver olika metriker (blodsocker, vikt, HbA1c, etc.), behövs en ny tabell för att lagra dessa värden:

```sql
CREATE TABLE health_tracking_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_type TEXT NOT NULL,  -- 'blood_sugar', 'weight', 'hba1c', 'blood_pressure', etc.
  value NUMERIC NOT NULL,
  unit TEXT,                  -- 'mmol/L', 'kg', '%', 'mmHg'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entry_date, metric_type)
);
```

---

### Layouter per tillstånd

#### 1. Viktminskning (WeightLossProgress.tsx)

```text
┌─────────────────────────────────────────┐
│  Din viktresa                           │
│  ──────────────────────────────────     │
│  Vecka 3 av 12                          │
│  [████████░░░░░░░░░░░░░░░] 25%          │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐       │
│  │  Startvikt  │  │  Nu         │       │
│  │  85.2 kg    │  │  83.1 kg    │       │
│  └─────────────┘  └─────────────┘       │
│                                         │
│  ┌─────────────┐  ┌─────────────┐       │
│  │  Mål        │  │  Kvar       │       │
│  │  75 kg      │  │  8.1 kg     │       │
│  └─────────────┘  └─────────────┘       │
├─────────────────────────────────────────┤
│  📈 Viktutveckling (graf senaste 4 v)   │
├─────────────────────────────────────────┤
│  🏆 MILSTOLPAR                          │
│  ✅ Första kilo                         │
│  ✅ 5% av målvikt                       │
│  ○  10% av målvikt                      │
│  ○  Halvvägs                            │
├─────────────────────────────────────────┤
│  📊 Denna vecka                         │
│  Kalorimål: 1650 / 1800 (92%)           │
│  Aktiva dagar: 5/7                      │
└─────────────────────────────────────────┘
```

---

#### 2. Diabetes (DiabetesProgress.tsx)

```text
┌─────────────────────────────────────────┐
│  Blodsockerkontroll                     │
│  ──────────────────────────────────     │
│  Senaste HbA1c: 6.8%                    │
│  Mål: <7.0%                             │
├─────────────────────────────────────────┤
│  📊 Dagsöversikt                        │
│  ┌─────────────┐  ┌─────────────┐       │
│  │  Morgon     │  │  Efter mat  │       │
│  │  5.4 mmol/L │  │  7.2 mmol/L │       │
│  │  ✅ I mål   │  │  ✅ I mål   │       │
│  └─────────────┘  └─────────────┘       │
├─────────────────────────────────────────┤
│  📈 Blodsocker senaste 7 dagar          │
│  [Graf med normalgräns markerat]        │
├─────────────────────────────────────────┤
│  🍽️ Kolhydratintag idag                │
│  [████████████░░░░░] 145g / 180g        │
├─────────────────────────────────────────┤
│  📆 Tid i målintervall (4-10 mmol/L)    │
│  Denna vecka: 78%                       │
│  Förra veckan: 72%                      │
│  [Trend: ↑ +6%]                         │
├─────────────────────────────────────────┤
│  🎯 FOKUSOMRÅDEN                        │
│  • Håll kolhydraterna jämna över dagen  │
│  • Logga blodsocker efter måltid        │
└─────────────────────────────────────────┘
```

---

#### 3. Tarmhälsa / IBS (GutHealthProgress.tsx)

```text
┌─────────────────────────────────────────┐
│  FODMAP-resan                           │
│  ──────────────────────────────────     │
│  Fas 2: Återintroduktion                │
├─────────────────────────────────────────┤
│  📊 Fasöversikt                         │
│  [1. Eliminering ✅] [2. Åter... ●] [3. Personalisering ○] │
├─────────────────────────────────────────┤
│  📝 Aktuell utmaning                    │
│  ┌─────────────────────────────────┐    │
│  │  Testar: Laktos (mjölk)         │    │
│  │  Dag 2 av 3                     │    │
│  │  [Logga reaktion]               │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  🔍 Identifierade triggers              │
│  ⚠️  Lök (oligosackarider)              │
│  ⚠️  Äpple (fruktos)                    │
│  ✅ Laktosfria mejerier                 │
├─────────────────────────────────────────┤
│  📆 Symptomfria dagar                   │
│  Denna vecka: 5/7 dagar                 │
│  Trend: ↑ bättre än förra veckan        │
├─────────────────────────────────────────┤
│  📋 Nästa steg                          │
│  • Slutför laktostest                   │
│  • Börja testa fruktan (bröd)           │
└─────────────────────────────────────────┘
```

---

#### 4. Ätstörning (EatingDisorderProgress.tsx)

```text
┌─────────────────────────────────────────┐
│  Din återhämtning                       │
│  ──────────────────────────────────     │
│  En dag i taget                         │
├─────────────────────────────────────────┤
│  💚 Dagens fokus                        │
│  ┌─────────────────────────────────┐    │
│  │  "Lyssna på din kropp och       │    │
│  │   var snäll mot dig själv"      │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  🍽️ Måltidsrytm                        │
│  ☑️ Frukost                             │
│  ☑️ Lunch                               │
│  ○  Middag                              │
│  ○  Mellanmål                           │
├─────────────────────────────────────────┤
│  📈 Regelbundenhet (30 dagar)           │
│  [Heatmap utan kalorier]                │
│  Dagar med 3+ måltider: 24/30           │
├─────────────────────────────────────────┤
│  🎯 Veckomål från dietist               │
│  ✅ Äta frukost varje dag               │
│  ○  Prova en ny maträtt                 │
│  ○  Äta tillsammans med någon           │
├─────────────────────────────────────────┤
│  📅 Nästa samtal                        │
│  Onsdag 5 feb kl 14:00                  │
│  [Boka om] [Förbered anteckningar]      │
└─────────────────────────────────────────┘
```

**Viktigt:** Ingen kalorivisning, fokus på regelbundenhet och positiva beteenden.

---

#### 5. Hjärthälsa (HeartHealthProgress.tsx)

```text
┌─────────────────────────────────────────┐
│  Hjärthälsa                             │
├─────────────────────────────────────────┤
│  📊 Dina värden                         │
│  ┌─────────────┐  ┌─────────────┐       │
│  │  Kolesterol │  │  Blodtryck  │       │
│  │  5.2 mmol/L │  │  128/82     │       │
│  │  Mål: <5.0  │  │  Mål: <130  │       │
│  └─────────────┘  └─────────────┘       │
├─────────────────────────────────────────┤
│  🥗 Medelhavspoäng                      │
│  [████████████░░░░] 72/100              │
│  Denna vecka vs förra: ↑ +5             │
├─────────────────────────────────────────┤
│  📈 Kolesteroltrend (6 mån)             │
│  [Graf med mål markerat]                │
├─────────────────────────────────────────┤
│  ✅ Hjärtvänliga val denna vecka        │
│  • 4 portioner fet fisk                 │
│  • 12 portioner grönsaker               │
│  • 3 portioner baljväxter               │
└─────────────────────────────────────────┘
```

---

### Implementation - Nya filer

```text
src/
├── pages/
│   └── Progress.tsx                  (uppdateras - routing-logik)
│
├── components/progress/
│   ├── ProgressRouter.tsx            (NY - väljer layout)
│   ├── WeightLossProgress.tsx        (NY)
│   ├── DiabetesProgress.tsx          (NY)
│   ├── GutHealthProgress.tsx         (NY)
│   ├── EatingDisorderProgress.tsx    (NY)
│   ├── HeartHealthProgress.tsx       (NY)
│   ├── WomensHealthProgress.tsx      (NY)
│   ├── GeneralHealthProgress.tsx     (NY)
│   │
│   └── shared/
│       ├── ProgressHeader.tsx        (NY - gemensam header)
│       ├── MetricCard.tsx            (NY - enskilt mätvärde)
│       ├── TrendChart.tsx            (NY - linjediagram med recharts)
│       ├── MilestoneList.tsx         (NY - prestationer/mål)
│       ├── WeeklyHeatmap.tsx         (NY - aktivitetsöversikt)
│       └── LogMetricSheet.tsx        (NY - logga värden)
│
├── hooks/
│   └── useProgressData.ts            (NY - hämtar relevant data)
│
└── types/
    └── progress.ts                   (NY - typdefinitioner)
```

---

### Databas-ändringar

1. **Ny tabell: health_tracking_entries**
   - Lagrar blodsocker, vikt, HbA1c, blodtryck etc.
   - RLS-policies för att endast användaren kan se sina egna mätvärden
   - Dietister kan se tilldelade patienters mätvärden

2. **Ny tabell: treatment_milestones**
   - Definierar milstolpar per behandlingstyp
   - Spårar användarens framsteg

---

### Hook: useProgressData.ts

```typescript
interface ProgressData {
  intakeProfile: IntakeProfile | null;
  healthEntries: HealthEntry[];
  milestones: Milestone[];
  weeklyStats: WeeklyStats;
  treatmentPhase: TreatmentPhase;
}

// Returnerar data baserat på användarens primaryConcernCategory
export function useProgressData() {
  const { user } = useAuth();
  const { profile } = useIntakeProfile();
  
  // Hämta relevanta metriker baserat på tillstånd
  // T.ex. för diabetes: blood_sugar, hba1c
  // För viktminskning: weight
  // För IBS: symptom_entries
}
```

---

### Implementationsordning

1. **Skapa databastabeller**
   - health_tracking_entries med RLS
   - treatment_milestones (valfritt, kan vara hårdkodat initialt)

2. **Skapa typer och hook**
   - types/progress.ts
   - hooks/useProgressData.ts

3. **Skapa delade komponenter**
   - MetricCard, TrendChart, MilestoneList, LogMetricSheet

4. **Skapa ProgressRouter.tsx**
   - Läser intake_profiles.primary_concern_category
   - Renderar rätt layout-komponent

5. **Implementera layouts i prioritetsordning:**
   - GeneralHealthProgress (fallback)
   - WeightLossProgress
   - DiabetesProgress
   - GutHealthProgress
   - Övriga efter behov

6. **Uppdatera Progress.tsx**
   - Ersätt nuvarande statiska innehåll med ProgressRouter

---

### Särskilda överväganden

**Ätstörning:**
- Ingen kalorivisning överhuvudtaget
- Fokus på regelbundenhet och positiva beteenden
- Mjukare språk och ingen "prestationspress"

**Diabetes:**
- Möjlighet att logga blodsocker direkt i appen
- Integration med CGM-data (framtida feature)

**IBS/FODMAP:**
- Strukturerat fas-system
- Koppling till symptom_entries-tabellen

