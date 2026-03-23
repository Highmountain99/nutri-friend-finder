

# Plan: Block Builder med datakoppling

## Sammanfattning

Bygga ett komplett blockbibliotek-system där dietister kan skapa, spara och återanvända behandlingsblock med datakoppling till journaldata, kostlogg, symptom och behandlingsmål. Blocken integreras i den befintliga `ConfigureProgressSheet` och renderas dynamiskt i patientens utvecklingsvy.

## Databas

**Ny tabell: `block_templates`**

| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | uuid PK | |
| dietitian_id | uuid | Skaparen |
| title | text | Blocktitel |
| description | text | Kort beskrivning |
| icon | text | Lucide-ikonnamn |
| block_type | text | action / insight / progress / test / reflection / follow_up |
| category | text | ibs / diabetes / eating_disorder / heart_health / womens_health / pregnancy / weight_loss / general |
| data_source | text | none / journal / meal_log / meal_times / symptom_log / macro_data / treatment_goals / progression / combined |
| data_config | jsonb | Logikdefinition: vilka fält, tröskelvärden, regler |
| display_config | jsonb | Visuell config: layout, färger, tomlägestext |
| is_shared | boolean | Synligt för andra dietister |
| usage_count | int | Hur ofta blocket används |
| created_at / updated_at | timestamptz | |

**RLS**: Dietist ser egna + shared block. CRUD på egna.

**Ny tabell: `patient_blocks`** (kopplar block till patient)

| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | uuid PK | |
| patient_id | uuid | |
| block_template_id | uuid FK | |
| dietitian_id | uuid | |
| sort_order | int | Ordning i patientens vy |
| is_active | boolean | Synligt för patient |
| override_title | text | Anpassad titel per patient |
| manual_content | text | Manuellt satt text (för ej datadrivna block) |
| created_at | timestamptz | |

**RLS**: Dietist hanterar tilldelade patienter. Patient ser egna aktiva block.

## Arkitektur

```text
DietitianSidebar
  └── "Blockbibliotek" (ny menyrad) → /dietitian/blocks

/dietitian/blocks (ny sida)
  ├── Filter/sökning (blocktyp, kategori, datakälla)
  ├── Lista av block_templates (kort)
  └── "Skapa block" → BlockBuilderSheet

BlockBuilderSheet (Sheet)
  ├── Grundinfo: titel, beskrivning, ikon, kategori, blocktyp
  ├── Datakoppling:
  │    ├── Datakälla (dropdown)
  │    ├── Logik-regler (formulärbaserade)
  │    └── Tomlägestext
  └── Live preview (hur blocket ser ut med exempeldata)

ConfigureProgressSheet (befintlig, utökas)
  └── "Lägg till block från biblioteket" → öppnar picker
       └── Väljer block → skapar patient_blocks-rad

Patientens Progress-vy
  └── ProgressRouter renderar patient_blocks + befintliga sektioner
       └── DynamicBlock-komponent: hämtar data, applicerar logik, renderar
```

## Datakoppling — logikmotor

`data_config` i JSON definierar regler dietisten sätter via formulär:

```json
{
  "source": "meal_log",
  "metric": "meals_per_day",
  "period_days": 1,
  "rules": [
    { "condition": "gte", "value": 3, "label": "Bra struktur idag" },
    { "condition": "lt", "value": 3, "label": "Saknar måltider" }
  ],
  "show_items": ["breakfast", "lunch", "dinner", "snack"],
  "empty_text": "Inga måltider loggade ännu"
}
```

Möjliga metrics:
- `meals_per_day` — antal nutrition_entries idag/period
- `meal_rhythm` — vilka meal_types som loggats
- `regularity_30d` — dagar med 3+ måltider
- `symptom_count` — antal symptom_entries per tidsperiod
- `symptom_by_time` — symptom grupperade efter tid
- `macro_value` — specifikt makrovärde (protein, etc)
- `milestone_progress` — andel avklarade milestones
- `custom_text` — manuell text, ingen data

## Nya filer

### Databas
1. **Migration**: Skapa `block_templates` + `patient_blocks` tabeller med RLS

### Frontend (~8 filer)
2. **`src/pages/dietitian/DietitianBlocks.tsx`** — Bibliotekssida med filter, sökning, lista
3. **`src/components/dietitian/blocks/BlockBuilderSheet.tsx`** — Skapa/redigera block
4. **`src/components/dietitian/blocks/BlockCard.tsx`** — Kort i biblioteket
5. **`src/components/dietitian/blocks/BlockDataConfig.tsx`** — Datakopplingsformulär
6. **`src/components/dietitian/blocks/BlockPreview.tsx`** — Live preview
7. **`src/components/dietitian/blocks/BlockPickerSheet.tsx`** — Välj block att lägga till patient
8. **`src/hooks/dietitian/useBlockTemplates.ts`** — CRUD hook
9. **`src/hooks/usePatientBlocks.ts`** — Hämta + beräkna blockdata för patient
10. **`src/components/progress/shared/DynamicBlock.tsx`** — Renderar ett block med data

### Ändringar i befintliga filer
- **`DietitianSidebar.tsx`** — Lägg till "Blockbibliotek" i menyn
- **`App.tsx`** — Ny route `/dietitian/blocks`
- **`ConfigureProgressSheet.tsx`** — Lägg till "Lägg till block från biblioteket"-knapp
- **`ProgressRouter.tsx`** — Rendera `patient_blocks` utöver befintliga sektioner

## Logik-formuläret (BlockDataConfig)

Dietisten konfigurerar via dropdowns/toggles:
1. **Datakälla** — dropdown: Kostlogg, Symptomlogg, Behandlingsmål, etc.
2. **Vad ska visas** — dropdown per källa (t.ex. "Måltidsrytm", "Antal per dag", "Makrovärde")
3. **Tidsperiod** — dropdown: Idag, 7 dagar, 30 dagar
4. **Regler** — max 3 "om X då visa Y"-regler via formulärfält
5. **Tomlägestext** — vad som visas utan data

## DynamicBlock rendering

`usePatientBlocks` hook:
- Hämtar `patient_blocks` med JOIN till `block_templates`
- Per block: kör query baserat på `data_source` + `data_config`
- Returnerar beräknad data + vilken regel som matchar

`DynamicBlock` komponent:
- Tar beräknad data + template
- Renderar kort med ikon, titel, SourceBadge (journal/dietist/ai)
- Visar data med checkmarks, progress bars, siffror beroende på blocktyp
- Visar tomläge om data saknas

## Designprinciper

- Samma visuella stil som befintliga ED-block (lugnt, rent, kort)
- Tydlig SourceBadge per block
- Alla block valfria och redigerbara av dietist
- Blockbiblioteket följer samma filter-UI som recept
- Block Builder är formulärbaserad, ingen kod behövs

## Uppskattad storlek

- 2 nya tabeller + RLS
- ~10 nya filer
- ~2000-3000 rader kod
- Inga nya edge functions (all logik client-side)

