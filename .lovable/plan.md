

# Plan: Dietist-dashboard

## Sammanfattning

Bygga en separat dietist-dashboard med sidebar-navigation, åtkomlig via rollbaserad routing. Dashboarden ger dietister verktyg för att hantera patienter, schema, recept och chatt.

## Arkitektur

```text
/dietitian              → Dashboard (översikt)
/dietitian/patients     → Patientlista
/dietitian/patients/:id → Patientdetalj (journal, progress, mål)
/dietitian/schedule     → Schema & tillgänglighet
/dietitian/recipes      → Egna recept + föreslå till patient
/dietitian/messages     → Chatt med patienter
/dietitian/profile      → Redigera egen profil
```

Alla `/dietitian/*`-routes skyddas av en `DietitianRoute`-komponent som verifierar att användaren har rollen `dietist` via `user_roles`-tabellen.

## Layout

Sidebar-baserad layout (desktop-first) med `SidebarProvider` + `Sidebar`. Navigeringspunkter: Översikt, Patienter, Schema, Recept, Meddelanden, Min profil.

## Steg

### 1. Rollverifiering & routing
- Skapa `DietitianRoute`-komponent som kollar `user_roles` för `admin`/`moderator`-roll (eller skapa en ny `dietitian`-roll om önskat)
- Skapa `DietitianLayout` med sidebar-navigation
- Lägg till routes i `App.tsx`

### 2. Patient-monitorering
- **Patientlista**: Hämta tilldelade patienter via `dietist_patient_assignments`
- **Patientdetalj**: Visa journal (nutrition_entries, symptom_entries), hälsomätare (health_tracking_entries), näringsmål (user_nutrition_goals) -- all data redan läsbar via befintliga RLS-policyer (`is_assigned_dietist`)
- **Anpassa Utveckling-tab**: Dietisten kan välja vilka metriktyper som visas för patienten (nytt fält i assignments-tabellen eller separat config-tabell)

### 3. Schema-hantering
- Kalendervy för att se bokade tider (appointments med `dietitian_id`)
- Formulär för att lägga till/ta bort tillgänglighet (dietitian_availability)
- Behöver DB-migration: RLS-policy för att dietister ska kunna läsa sina egna appointments via `dietitian_id`

### 4. Recepthantering
- CRUD för recept (dietister behöver INSERT/UPDATE-behörighet på `recipes`)
- "Föreslå till patient"-funktion: Skapa `user_recipe_interaction` med `source: 'dietitian'` (redan stödd av befintlig RLS-policy)
- DB-migration: Lägg till INSERT/UPDATE-policyer för dietister på `recipes`

### 5. Chatt-integration
- Lista alla patienter med öppna konversationer
- Visa chatthistorik per patient (redan stödd via RLS)
- Dietisten kan skriva meddelanden med `sender: 'dietitian'` (redan stödd via RLS)
- Realtids-prenumeration på nya meddelanden

### 6. Profilredigering
- Redigera bio, specialiseringar, språk, avatar
- Redan stödd av `Dietitians can update own profile`-policyn

### 7. Databasändringar

**Migration:**
```sql
-- Dietister ska kunna läsa sina bokningar via dietitian_id
CREATE POLICY "Dietitians can view own bookings"
ON public.appointments FOR SELECT
USING (dietitian_id IN (
  SELECT id FROM dietitian_profiles WHERE user_id = auth.uid()
));

-- Dietister ska kunna skapa recept
CREATE POLICY "Dietitians can insert recipes"
ON public.recipes FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM dietitian_profiles WHERE user_id = auth.uid()
  )
);

-- Dietister ska kunna uppdatera egna recept (behöver created_by-fält)
ALTER TABLE public.recipes ADD COLUMN created_by uuid;

CREATE POLICY "Dietitians can update own recipes"
ON public.recipes FOR UPDATE
USING (created_by = auth.uid());

-- Config för vilka progress-metriker patienten ser
CREATE TABLE public.patient_progress_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  dietitian_id uuid NOT NULL,
  visible_metrics text[] DEFAULT '{}',
  concern_category_override text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(patient_id)
);

ALTER TABLE public.patient_progress_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can manage assigned patient config"
ON public.patient_progress_config FOR ALL
USING (is_assigned_dietist(patient_id));

CREATE POLICY "Patients can view own config"
ON public.patient_progress_config FOR SELECT
USING (auth.uid() = patient_id);
```

### 8. Nya filer

**Sidor:**
- `src/pages/dietitian/DietitianDashboard.tsx`
- `src/pages/dietitian/DietitianPatients.tsx`
- `src/pages/dietitian/DietitianPatientDetail.tsx`
- `src/pages/dietitian/DietitianSchedule.tsx`
- `src/pages/dietitian/DietitianRecipes.tsx`
- `src/pages/dietitian/DietitianMessages.tsx`
- `src/pages/dietitian/DietitianProfile.tsx`

**Layout & routing:**
- `src/components/dietitian/DietitianLayout.tsx` (sidebar)
- `src/components/dietitian/DietitianRoute.tsx` (rollcheck)
- `src/components/dietitian/DietitianSidebar.tsx`

**Hooks:**
- `src/hooks/dietitian/useAssignedPatients.ts`
- `src/hooks/dietitian/usePatientJournal.ts`
- `src/hooks/dietitian/useDietitianSchedule.ts`
- `src/hooks/dietitian/useDietitianChat.ts`

## Implementation order

1. DB-migrationer + rollverifiering
2. Layout + routing-skelett
3. Patientlista + patientdetalj (journal + progress)
4. Schema-hantering
5. Recepthantering + "föreslå till patient"
6. Chatt-integration
7. Progress-konfiguration
8. Profilredigering

