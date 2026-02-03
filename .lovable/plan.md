

## Förenkling av Qualifying-flödet

### Ändringar som ska göras

| Nuvarande | Ändring |
|-----------|---------|
| Steg 3 (Screening) | **Ta bort helt** - gör ej gate-keeping |
| "Jag vill träffa en dietist oavsett" | **Ta bort** alternativet |
| Gravid-frågan | **Flytta** till ProblemStep som extra fråga |
| Medicinerfrågan | **Flytta** till ProblemStep som extra fråga |
| Steg 5 (TagsStep) | **Ta bort helt** |

---

### Nytt flöde

```text
NUVARANDE FLÖDE (11 steg):
0. AI Input
1. Vårdtagare
2. Screening ← TA BORT
   2b. Gravidtriage (sub-step)
3. Problem
4. Tags ← TA BORT
5. Reviews
6. Activity
7. Motivation
8. Support Areas
9. Summary
10. Booking

NYTT FLÖDE (9 steg):
0. AI Input
1. Vårdtagare
2. Problem (+ gravid/medicin-frågor överst)
   2b. Gravidtriage (sub-step om gravid)
3. Reviews
4. Activity
5. Motivation
6. Support Areas
7. Summary
8. Booking
```

---

### ProblemStep - ny struktur

**Överst i ProblemStep (före kategorilistan):**
1. Kryssruta: "Jag är gravid eller har nyligen varit gravid"
2. Kryssruta: "Jag tar mediciner som kan påverka kosten"

**Kategorilista (samma som nu):**
- Gå ner i vikt
- Bygga muskler / gå upp i vikt
- Hälsosamma vanor & struktur
- etc.
- Annat / vet inte än

**Logik:**
- Om gravid kryssas i → visa gravidtriage-substeget efter submit
- Medicin-info sparas för triage-beräkning
- Kategorival är valfritt (kan hoppa över)

---

### Filändringar

| Fil | Ändring |
|-----|---------|
| `QualifyingFlow.tsx` | Ta bort SCREENING och TAGS steg, uppdatera step indices (9 steg totalt), flytta pregnancy-check till ProblemStep |
| `ProblemStep.tsx` | Lägg till gravid- och medicinsfrågor överst, hantera showPregnancyTriage-logik |
| `ScreeningStep.tsx` | Kan tas bort helt eller behållas för framtida användning |
| `TagsStep.tsx` | Kan tas bort helt eller behållas för framtida användning |
| `screeningQuestions.ts` | Ta bort `wantDietistOption`, behåll bara pregnancy och medication info |
| `types/intake.ts` | Ta bort `wantsDietist` flag |
| `triageEngine.ts` | Ta bort logik för `wantsDietist` |

---

### Ny ProblemStep-layout

```text
┌──────────────────────────────────────────────────────┐
│  Vad kan vi hjälpa dig med?                          │
│  Välj det som bäst beskriver ditt primära fokus      │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │ ☐ Jag är gravid eller har nyligen varit gravid │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │ ☐ Jag tar mediciner som kan påverka kosten    │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  [Gå ner i vikt]                                     │
│  [Bygga muskler / gå upp i vikt]                     │
│  [Hälsosamma vanor & struktur]                       │
│  [Träning, prestation & återhämtning]               │
│  [Energi, fokus & mättnad]                           │
│  [Vegetariskt/veganskt eller balanserad kost]        │
│  [Tarmhälsa (IBS, mage, etc.)]                       │
│  [Diabetes eller blodsockerhantering]                │
│  [Hjärthälsa]                                        │
│  [Kvinnohälsa (PCOS, fertilitet, klimakteriet)]      │
│  [Ätstörning eller svår relation till mat]           │
│  [Annat / vet inte än]                               │
├──────────────────────────────────────────────────────┤
│                    [Hoppa över]                      │
│                    [Nästa →]                         │
└──────────────────────────────────────────────────────┘
```

---

### Step indices update

```typescript
const STEPS = {
  AI_INPUT: 0,
  CARE_SEEKER: 1,
  PROBLEM: 2,
  PREGNANCY_TRIAGE: 2.5, // Sub-step
  REVIEWS: 3,
  ACTIVITY: 4,
  MOTIVATION: 5,
  SUPPORT_AREAS: 6,
  SUMMARY: 7,
  BOOKING: 8,
} as const;

const TOTAL_STEPS = 9;
```

---

### Triage-logik (uppdaterad)

Utan `wantsDietist`, baseras triage på:
1. **Graviditet med komplikation** → dietist
2. **Mediciner som påverkar kost** → dietist (rekommendation)
3. **Vald kategori** (diabetes, ätstörning, hjärthälsa etc.) → dietist
4. **Wellness-kategorier** → coach
5. **Inget val** → rekommendation baserad på övrig data

---

### Implementationsordning

1. Uppdatera `types/intake.ts` - ta bort `wantsDietist`
2. Uppdatera `triageEngine.ts` - ta bort wantsDietist-logik
3. Uppdatera `ProblemStep.tsx` - lägg till gravid/medicin-frågor
4. Uppdatera `QualifyingFlow.tsx` - ta bort SCREENING och TAGS steg
5. Rensa upp oanvända komponenter och data

