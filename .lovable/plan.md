# EatSuite - Planer

## ✅ Symptomspårning i journalen (FÄRDIG)

Implementerad symptomloggning med:
- Databastabell `symptom_entries` med RLS-policies
- ElevenLabs Speech-to-Text för röstinmatning
- AddSymptomSheet och EditSymptomSheet komponenter
- SymptomCard för visning i tidslinjen
- Symptom kan kopplas till måltider eller registreras fristående
- Integrerad i MealTimeline med kronologisk visning

### Filer skapade:
- `supabase/functions/elevenlabs-scribe-token/index.ts`
- `src/components/journal/AddSymptomSheet.tsx`
- `src/components/journal/EditSymptomSheet.tsx`
- `src/components/journal/SymptomCard.tsx`

### Filer uppdaterade:
- `src/hooks/useJournalData.ts` - SymptomEntry typ och CRUD
- `src/components/journal/MealTimeline.tsx` - Visa symptom
- `src/pages/Journal.tsx` - Ny knapp och sheets
