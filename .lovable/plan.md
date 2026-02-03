
## Val av dietist/kostrådgivare

### Översikt

Bygger ett nytt bokningsflöde där användaren kan välja sin dietist/kostrådgivare. Baserat på de uppladdade referensbilderna skapas ett flöde med:

1. **Startsidan** - "Hitta din dietist/kostrådgivare" med två alternativ
2. **Rekommendationsväg** - Kalender först, sedan 5 matchade dietister
3. **Alla-väg** - Lista med alla dietister och filtreringsmöjligheter

---

### Flödesdiagram

```text
┌─────────────────────────────────────────────────┐
│          Hitta din dietist                      │
│  ┌────────────────────────────────────────────┐ │
│  │       [Hjälp mig välja]                    │ │
│  │  → Välj datum → 5 matchade dietister       │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │    [Visa alla dietister]                   │ │
│  │  → Lista med filter → Välj dietist → Boka │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

### Databasändringar

#### Ny tabell: `dietitian_profiles`

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | PK |
| user_id | uuid | FK till auth.users (dietist-användare) |
| first_name | text | Förnamn |
| last_name | text | Efternamn |
| title | text | "Legitimerad dietist" / "Kostrådgivare" |
| bio | text | Kort beskrivning |
| avatar_url | text | Profilbild |
| specializations | text[] | ["diabetes", "eating_disorder", "gut_health", etc.] |
| languages | text[] | ["svenska", "engelska", etc.] |
| is_available | boolean | Om dietisten tar nya patienter |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### Ny tabell: `dietitian_availability`

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | PK |
| dietitian_id | uuid | FK till dietitian_profiles |
| available_date | date | Datum |
| time_slots | jsonb | Array av lediga tider [{hour: 9, minute: 0, booked: false}] |
| created_at | timestamptz | |

#### RLS-policyer
- Alla användare kan läsa `dietitian_profiles` (public read)
- Alla användare kan läsa `dietitian_availability` (public read)
- Dietister kan uppdatera sin egen profil och tillgänglighet

---

### Nya komponenter

```text
src/components/booking/
├── DietitianSelectionStep.tsx     # Huvudsteg: "Hjälp mig välja" / "Visa alla"
├── DietitianCalendarStep.tsx      # Kalendervy för datumval (rekommendation)
├── DietitianRecommendations.tsx   # Svajpbar lista med 5 rekommenderade
├── DietitianCard.tsx              # Kort för dietist (stor version, svajpbar)
├── DietitianListItem.tsx          # Rad för dietist (liten version, lista)
├── DietitianList.tsx              # Lista med alla dietister + filter
├── DietitianFilters.tsx           # Filterchips (symptom, datum, språk)
├── DietitianDetailSheet.tsx       # Bottom sheet med dietist-detaljer
├── TimeSlotPicker.tsx             # Välj tid för vald dietist
└── BookingConfirmation.tsx        # Bekräftelseskärm
```

---

### Nya hooks

```text
src/hooks/
├── useDietitians.ts           # Hämta alla dietister
├── useDietitianRecommendations.ts  # Matcha dietister mot användarens behov
└── useDietitianAvailability.ts     # Hämta lediga tider
```

---

### Bokningsflöde - Uppdaterat

#### Alternativ 1: "Hjälp mig välja"

1. Användaren klickar "Hjälp mig välja"
2. Visas kalender: "Vilken dag passar dig bäst?"
3. Väljer datum → klickar "Nästa"
4. Visas 5 rekommenderade dietister (svajpbara kort)
   - Baserat på användarens `unifiedConcernCategory`, `pregnancyStatus`, etc.
   - Tillgängliga på valt datum
5. Sista kortet: "Visa alla dietister"
6. Användare klickar på en dietist → Sheet med detaljer
7. Väljer tid → Bekräftar bokning

#### Alternativ 2: "Visa alla dietister"

1. Användaren klickar "Visa alla dietister"
2. Visas lista med alla dietister
3. Filter-chips överst:
   - Symptom/specialisering (från intake)
   - Datum (kalender-popup)
   - Talat språk
4. Klickar på dietist → Sheet med detaljer och lediga tider
5. Väljer tid → Bekräftar bokning

---

### UI-komponenter (Detaljer)

#### DietitianSelectionStep
- Header: "Hitta din dietist" med tillbaka-knapp
- Illustration (kan återanvändas eller placeholder)
- Rubrik: "Låt oss hitta din dietist!"
- Knapp 1: "Hjälp mig välja" (primary)
- Knapp 2: "Visa alla dietister" (outline)

#### DietitianCard (Rekommendationer)
- Stort foto (aspect-ratio 4:3)
- Namn
- Titel ("Legitimerad dietist")
- Nästa lediga tid-ikon
- Specialiseringar (matchande mot användarens behov)
- Språk
- Knapp: "Boka möte"
- Länk: "Visa lediga tider"
- Pagination-dots i botten

#### DietitianListItem (Alla)
- Avatar (cirkel, 60px)
- Namn
- "Nästa tid: imorgon kl. 12:00"
- "(+ 2 andra passande tider)"
- Chevron-ikon till höger

#### DietitianFilters
- Horisontell scroll med chips
- Aktiva filter: bakgrund + X-ikon
- Klicka → dropdown/sheet med alternativ

---

### BookingStep-integration

Uppdaterar `BookingStep.tsx` och `QualifyingFlow.tsx` för att använda det nya flödet:

1. `BookingStep` blir en wrapper som hanterar sub-stegen
2. Ny state: `bookingPhase`: 'selection' | 'calendar' | 'recommendations' | 'all' | 'detail' | 'confirm'
3. Vald dietist sparas i state och sedan i appointment

---

### Matchningslogik

```typescript
function matchDietitians(
  userProfile: IntakeFormData,
  dietitians: DietitianProfile[],
  selectedDate: Date
): DietitianProfile[] {
  // 1. Filtrera dietister som är tillgängliga på valt datum
  // 2. Ranka baserat på matchande specialiseringar:
  //    - unifiedConcernCategory → specializations
  //    - pregnancyStatus → "pregnancy" specialization
  //    - etc.
  // 3. Returnera topp 5
}
```

---

### Implementationsordning

1. **Databas**
   - Skapa `dietitian_profiles` tabell
   - Skapa `dietitian_availability` tabell
   - Lägg till RLS-policyer
   - Seed med testdata (5 dietister)

2. **Hooks**
   - `useDietitians.ts`
   - `useDietitianAvailability.ts`
   - `useDietitianRecommendations.ts`

3. **Komponenter**
   - `DietitianCard.tsx`
   - `DietitianListItem.tsx`
   - `DietitianFilters.tsx`
   - `DietitianDetailSheet.tsx`
   - `TimeSlotPicker.tsx`
   - `DietitianSelectionStep.tsx`
   - `DietitianCalendarStep.tsx`
   - `DietitianRecommendations.tsx`
   - `DietitianList.tsx`
   - `BookingConfirmation.tsx`

4. **Integration**
   - Uppdatera `BookingStep.tsx` med nytt flöde
   - Uppdatera `useAppointments.ts` för att inkludera dietitian_id

---

### Tekniska detaljer

- Svajpbara kort implementeras med `embla-carousel-react` (redan installerat)
- Filter-dropdowns använder samma Portal-strategi som receptfiltren
- Bottom sheets använder befintlig `Sheet`-komponent
- Kalender återanvänder `Calendar`-komponenten med samma styling
- Avatarer använder `Avatar`-komponenten från shadcn

