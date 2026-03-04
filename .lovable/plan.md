

## Plan: Lägg till för- och efternamn i registreringsflödet och visa det för dietisten

### Översikt
Skapa en `profiles`-tabell som lagrar patientens för- och efternamn. Samla in namnen vid registrering (OnboardingModal). Uppdatera alla dietist-vyer som idag visar `Patient {id.slice(0,8)}` till att istället visa det riktiga namnet.

### Steg

**1. Skapa `profiles`-tabell (databasmigration)**
- Kolumner: `id` (uuid PK), `user_id` (uuid, FK till auth.users, ON DELETE CASCADE, UNIQUE), `first_name` text, `last_name` text, `created_at`, `updated_at`
- RLS: användare kan läsa/uppdatera sin egen profil; dietister kan läsa tilldelade patienters profiler (via `is_assigned_dietist`)
- Trigger: auto-skapa profil vid signup (tom, fylls i av appen)

**2. Uppdatera signUp-flödet**
- `AuthContext.signUp` tar emot `firstName` och `lastName` och sparar dem i `user_metadata` via Supabase auth, samt insertar en rad i `profiles`
- `OnboardingModal` (Page 3): lägg till fält för "Förnamn" och "Efternamn" ovanför e-post

**3. Uppdatera `useAssignedPatients` hook**
- Hämta `profiles` för alla patient-ID:n och inkludera `first_name`/`last_name` i `PatientSummary`

**4. Ersätt `Patient {id.slice(0,8)}` med riktigt namn**
- Filer som behöver ändras:
  - `DietitianPatients.tsx` (2 ställen)
  - `DietitianMessages.tsx` (1 ställe)
  - `DietitianDashboard.tsx` (1 ställe)
  - `DietitianRecipes.tsx` (1 ställe)
- Format: `{firstName} {lastName}`, fallback till `Patient {id.slice(0,8)}` om namn saknas

### Tekniska detaljer

```sql
-- Migration: profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users read/update own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Dietitians read assigned patients
CREATE POLICY "Dietitians can view assigned patient profiles" ON public.profiles FOR SELECT USING (is_assigned_dietist(user_id));
```

Berörda filer: `OnboardingModal.tsx`, `AuthContext.tsx`, `useAssignedPatients.ts`, `DietitianPatients.tsx`, `DietitianMessages.tsx`, `DietitianDashboard.tsx`, `DietitianRecipes.tsx`.

