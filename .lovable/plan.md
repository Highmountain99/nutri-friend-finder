

# Plan: Ätstörning — dynamiskt blockbaserat utvecklingsvy

## Sammanfattning

Omarbeta utvecklingsvyn för ätstörningspatienter till ett dynamiskt blocksystem där dietisten väljer block och patientens journaldata automatiskt fyller/uppdaterar relevanta block. Inga kalorier, makros eller viktmål visas.

## Nya blocktyper (utöver befintliga)

Utöka `CATEGORY_SECTIONS` i `templateDefaults.ts` med nya eating_disorder-block:

| Block-ID | Typ | Datakälla |
|---|---|---|
| `ed_focus` | Fokusblock | Manuellt av dietist / AI-förslag |
| `ed_meal_rhythm` | Strukturblock | Auto från `nutrition_entries` idag |
| `ed_meal_structure` | Strukturblock | Auto — analyserar senaste 7d |
| `ed_regularity_30d` | Progressionsblock | Auto — 30d grid |
| `ed_behavior_goals` | Beteendeblock | Manuellt / från behandlingsplan |
| `ed_follow_up` | Uppföljningsblock | Manuellt / nästa appointment |
| `ed_symptom_patterns` | Progressionsblock | Auto från `symptom_entries` |
| `ed_weekly_checkin` | Progressionsblock | Auto — stabilitet 7d |

## Arkitektur

```text
EatingDisorderProgress (patient-vy)
  └── Renderar block baserat på patient_progress_config.visible_sections
       ├── ed_focus → Visar dietistens fokustext (från treatment_plan notes)
       ├── ed_meal_rhythm → Hämtar dagens nutrition_entries, visar ✅/⭕
       ├── ed_meal_structure → Analyserar 7d: "3 mål + mellanmål" etc
       ├── ed_regularity_30d → 30d grid, räknar dagar med 3+ måltider
       ├── ed_behavior_goals → Hämtar milestones från aktiv behandlingsplan
       ├── ed_symptom_patterns → Enkel mönsteranalys från symptom_entries
       ├── ed_weekly_checkin → Sammanfattning senaste 7d
       └── ed_follow_up → Nästa appointment + fokustext
```

## Filändringar

### 1. `src/components/progress/EatingDisorderProgress.tsx` — Total omskrivning
- Hämta `nutrition_entries` (senaste 30d) och `symptom_entries` via nya queries
- Hämta `appointments` (nästa bokade)
- Hämta aktiv `treatment_plan` med milestones
- Rendera block dynamiskt baserat på `visibleSections` (från progress config)
- Varje block som ett eget Card med ikon, titel, status-badge (manuell/auto/AI)
- Inga kalorier, inga makros, inga viktvärden

### 2. `src/hooks/useEatingDisorderBlocks.ts` — Ny hook
- Hämtar och beräknar all blockdata:
  - **Måltidsrytm idag**: Grupperar dagens `nutrition_entries` efter `meal_type` → Frukost/Lunch/Middag/Mellanmål ✅/⭕
  - **Måltidsstruktur**: Analyserar 7d — klassificerar som "regelbunden/delvis/oregelbunden"
  - **Regelbundenhet 30d**: Räknar dagar med ≥3 entries, returnerar array för grid
  - **Symptommönster**: Grupperar symptom efter tid/koppling till måltid
  - **Vecko-checkin**: Antal loggade dagar, stabilitet
- Hämtar nästa appointment från `appointments`
- Hämtar beteendemål från aktiv treatment_plan milestones

### 3. `src/components/dietitian/progress-builder/templateDefaults.ts` — Uppdatera
- Ersätt nuvarande `eating_disorder` sections med de nya blocken
- Lägg till beskrivningar och labels

### 4. `src/components/dietitian/progress-builder/ModulePreview.tsx` — Lägg till previews
- Nya preview-komponenter för varje ed_-block
- Uppdatera `SECTION_ICONS` och `PREVIEW_RENDERERS`

### 5. `src/components/progress/shared/EDBlockCards.tsx` — Ny fil
- Återanvändbara blockkomponenter:
  - `FocusBlock` — visar fokustext med lugn gradient
  - `MealRhythmBlock` — checkmarks för dagens måltider
  - `MealStructureBlock` — sammanfattning av mönster
  - `RegularityGridBlock` — 30d heatmap
  - `BehaviorGoalsBlock` — checkbara milestones
  - `SymptomPatternBlock` — enkel mönstervisning
  - `WeeklyCheckinBlock` — 7d sammanfattning
  - `FollowUpBlock` — nästa samtal + fokus
- Varje block har badge: 🟢 "Från journal" / 🔵 "Din dietist" / ✨ "AI-förslag"

## Datakoppling (exakt)

| Block | Tabell | Logik |
|---|---|---|
| Måltidsrytm idag | `nutrition_entries` WHERE entry_date = today | Gruppera meal_type |
| Struktur 7d | `nutrition_entries` WHERE entry_date >= 7d ago | Count per dag, klassificera |
| Regelbundenhet 30d | `nutrition_entries` WHERE entry_date >= 30d ago | Dagar med ≥3 entries |
| Symptommönster | `symptom_entries` WHERE entry_date >= 14d ago | Gruppera efter tid/meal_id |
| Beteendemål | `treatment_milestones` via aktiv plan | Visa som checkbara kort |
| Nästa samtal | `appointments` WHERE date > now, status = booked | Närmaste |
| Fokus | `treatment_plans` → aktiv plan title/description | Manuellt satt |

## Designprinciper

- Lugna, varma färger (primary/5, primary/10)
- Inga siffror för kalorier/makros/vikt
- Kort, stödjande text
- Checkmarks och enkla statusikoner
- Varje block ≤100px högt
- Tydlig badge per block: "Från din journal" vs "Din dietist"

## Ingen databasmigration behövs
All data finns redan i befintliga tabeller.

