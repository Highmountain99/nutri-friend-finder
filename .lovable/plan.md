

# Plan: Kliniskt journalföringssystem för dietister

## Sammanfattning

Bygga ett komplett stegvist journalföringssystem med 7 behandlingsområden, strukturerad datainsamling via chips/radio/sliders, auto-genererad journaltext och AI-beslutsstöd. Systemet integreras i dietistens patientvy som en ny flik/åtgärd.

## Arkitektur

```text
DietitianPatientDetail
  └── "Journal" tab → ny knapp "Nytt besök"
        └── ClinicalNoteWizard (fullscreen/sheet)
              ├── AreaSelector (välj behandlingsområde)
              ├── StepWizard (steg 1–N beroende på område)
              │    └── Varje steg = formulärkomponent med chips/radio/sliders
              ├── SummaryStep (auto-genererad journal + AI-förslag)
              └── Spara → dietitian_journal_entries
```

## Nya filer

### Frontend-komponenter (~15 filer)

1. **`src/components/dietitian/clinical-notes/ClinicalNoteWizard.tsx`**
   - Huvudcontainer. Sheet/fullscreen. Hanterar state för valt område och alla formulärdata.
   - Top bar: titel, "Generera journal", "Generera AI-förslag", "Spara"
   - Stegnavigering (progress bar + framåt/bakåt)

2. **`src/components/dietitian/clinical-notes/AreaSelector.tsx`**
   - Välj behandlingsområde: Hjärthälsa, IBS, Diabetes, Kvinnohälsa, Ätstörning, Graviditet, Viktminskning
   - Varje område har ikon och kort beskrivning

3. **`src/components/dietitian/clinical-notes/shared/ChipSelect.tsx`**
   - Återanvändbar multi-select chips-komponent

4. **`src/components/dietitian/clinical-notes/shared/RadioField.tsx`**
   - Återanvändbar radio-grupp med label

5. **`src/components/dietitian/clinical-notes/shared/SliderField.tsx`**
   - Slider 1–10 med label och värdevisning

6. **`src/components/dietitian/clinical-notes/shared/NumericField.tsx`**
   - Numeriskt input-fält med enhet

7. **Ett konfigurationsobjekt per område** (`areaConfigs/`):
   - `heartHealth.ts` — steg, fält, options för Hjärthälsa
   - `ibs.ts` — IBS/magbesvär
   - `diabetes.ts` — Diabetes/blodsocker
   - `womensHealth.ts` — Kvinnohälsa (PCOS/fertilitet/klimakteriet)
   - `eatingDisorder.ts` — Ätstörning/relation till mat
   - `pregnancy.ts` — Graviditet & postpartum
   - `weightLoss.ts` — Viktminskning

   Varje config exporterar: `{ id, title, steps: [{ title, fields: [...] }] }` plus en `generateJournalText(data)` funktion som skapar anamnes/bedömning/åtgärd/nästa steg.

8. **`src/components/dietitian/clinical-notes/StepRenderer.tsx`**
   - Tar en step-config och renderar fälten dynamiskt med rätt komponent (chips, radio, slider, numeric, dropdown)

9. **`src/components/dietitian/clinical-notes/SummaryStep.tsx`**
   - Visar auto-genererad journaltext i redigerbara textfält
   - Visar AI-förslag (fokusområden, åtgärder, uppföljning) i kort
   - Allt redigerbart innan sparning

10. **`src/components/dietitian/clinical-notes/JournalPreview.tsx`**
    - Renderar den färdiga journalen (Anamnes/Bedömning/Åtgärd/Nästa steg) som redigerbara textareas

### Backend (1 ny Edge Function)

11. **`supabase/functions/clinical-note-ai/index.ts`**
    - Tar emot behandlingsområde + alla formulärdata
    - Anropar Lovable AI Gateway med area-specifik prompt
    - Returnerar strukturerad JSON: `{ summary, focusAreas[], actions[], followUp }`
    - Använder tool calling för strukturerad output
    - Hanterar 429/402

### Hook

12. **`src/hooks/dietitian/useClinicalNoteAI.ts`**
    - Mutation som anropar `clinical-note-ai` edge function
    - Returnerar AI-förslag

## Dataflöde

1. Dietist öppnar patientvy → Journal-tab → klickar "Nytt besök"
2. Väljer behandlingsområde (t.ex. "Hjärthälsa")
3. Klickar igenom 5–8 steg med chips/radio/sliders (alla valfria)
4. Klickar "Generera journal" → lokal funktion skapar journaltext från formulärdata
5. Klickar "Generera AI-förslag" → edge function returnerar fokusområden + åtgärder
6. Redigerar text vid behov → klickar "Spara" → sparas i `dietitian_journal_entries`

## Databasändring

Inga nya tabeller behövs. Använder befintlig `dietitian_journal_entries` (anamnes, assessment, action, next_steps). Formulärdata kan sparas som JSON i en ny kolumn om det behövs för framtida analys:

- **Migration**: Lägg till `form_data jsonb DEFAULT NULL` och `area_type text DEFAULT NULL` på `dietitian_journal_entries`

## Integration i befintlig UI

- I `DietitianPatientDetail.tsx`, Journal-tabben: lägg till knapp "Nytt besök" som öppnar `ClinicalNoteWizard` som en Sheet
- Routing: ingen ny route behövs, wizarden öppnas som overlay

## Dynamiska fält per område

Varje config-fil definierar steg med fält i ett deklarativt format:

```typescript
{
  id: 'heart_health',
  title: 'Hjärthälsa',
  steps: [
    {
      title: 'Remiss',
      fields: [
        { type: 'chips', key: 'referral_reasons', label: 'Vad gäller besöket?',
          options: ['Hyperlipidemi', 'Hypertoni', 'Diabetes', 'Sekundärprevention', 'Annat'],
          multi: true },
        { type: 'radio', key: 'has_lab_values', label: 'Finns labvärden?',
          options: ['Ja', 'Delvis', 'Nej'] },
        { type: 'numeric', key: 'ldl', label: 'LDL', unit: 'mmol/L',
          showIf: (data) => ['Ja','Delvis'].includes(data.has_lab_values) },
        // ...
      ]
    },
    // ...fler steg
  ]
}
```

## AI-prompt logik

Edge function bygger area-specifik prompt med alla regler (max 3 fokusområden, max 5 åtgärder, inga extrema dieter, etc.) och returnerar strukturerad output via tool calling.

## Designriktlinjer

- Minimalistisk, clean, medicinsk känsla
- Lugna färger (speciellt för ätstörning)
- Alla fält valfria — framåtknapp alltid aktiv
- Progress bar överst
- Snabb att använda under videobesök
- Responsiv men optimerad för desktop (dietistens arbetsyta)

## Uppskattad storlek

- ~15 nya filer
- ~2500–3500 rader kod totalt
- 1 edge function
- 1 databasmigration

