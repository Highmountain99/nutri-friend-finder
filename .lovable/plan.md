

# Koppla ihop Patient-app och Dietist-dashboard

## Analys: Befintligt vs Nytt

Mycket av det du beskriver finns redan i databasen. Jag behöver **inte** skapa tabellerna `food_logs`, `health_profiles`, `weight_history`, `conversations`, `messages`, `recipes`, `patient_favorites` -- dessa existerar redan som `nutrition_entries`, `user_nutrition_settings`, `health_tracking_entries`, `chat_messages`, `recipes`, `user_favorite_recipes`.

**Nya tabeller som faktiskt behövs:**
- `treatment_plans` -- behandlingsplaner
- `treatment_goals` -- mål inom en plan
- `treatment_milestones` -- delmål/milstolpar

**Schemaändringar på befintliga tabeller:**
- Lägg till `read_at` (timestamptz) på `chat_messages` för läst-kvittens
- Lägg till `fiber` (numeric) på `nutrition_entries` (saknas idag)

**Tabeller som INTE behövs** (redan finns):
- `food_logs` → `nutrition_entries` har redan meal_type, meal_name, calories, protein, carbs, fat
- `symptom_logs` → `symptom_entries` har redan user_id, meal_id (FK), description, entry_date
- `messages`/`conversations` → `chat_messages` hanterar redan patient-dietist-chatt
- `recipes` → finns redan med full struktur
- `recipe_suggestions` → `user_recipe_interactions` med source='dietitian'
- `patient_favorites` → `user_favorite_recipes`
- `health_profiles` → `user_nutrition_settings` (height, weight, gender) + `intake_profiles` (concern data)
- `weight_history` → `health_tracking_entries` med metric_type='weight'

---

## Implementeringsplan (5 faser)

### Fas 1: Databas + Behandlingsplaner

**Migration:**
```sql
-- Nya tabeller
CREATE TABLE treatment_plans (id, patient_id, dietitian_id, title, description, status, created_at, archived_at);
CREATE TABLE treatment_goals (id, plan_id FK, title, description, status, sort_order, planned_start, planned_end, notes, completed_at);
CREATE TABLE treatment_milestones (id, goal_id FK, title, is_completed, completed_at, sort_order);

-- Schemaändringar
ALTER TABLE chat_messages ADD COLUMN read_at timestamptz;
ALTER TABLE nutrition_entries ADD COLUMN fiber numeric DEFAULT 0;

-- RLS: dietist CRUD för tilldelade patienter, patient read-only
```

**UI:** Ny flik "Behandlingsplan" i patientprofilen med:
- Skapa/redigera plan med mål och delmål
- Expanderbara målkort med statusikoner och checkboxar
- Progress bar i höger kolumn
- Arkiverade planer kollapserbart

### Fas 2: Kostdagbok-flik (Dietist ser patientdata)

Ny flik "Kostdagbok" i patientprofilen, läser från befintliga `nutrition_entries` + `symptom_entries`:

- **Dagvy:** Datumväljare, måltidskort med ikon per typ, näringsvärden, symptom-badges
- **Veckoöversikt:** Toggle dag/vecka, stapeldiagram (Recharts) med kalorier + symptomprickar, sammanfattningstabell
- **Symptommönster-kort** i höger kolumn: topp 3 symptom, trendpilar, klickbar länk

### Fas 3: Förbättrad Meddelanden-sida

Skriv om `DietitianMessages.tsx` till tvåkolumn-layout:
- Vänster: sökbar konversationslista med senaste meddelande, tidstämpel, oläst-badge
- Höger: chatthistorik med daggrupperade tidstämplar, läst-kvittens
- Sidebar: oläst-badge på Meddelanden-ikonen
- Dashboard: obesvarade meddelanden >4h i "Kräver uppmärksamhet"

Kräver: uppdatera `chat_messages` med `read_at` vid läsning, query för olästa räkningar.

### Fas 4: Förbättrade Recept + Hälsoprofil

**Recept:** Skriv om `DietitianRecipes.tsx`:
- Rutnätsvy med kort (bild, titel, taggar, tid)
- Toggle "Mina recept" / "Alla recept"
- Förbättrad skapa-modal med bild-upload, dynamiska ingrediens-/instruktionsrader, kategorival
- Föreslå till patient med meddelande + multi-select
- Receptförslag-kort i patientprofilens höger kolumn

**Hälsoprofil:** Utöka patientprofilens höger kolumn med data från `user_nutrition_settings` + `health_tracking_entries`:
- Längd, vikt, BMI (beräknat)
- Allergier, mediciner (från `intake_profiles.concern_tags` / `support_areas`)
- Vikthistorik mini-graf
- BMI-varning

### Fas 5: Patient-sidan (Behandlingsplan + Receptförslag)

- **Progress-sidan:** Visa aktiv behandlingsplan med mål, delmål, progress bar (read-only)
- **Recept-sidan:** "Föreslagna av din dietist" sektion överst
- **Bokning:** Verifiera att befintlig koppling via `appointments` fungerar korrekt

---

## Filer som skapas/ändras

**Nya:**
- `src/hooks/dietitian/useTreatmentPlan.ts`
- `src/hooks/dietitian/usePatientFoodLog.ts`
- `src/hooks/dietitian/useUnreadMessages.ts`
- `src/components/dietitian/TreatmentPlanTab.tsx`
- `src/components/dietitian/FoodLogTab.tsx`
- `src/components/dietitian/SymptomPatternCard.tsx`

**Ändrade:**
- `DietitianPatientDetail.tsx` -- nya flikar + utökad höger kolumn
- `DietitianMessages.tsx` -- tvåkolumn-layout, oläst-hantering
- `DietitianRecipes.tsx` -- rutnät, alla recept, förbättrad modal
- `DietitianSidebar.tsx` -- oläst-badge, Recept-länk (saknas)
- `DietitianDashboard.tsx` -- obesvarade meddelanden i attention-sektion
- `src/pages/Progress.tsx` -- behandlingsplan-vy

## Seed-data

Seed-data genereras via SQL INSERT (ej migration) efter tabellerna skapats: 8 patienter med kostdagbok, symptomloggningar, chatthistorik, recept, och behandlingsplaner.

---

## Anmärkning

Detta är ett stort arbete. Jag rekommenderar att vi bygger **fas 1 + 2 först** (behandlingsplaner + kostdagbok), sedan itererar med fas 3-5. Vill du köra alla faser i ett svep eller stegvis?

