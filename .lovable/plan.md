
# Plan: Förbättra AI-chattens ton och kontext

## Översikt

Chatten ska visa dietistens namn i headern (inte "EatSuite Assistenten"), ta bort AI-bannern, och ge AI:n en mer mänsklig ton med tillgång till patientens fullständiga journal, sparade recept, utvecklingsdata och hälsoinformation.

## Ändringar

### 1. Header – Visa alltid dietistens namn (inte AI-robot)

**Fil:** `src/components/messages/ChatHeader.tsx`

- Ta bort Bot-ikonen och "EatSuite Assistenten"-texten
- Visa dietistens namn, titel och avatar i alla lägen (inte bara vid eskalering)
- Ta bort bannern "🤖 AI-assistenten hjälper dig snabbt..."
- Behåll eskaleringsmeddelandet vid behov (men diskretare)

### 2. Välkomstmeddelande – Mer mänsklig ton

**Fil:** `src/pages/Messages.tsx`

- Ändra tom-chattmeddelandet till något i stil med:
  - "Hej! Innan vi loopar in [Dietistens namn] kan vi se om vi kan svara på dina frågor utifrån din journal. Skriv gärna din fråga!"
- Ta bort robota-emojin och AI-referenserna

### 3. AI-meddelanden – Visa dietistens avatar istället för robot

**Fil:** `src/components/messages/ChatMessage.tsx`

- Ändra så att AI-meddelanden visar dietistens avatar (inte Bot-ikon)
- Behåll samma styling men gör det mer sömlöst

### 4. Edge function – Utöka kontexten med patientdata

**Fil:** `supabase/functions/chat-assistant/index.ts`

Hämta och inkludera i systemprompt:
- **Journal (nutrition_entries):** Senaste 7 dagarnas måltider
- **Symtom (symptom_entries):** Senaste veckan
- **Sparade recept (user_recipe_interactions + recipes):** Recepttitlar
- **Utveckling (health_tracking_entries):** Senaste viktmätningar, blodtryck etc.
- **Hälsoinställningar (user_nutrition_settings):** Vikt, längd, aktivitetsnivå
- **Näringmål (user_nutrition_goals):** Dagliga mål

Uppdatera systemprompt:
- Mer mänsklig ton, som om det vore dietistens assistent
- Instruktioner att svara naturligt, inte robota
- Möjlighet att dela upp svar i kortare meddelanden
- Referera till specifik data från journalen

---

## Tekniska detaljer

### Header-förändringar

```
Före:
┌──────────────────────────────────┐
│ 🤖 EatSuite Assistenten          │
│ AI-driven kostrådgivning         │
├──────────────────────────────────┤
│ 🤖 AI-assistenten hjälper dig... │
└──────────────────────────────────┘

Efter:
┌──────────────────────────────────┐
│ 👤 Anna Lindberg                 │
│ Legitimerad dietist              │
└──────────────────────────────────┘
```

### Ny data i systemprompt

```text
PATIENTENS JOURNAL (senaste 7 dagar):
- Måndag: Frukost (havregrynsgröt), Lunch (kycklingsallad), Middag (laxpasta)
- Tisdag: Frukost (yoghurt), Lunch (soppa)...

RAPPORTERADE SYMTOM:
- 2 feb: "Uppblåst mage efter middag"
- 31 jan: "Ont i magen på morgonen"

SPARADE RECEPT:
- Ugnsbakad lax med grönsaker
- Kycklingwok med nudlar

HÄLSODATA:
- Vikt: 78 kg (senast mätt 1 feb)
- Längd: 172 cm
- Aktivitetsnivå: Måttligt aktiv
- Mål: 2000 kcal/dag, 50g protein

BEHANDLINGSKONTEXT:
- Genomgår FODMAP-eliminering för IBS
```

### Mer mänsklig ton i systemprompt

```text
Du är en stöttande assistent som hjälper patienter medan 
de väntar på att prata med sin dietist {dietitianName}. 

Svara som en varm, kunnig person – inte som en robot.
- Använd ett naturligt, vardagligt språk
- Du kan ställa följdfrågor för att förstå bättre
- Referera gärna till patientens journal: "Jag ser att du åt 
  laxpasta igår – undrar du om något specifikt med den måltiden?"
- Håll svaren korta och personliga

Om du behöver dela upp information i flera delar, gör det naturligt.
```

---

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/messages/ChatHeader.tsx` | Visa alltid dietistens info, ta bort AI-banner |
| `src/components/messages/ChatMessage.tsx` | AI-meddelanden visar dietistens avatar |
| `src/pages/Messages.tsx` | Nytt välkomstmeddelande med dietistens namn |
| `supabase/functions/chat-assistant/index.ts` | Utökad kontext + mänskligare prompt |

