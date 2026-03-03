

# Dietistens Dashboard -- Fullständig ombyggnad

## Nuläge

Det finns redan en grundläggande dietist-dashboard med sidebar, patientlista, schema, meddelanden, recept och profil. Befintliga databastabeller inkluderar `dietitian_profiles`, `appointments`, `dietist_patient_assignments`, `intake_profiles`, `chat_messages`, m.fl. Dessa ska återanvändas -- inte dupliceras.

## Vad som behöver byggas

Arbetet delas upp i **6 implementeringssteg** som byggs sekventiellt:

---

### Steg 1: Nya databastabeller + seed-data

Tre nya tabeller behövs (de andra finns redan):

- **`dietitian_journal_entries`** -- journalanteckningar (patient_id, dietitian_id, appointment_id nullable, anamnesis, assessment, action, next_steps, created_at, updated_at)
- **`dietitian_notes`** -- snabbanteckningar per patient (patient_id, dietitian_id, content, created_at, updated_at)
- **`patient_documents`** -- uppladdade filer (patient_id, uploaded_by, file_name, file_url, file_type, created_at)

RLS-policyer: dietist kan CRUD egna journalanteckningar/anteckningar för tilldelade patienter. Patienter kan läsa sina egna journalanteckningar (read-only). Dokument kräver en storage bucket `patient-documents`.

Seed-data via edge function eller insert-verktyget: 1 dietist "Sofia Ekström", 8 patienter med intake_profiles, bokningar, journalanteckningar.

---

### Steg 2: Kollapserbar sidebar med avatar

Ersätt nuvarande `DietitianSidebar` med Shadcn `Sidebar`-komponenten:
- Ikoner: LayoutDashboard, Users, CalendarDays, MessageSquare, BarChart3, Settings
- Kollapserbar (icon-mode)
- Längst ner: dietistens avatar, namn, titel, utloggning
- Hämta profildata via `useDietitianProfile`

Uppdatera `DietitianLayout` att använda `SidebarProvider`.

---

### Steg 3: Förbättrad översikt (dashboard)

Ny `DietitianDashboard`:
- Hälsning med namn + datum
- 4 statistikkort: Patienter idag, Aktiva totalt, Nästa besök, Beläggningsgrad
- "Dagens schema" -- tidslinje med bokningskort (tid, patientnamn, besökstyp-badge, fokusområde, "Starta videosamtal"-knapp med tidsvillkor, "Visa profil")
- "Kräver uppmärksamhet" -- patienter utan journal, missade besök, flaggade symptom

---

### Steg 4: Patientlista + Patientprofil

**Patientlista:** Tabell/kort-toggle, sökfält, filter (fokusområde, status). Kolumner: Namn, Fokusområde, Status, Nästa besök, Antal besök, Senaste kontakt.

**Patientprofil (tvåkolumn-layout):**

Vänster (65%):
- Flik "Översikt": Kvalificeringsdata (från intake_profiles), pågående behandling, snabbanteckningar
- Flik "Journal": Kronologisk lista med journalanteckningar, formulär för ny anteckning (SOAP-format)
- Flik "Besök": Alla bokningar med status
- Flik "Dokument": Drag-and-drop uppladdning, fillista

Höger (35%):
- Snabbinfo-kort (ålder, kön, registreringsdatum)
- Kommande besök med countdown
- Aktivitetslogg (senaste händelser)

---

### Steg 5: Kalender

Veckokalender-vy med dag-toggle. Visar tillgängliga tider och bokade besök. Färgkodning (nybesök grön, uppföljning blå, ledig ljusgrå). Sidebar "Dagens lista". Klick på bokning öppnar patient-snabbvy.

---

### Steg 6: Statistik-sida

Ny route `/dietitian/statistics`. KPI-kort (totala patienter, aktiva, behandlingstid, beläggningsgrad, förbättringsgrad). Grafer med Recharts: bokningar/vecka (stapel), patienttillväxt (linje), fokusområdesfördelning (cirkel).

---

## Databasmigreringar

```sql
-- dietitian_journal_entries
CREATE TABLE public.dietitian_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  dietitian_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id),
  anamnesis text,
  assessment text,
  action text,
  next_steps text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.dietitian_journal_entries ENABLE ROW LEVEL SECURITY;

-- dietitian_notes (quick scratchpad)
CREATE TABLE public.dietitian_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  dietitian_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.dietitian_notes ENABLE ROW LEVEL SECURITY;

-- patient_documents
CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-documents', 'patient-documents', false);
```

Plus RLS policies for each table using `is_assigned_dietist()`.

## Nya filer

- `src/pages/dietitian/DietitianStatistics.tsx`
- `src/components/dietitian/DietitianSidebar.tsx` (omskriven)
- `src/components/dietitian/DietitianLayout.tsx` (uppdaterad)
- `src/components/dietitian/PatientProfileSidebar.tsx`
- `src/components/dietitian/JournalEntryForm.tsx`
- `src/components/dietitian/DocumentUpload.tsx`
- `src/components/dietitian/WeekCalendar.tsx`
- `src/components/dietitian/VideoCallModal.tsx`
- `src/hooks/dietitian/useJournalEntries.ts`
- `src/hooks/dietitian/useDietitianNotes.ts`
- `src/hooks/dietitian/usePatientDocuments.ts`

Befintliga filer som skrivs om:
- `DietitianDashboard.tsx`
- `DietitianPatients.tsx`
- `DietitianPatientDetail.tsx`
- `DietitianSchedule.tsx`
- `App.tsx` (ny route för statistics)

## Anmärkning

Videosamtal implementeras som placeholder-modal. All text på svenska. Recharts används för statistikgrafer. Sidebar använder Shadcn Sidebar-komponenten med `collapsible="icon"`.

