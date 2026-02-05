
# Plan: Hälsoprofil med redigerbar data

## Översikt

Profilsidan ska visa verklig användardata istället för hårdkodade värden, med möjlighet att redigera varje värde direkt via en penna-ikon. Data hämtas från olika delar av appen:

- **Vikt & Längd**: från AI-näringsspårning (`user_nutrition_settings`)
- **Blodtryck**: från hälsolokaliseringar (`health_tracking_entries`), förberett för Apple Health
- **Aktivitetsnivå**: från kvalificeringssteget (`intake_profiles`)
- **Diagnoser & Tillstånd**: från kvalificeringssteget, med framtida dietist-överskrivning

## Datakällor

| Värde | Tabell | Kolumn |
|-------|--------|--------|
| Vikt | user_nutrition_settings | weight_kg |
| Längd | user_nutrition_settings | height_cm |
| Blodtryck | health_tracking_entries | blood_pressure_systolic/diastolic |
| Aktivitetsnivå | intake_profiles | activity_level |
| Diagnoser | intake_profiles | unified_concern_category, primary_concern_subcategory, concern_tags |
| Mål | intake_profiles | preference_tags |

## Ändringar

### 1. Skapa en ny hook: `useHealthProfile`

En ny hook som aggregerar all hälsodata från olika källor:

- Hämtar vikt/längd från `user_nutrition_settings`
- Hämtar aktivitetsnivå och diagnoser från `intake_profiles`
- Hämtar senaste blodtryck från `health_tracking_entries`
- Tillhandahåller uppdateringsfunktioner för varje värde

### 2. Skapa redigeringskomponenter

**EditableHealthCard** - En generisk kortkomponent med:
- Värdevisning
- Penna-ikon i övre högra hörnet
- Sheet/modal för redigering vid klick

**EditSheets för varje typ:**
- `EditWeightSheet` - Numerisk input för vikt (kg)
- `EditHeightSheet` - Numerisk input för längd (cm)
- `EditBloodPressureSheet` - Två inputs (systoliskt/diastoliskt)
- `EditActivityLevelSheet` - RadioGroup med aktivitetsnivåer
- `EditConditionsSheet` - Redigera taggar/diagnoser

### 3. Uppdatera Profile.tsx

```text
┌─────────────────────────────────────────┐
│  ← Min hälsoprofil                      │
│     Din hälsoinformation                │
├─────────────────────────────────────────┤
│                                         │
│  GRUNDLÄGGANDE INFORMATION              │
│                                         │
│  ┌────────────┐ ┌────────────┐          │
│  │ ⚖️ Vikt  ✏️│ │ 📏 Längd ✏️│          │
│  │ 72 kg     │ │ 175 cm    │          │
│  └────────────┘ └────────────┘          │
│  ┌────────────┐ ┌────────────┐          │
│  │ ❤️ Blod  ✏️│ │ 🏃 Aktiv ✏️│          │
│  │ 120/80    │ │ Måttlig   │          │
│  └────────────┘ └────────────┘          │
│                                         │
│  DIAGNOSER & TILLSTÅND              ✏️  │
│  ┌─────────────────────────────────────┐│
│  │ [IBS] [Tarmhälsa]                  ││
│  └─────────────────────────────────────┘│
│                                         │
│  DINA MÅL                           ✏️  │
│  ┌─────────────────────────────────────┐│
│  │ • Gå ner i vikt                    ││
│  │ • Mer energi                       ││
│  └─────────────────────────────────────┘│
│                                         │
│  ⚠️ Din information är skyddad         │
│                                         │
└─────────────────────────────────────────┘
```

### 4. Dataflöde

```text
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│  AI-närings-     │────▶│ user_nutrition_  │────▶│                  │
│  spårning        │     │ settings         │     │                  │
│  (onboarding)    │     │ (vikt, längd)    │     │                  │
│                  │     │                  │     │   Profile.tsx    │
└──────────────────┘     └──────────────────┘     │                  │
                                                  │   Läser +        │
┌──────────────────┐     ┌──────────────────┐     │   uppdaterar     │
│                  │     │                  │     │   alla värden    │
│  Kvalificering   │────▶│ intake_profiles  │────▶│                  │
│  (onboarding)    │     │ (aktivitet,      │     │                  │
│                  │     │  diagnoser, mål) │     │                  │
└──────────────────┘     └──────────────────┘     │                  │
                                                  │                  │
┌──────────────────┐     ┌──────────────────┐     │                  │
│                  │     │                  │     │                  │
│  Manuell log /   │────▶│ health_tracking_ │────▶│                  │
│  Apple Health*   │     │ entries          │     │                  │
│                  │     │ (blodtryck)      │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                         * Apple Health ej byggd
```

## Tekniska detaljer

### Ny hook: useHealthProfile.ts

```typescript
interface HealthProfileData {
  // Från user_nutrition_settings
  weightKg?: number;
  heightCm?: number;
  
  // Från intake_profiles
  activityLevel?: ActivityLevel;
  conditions: string[];  // Mappade från unified_concern_category + subcategory
  goals: string[];       // Mappade från preference_tags
  
  // Från health_tracking_entries
  bloodPressure?: { systolic: number; diastolic: number };
}

interface UseHealthProfile {
  data: HealthProfileData;
  loading: boolean;
  
  updateWeight: (kg: number) => Promise<void>;
  updateHeight: (cm: number) => Promise<void>;
  updateBloodPressure: (systolic: number, diastolic: number) => Promise<void>;
  updateActivityLevel: (level: ActivityLevel) => Promise<void>;
  updateConditions: (conditions: string[]) => Promise<void>;
  updateGoals: (goals: string[]) => Promise<void>;
}
```

### Mappning av diagnoser

Diagnoser visas baserat på användarens `unified_concern_category` och `primary_concern_subcategory`:

| Kategori | Visas som |
|----------|-----------|
| gut_health + ibs | "IBS" |
| gut_health + crohns | "Crohns sjukdom" |
| diabetes + type2 | "Typ 2-diabetes" |
| heart_health + high_blood_pressure | "Högt blodtryck" |
| womens_health + pcos | "PCOS" |

### Mappning av mål

Mål hämtas från `preference_tags` i intake_profiles och mappas till svenska etiketter:

| Tag | Visas som |
|-----|-----------|
| goal_weight_loss | "Gå ner i vikt" |
| goal_energy | "Få mer energi" |
| goal_muscle | "Bygga muskler" |
| goal_regular_eating | "Äta mer regelbundet" |

## Nya filer

1. `src/hooks/useHealthProfile.ts` - Aggregerar all hälsodata
2. `src/components/profile/EditableHealthCard.tsx` - Kort med penna-ikon
3. `src/components/profile/EditWeightSheet.tsx` - Redigera vikt
4. `src/components/profile/EditHeightSheet.tsx` - Redigera längd
5. `src/components/profile/EditBloodPressureSheet.tsx` - Redigera blodtryck
6. `src/components/profile/EditActivitySheet.tsx` - Redigera aktivitetsnivå
7. `src/components/profile/EditConditionsSheet.tsx` - Redigera diagnoser
8. `src/components/profile/EditGoalsSheet.tsx` - Redigera mål

## Uppdaterade filer

1. `src/pages/Profile.tsx` - Använder ny hook och redigerbara komponenter

## Om data saknas

Om ett värde inte finns ifyllt visas:
- "–" eller "Ej angivet" som placeholder
- Penna-ikonen är fortfarande klickbar för att lägga till värdet
- Ett subtilt meddelande kan visas: "Lägg till din vikt för att förbättra dina personliga rekommendationer"

## Framtida förberedelser

**Apple Health-integration (ej i denna plan):**
- Blodtrycksrutan förbereds för att visa "Synkad från Apple Health" när integrationen är byggd
- `apple_health_settings`-tabellen finns redan för att spåra kopplingsstatusen

**Dietist-överskrivning:**
- Diagnosfältet är förberett för att markeras med "Satt av dietist" i framtiden
- Användaren kan fortfarande se men inte redigera dietist-satta diagnoser
