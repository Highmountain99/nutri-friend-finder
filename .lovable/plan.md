

# Blockbyggare & blockrensning

## Sammanfattning

Förbättra blockbyggarens UX med sticky förhandsvisning, rensa upp duplicerade systemblock, och förbättra logiken i flera individuella block.

## Ändringar

### 1. Sticky förhandsvisning i BlockBuilderSheet

Gör förhandsvisningen fast i toppen av sheeten så den syns medan man scrollar genom inställningarna. Lösning: flytta preview ut ur scroll-containern och ge den en fast position i toppen, medan resten av formuläret scrollar under.

### 2. Rensa duplicerade systemblock i `systemBlockTemplates.ts`

Ta bort dubbletter och slå ihop:

| Behåll | Ta bort (duplikat) |
|--------|-------------------|
| `behavior_goals` ("Beteendemål") | `ed_behavior_goals` (samma funktion) |
| `symptom_patterns` ("Symptommönster") | `gh_symptom_count` ("Symptomöversikt"), `ed_symptom_patterns` |
| `next_appointment` ("Nästa samtal") | `ed_follow_up` |
| `meal_rhythm_today` ("Måltidsrytm idag") | `ed_meal_rhythm` |
| `wl_weekly` → byt namn till "Loggade dagar" | `ed_weekly_checkin` ("Veckoöversikt") |

### 3. Ta bort "(14d)", "(7d)", "(30d)" från blocktitlar

Rensa alla parenteser med tidsperioder ur titlarna i `systemBlockTemplates.ts`. Tidsperioden framgår i själva blocket.

### 4. Vikttrend — justerbar tidsperiod

Lägg till `period_days`-inställning i vikttrendsblocket (7, 14, 30, "all") som en enkel segmented-control/select i BlockPreview och i BlockBuilderSheet. Blocket behöver inte dupliceras — en enda instans med valbar period.

### 5. Viktvärden — kopplat till vikttrend

Visa nuvarande vikt och förändring sedan start. Gör blocket klickbart i patientvyn så det togglar mellan siffror och graf (viktvärden ↔ vikttrendgraf). I preview: visa "Nuvarande" och "Sedan start".

### 6. Beteendemål — visa delmål för aktuell fas

Ändra så blocket hämtar milstolpar (`treatment_milestones`) för det mål som har status "in_progress" (aktuell fas). Översätt delmålen till veckliga, handlingsbara uppgifter. T.ex. "Introducera källor till lösliga fibrer" → "Ät fibrer 3 gånger denna veckan". Koppla till journalens data för progress-check.

Uppdatera BlockPreview med exempeldata som reflekterar detta.

### 7. Dagens fokus — uppmuntrande AI-genererad text

Ändra från att visa `plan_description` rakt av till att generera en kort uppmuntrande text baserad på behandlingsplanen. Implementera via en liten edge function eller inline-prompt som tar planens beskrivning och returnerar en motiverande mening.

### 8. Veckoöversikt → "Loggade dagar"

Byt namn på alla weekly-overview-block till "Loggade dagar".

## Tekniska detaljer

**Filer som ändras:**
- `src/components/dietitian/blocks/BlockBuilderSheet.tsx` — sticky preview-layout
- `src/lib/systemBlockTemplates.ts` — rensa dubbletter, ta bort tidsperioder ur titlar, byta namn
- `src/components/dietitian/blocks/BlockPreview.tsx` — uppdatera viktvärden-preview, beteendemål-preview, fokustext, period-selector
- `src/components/progress/shared/DynamicBlock.tsx` — klickbar vikt-toggle i patientvyn
- `src/hooks/usePatientBlocks.ts` — uppdatera beteendemål-logik för aktuell fas
- Eventuellt ny edge function för AI-genererad fokustext

**Databas-migration:** Rensa seedade dubbletter (delete by `system_key`) — befintliga patientkopplingar behöver mappas om.

