

## Triagesystem: Dietist eller Kostrådgivare

### Sammanfattning

Implementera ett intelligent triagesystem som avgör om användaren ska matchas med en dietist (primärvård, 0 kr) eller en kostrådgivare (marknadspris) baserat på deras svar under qualifying-flödet.

---

### Flödesarkitektur

```text
Nuvarande flöde (9 steg):
┌─────────────────────────────────────────────────────────────┐
│ 0. AI Input → 1. Vårdtagare → 2. Problem → 3. Recensioner   │
│ → 4. Aktivitet → 5. Motivation → 6. Stödområden             │
│ → 7. Sammanfattning → 8. Bokning                            │
└─────────────────────────────────────────────────────────────┘

Nytt flöde (11 steg):
┌─────────────────────────────────────────────────────────────┐
│ 0. AI Input                                                 │
│ 1. Vårdtagare                                               │
│ 2. SCREENING (NY) ← Röda flaggor                            │
│    ↓                                                        │
│    [Om gravid] → 2b. GRAVIDTRIAGE (NY)                      │
│    ↓                                                        │
│ 3. Problem/Behov (uppdaterad med coach-alternativ)          │
│ 4. Underkategori (dynamisk)                                 │
│ 5. Taggar/Preferenser (NY multi-select)                     │
│ 6. Aktivitet                                                │
│ 7. Motivation                                               │
│ 8. Stödområden                                              │
│ 9. Sammanfattning (visar triage-resultat)                   │
│ 10. Bokning (anpassad text beroende på dietist/coach)       │
└─────────────────────────────────────────────────────────────┘
```

---

### Datamodell - Nya fält i intake_profiles

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| `has_medical_diagnosis` | boolean | Medicinsk diagnos som påverkar kost |
| `is_pregnant` | text (enum) | 'pregnant', 'postpartum', 'no', 'unsure' |
| `pregnancy_triage_reason` | text | Om gravid: anledning till besök |
| `pregnancy_referred_by_care` | boolean | Om gravid: hänvisad av vården? |
| `has_red_flag_symptoms` | boolean | Röda flaggor (viktminskning, blod etc) |
| `red_flag_symptoms` | text[] | Vilka röda flaggor |
| `has_eating_disorder_risk` | boolean | Misstänkt ätstörningsrisk |
| `has_medication_risk` | boolean | Mediciner som påverkar kost |
| `triage_result` | text (enum) | 'dietist', 'coach', 'pending' |
| `triage_reason_code` | text | Anledningskod för triage |
| `provider_category` | text (enum) | 'medical', 'wellness' |

---

### Screeningsteg (ScreeningStep.tsx)

**Rubrik:** "Innan vi matchar dig - gäller något av detta?"

**Frågor (kryssrutor):**
1. Jag har fått en medicinsk diagnos som påverkar kosten (t.ex. diabetes, celiaki, IBD, hjärt-kärlsjukdom)
2. Jag är gravid eller har nyligen varit gravid
3. Jag har ofrivillig viktminskning eller kraftiga magsymtom
4. Jag har eller misstänker en ätstörning
5. Jag tar mediciner där kosten kan påverka behandling (osäker → dietist)
6. Inget av ovanstående

**Routing-logik:**
- Om #1, #3, #4, #5 → `triage_result = 'dietist'`
- Om #2 → Visa GravidTriageStep
- Om #6 → Fortsätt till problemval (coach-flöde öppet)

---

### Gravidtriage (PregnancyTriageStep.tsx)

**Steg 1 - Rubrik:** "Vad vill du ha hjälp med under graviditeten?"

**Alternativ (radioknappar):**
1. Allmän kostplanering (näring, måltidsstruktur, tips)
2. Illamående/cravings/mataversioner (utan komplikation)
3. Viktuppgång som oroar mig (utan diagnos)
4. Jag har fått graviditetsdiabetes eller är under utredning
5. Jag har diabetes typ 1 eller typ 2
6. Jag har näringsbrist (t.ex. järnbrist) eller misstänker brist
7. Jag har andra medicinska komplikationer
8. Osäker / vill att vården bedömer

**Routing:**
- #4-8 → `triage_result = 'dietist'`
- #1-3 → Visa "Har vården bett dig kontakta dietist?"

**Steg 2 (om #1-3):**
- Ja → `dietist`
- Nej → `coach`
- Osäker → `dietist`

---

### Uppdaterat Problemsteg (ProblemStep.tsx)

Två "spår" baserat på screeningresultat:

**Dietist-spår (nuvarande kategorier):**
- Diabetes eller fördiabetes
- Tarmhälsa (IBD, Crohns, UC, SIBO)
- Hjärthälsa
- Ätstörning
- Kvinnohälsa (PCOS med medicinsk behandling)
- Övrigt medicinskt

**Coach-spår (NYA kategorier):**
- Gå ner i vikt (utan diagnos)
- Bygga muskler / gå upp i vikt
- Hälsosamma vanor & struktur
- Träning, prestation & återhämtning
- Energi, fokus & mättnad
- Vegetariskt/veganskt eller balanserad kost
- Känsloätande & cravings (utan ätstörning)
- Matplanering: matlådor, budget, tid
- Mat i sociala situationer
- Kosttillskott (generell vägledning)

---

### Routing-engine (triageEngine.ts)

Prioriterad regelordning:

```text
1. MEDICINSK DIAGNOS
   → main_choice i dietist-spår → DIETIST

2. RÖDA FLAGGOR
   → ofrivillig viktminskning, blod i avföring, svår buksmärta,
     kräkningar, sväljsvårigheter, långvarig diarré → DIETIST

3. ÄTSTÖRNINGSRISK
   → bulimi, anorexi, kompenserar, självframkallade kräkningar,
     extrem restriktion → DIETIST

4. GRAVIDITET MED KOMPLIKATION
   → GDM, diabetes, näringsbrist, medicinska komplikationer → DIETIST

5. OSÄKER/OTILLRÄCKLIG DATA
   → main_choice är null eller "Annat" utan beskrivning → DIETIST

6. MILD TARM (SOFT RULE)
   → IBS-liknande, milt/ibland, kort duration → COACH
   → Pågår >4 veckor eller påverkar mycket → DIETIST

7. HETSÄTNING (SOFT RULE)
   → "Ibland tappar kontrollen" → COACH
   → Flera gånger/vecka eller kompensation → DIETIST

8. DEFAULT
   → Ingen flagga triggered → COACH
```

---

### Nya typer (types/intake.ts tillägg)

```typescript
export type TriageResult = 'dietist' | 'coach' | 'pending';

export type ProviderCategory = 'medical' | 'wellness';

export type PregnancyStatus = 'pregnant' | 'postpartum' | 'no' | 'unsure';

export type PregnancyTriageReason = 
  | 'general_planning'
  | 'nausea_cravings'
  | 'weight_concern'
  | 'gdm_risk_or_dx'
  | 'diabetes'
  | 'nutrient_deficiency'
  | 'medical_complication'
  | 'unsure';

export type TriageReasonCode =
  | 'DIAGNOSIS_SELECTED'
  | 'RED_FLAG_SYMPTOM'
  | 'EATING_DISORDER'
  | 'PREGNANCY_MEDICAL'
  | 'PREGNANCY_REFERRED_OR_UNSURE'
  | 'PREGNANCY_GENERAL'
  | 'UNCERTAIN'
  | 'GI_PERSISTENT'
  | 'SAFE_COACH';

// Coach-specifika huvudkategorier
export type CoachConcernCategory =
  | 'weight_loss_general'
  | 'muscle_building'
  | 'healthy_habits'
  | 'training_nutrition'
  | 'energy_focus'
  | 'plant_based'
  | 'emotional_eating_mild'
  | 'meal_planning'
  | 'social_eating'
  | 'supplements';
```

---

### Taggar/Preferenser (TagsStep.tsx)

Multi-select grupperade efter kategori:

**Mål:**
- Gå ner i vikt
- Bygga muskler
- Äta mer regelbundet
- Få mer energi
- Minska sötsug/snacks
- Bli bättre på matplanering

**Vardag & begränsningar:**
- Oregelbundna tider (skift/resa)
- Jobbar mycket, lite tid
- Budgetvänliga upplägg
- Äter ofta ute
- Enkla standardmåltider

**Preferenser:**
- Vegetarisk
- Vegansk
- Mycket protein
- Minska socker
- Mer fiber/grönsaker
- Undvika kaloriräkning

**Beteenden:**
- Kvällsätande
- Småätande på jobbet
- Sug/cravings
- Stressätande
- "Allt eller inget"-tänk

**Träning:**
- Tränar 1-2 ggr/vecka
- Tränar 3-5 ggr/vecka
- Styrketräning
- Kondition/löpning
- Pre-/post-workout strategi

---

### Filstruktur

```text
src/
├── types/
│   └── intake.ts                     (utökas med triage-typer)
│
├── lib/
│   └── triageEngine.ts               (NY - routing-logik)
│
├── components/qualifying/
│   ├── ScreeningStep.tsx             (NY)
│   ├── PregnancyTriageStep.tsx       (NY)
│   ├── ProblemStep.tsx               (uppdateras med coach-spår)
│   ├── SubcategoryStep.tsx           (NY - dynamiska underkategorier)
│   ├── TagsStep.tsx                  (NY - multi-select preferenser)
│   ├── QualifyingFlow.tsx            (uppdateras med nya steg)
│   └── TriageResultCard.tsx          (NY - visar resultat i sammanfattning)
│
├── hooks/
│   └── useIntakeProfile.ts           (utökas med nya fält)
│
└── data/
    ├── screeningQuestions.ts         (NY - screening-frågor)
    ├── coachCategories.ts            (NY - coach-kategorier)
    └── triageRules.ts                (NY - regeldata)
```

---

### Databasändringar

**Nya kolumner i intake_profiles:**
```sql
ALTER TABLE intake_profiles ADD COLUMN IF NOT EXISTS 
  pregnancy_status TEXT DEFAULT NULL;
ALTER TABLE intake_profiles ADD COLUMN IF NOT EXISTS 
  pregnancy_triage_reason TEXT DEFAULT NULL;
ALTER TABLE intake_profiles ADD COLUMN IF NOT EXISTS 
  pregnancy_referred_by_care BOOLEAN DEFAULT NULL;
ALTER TABLE intake_profiles ADD COLUMN IF NOT EXISTS 
  red_flag_symptoms TEXT[] DEFAULT '{}';
ALTER TABLE intake_profiles ADD COLUMN IF NOT EXISTS 
  triage_result TEXT DEFAULT 'pending';
ALTER TABLE intake_profiles ADD COLUMN IF NOT EXISTS 
  triage_reason_code TEXT DEFAULT NULL;
ALTER TABLE intake_profiles ADD COLUMN IF NOT EXISTS 
  provider_category TEXT DEFAULT NULL;
```

---

### Implementationsordning

1. **Databas:** Lägg till nya kolumner i intake_profiles
2. **Typer:** Uppdatera types/intake.ts med nya typer
3. **Engine:** Skapa triageEngine.ts med routing-logik
4. **Data:** Skapa datafiler för frågor och kategorier
5. **Komponenter:**
   - ScreeningStep.tsx
   - PregnancyTriageStep.tsx
   - Uppdatera ProblemStep.tsx
   - SubcategoryStep.tsx
   - TagsStep.tsx
   - TriageResultCard.tsx
6. **Uppdatera QualifyingFlow.tsx** med nya steg och routing
7. **Uppdatera useIntakeProfile.ts** för att hantera nya fält
8. **Uppdatera SummaryStep** för att visa triage-resultat
9. **Uppdatera BookingStep** med anpassad text

---

### Användarupplevelse

**Om användaren matchas med DIETIST:**
- Sammanfattning visar: "Du kommer att träffa en legitimerad dietist"
- Text: "Ditt behov täcks av primärvården. Kostnad: 0 kr (frikort gäller)"
- Bokning: "Boka tid med dietist"

**Om användaren matchas med COACH:**
- Sammanfattning visar: "Du kommer att träffa en kostrådgivare"
- Text: "Pris från 100 kr/samtal. Kan betalas med friskvårdsbidrag."
- Bokning: "Boka tid med kostrådgivare"

---

### Tekniska överväganden

**Säkerhet:**
- All routing-logik körs på frontend initialt
- Slutligt triage-resultat valideras vid bokning (edge function)
- Röda flaggor loggas för uppföljning

**Felhantering:**
- Om triagen inte kan avgöras → default till dietist (säkrare)
- Om användaren hoppar över screening → visa varning

**UX:**
- Användare med röda flaggor ser inte coach-alternativ alls
- Tydlig förklaring varför de matchas med dietist/coach
- Möjlighet att "överklaga" till dietist om man vill

