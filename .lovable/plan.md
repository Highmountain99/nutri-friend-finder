

## Förbättringar av Qualifying-flödet

### Problem som åtgärdas

| Steg | Problem | Lösning |
|------|---------|---------|
| 3 (Screening) | För ledande - man behöver inte ha diagnos för att träffa dietist | Omformulera till informationsinsamling, inte gate-keeping. Alla ska kunna välja dietist oavsett svar |
| 4 (Problem) | Endast coach-alternativ visas, måste välja något | Lägg till "Annat/vet inte" + möjlighet att hoppa över |
| 5 (Tags) | Känns irrelevant, borde vara i annat steg | Ta bort som separat steg - integrera i problemsteget eller gör helt valfritt |
| 9 (Stödområden) | Dietist-fokuserad, borde ha skip-alternativ | Gör valfritt med "Hoppa över"-knapp |
| Resultat | Om coach: borde kunna byta till dietist | Lägg till "Tror du att du behöver träffa en dietist?" |

---

### Ny flödeslogik

```text
NUVARANDE LOGIK:
Röda flaggor → Dietist-spår
Inga röda flaggor → Coach-spår (låst)

NY LOGIK:
Screening samlar information men låser INTE användaren
Användaren kan ALLTID välja dietist via "Jag vill träffa en dietist"
Triagen blir en REKOMMENDATION, inte ett tvång
```

---

### Ändringar per steg

**Steg 3 - Screening (ScreeningStep.tsx)**
- Ändra rubrik från "Innan vi matchar dig" till "Berätta lite om din situation"
- Ta bort "gate-keeping"-logiken - samla bara information
- Lägg till alternativ: "Jag vill prata med en dietist oavsett"
- Alla svar leder vidare till samma flöde (unified problem step)

**Steg 4 - Problem (ProblemStep.tsx)**
- Slå ihop dietist- och coach-kategorier till EN lista
- Lägg till "Annat / vet inte än" som alltid går att välja
- Gör det möjligt att gå vidare utan att välja något ("Hoppa över")
- Ta bort kravet på underkategori

**Steg 5 - Tags**
- Ta bort som separat steg helt
- Flytta relevant data till problemsteget (valfritt multi-select i slutet)
- Alternativt: behåll men gör tydligt valfritt med "Hoppa över"

**Steg 9 - Stödområden (SupportAreasStep.tsx)**
- Lägg till "Hoppa över"-knapp
- Ändra texten så den passar både dietist och coach
- Gör det tydligt att det är valfritt

**Sammanfattning (SummaryStep.tsx)**
- Om coach-resultat: lägg till prominent knapp "Tror du att du behöver träffa en dietist? Börja om"
- Vid klick: återställ triage och gå till steg 3

---

### Uppdaterade filer

| Fil | Ändring |
|-----|---------|
| `ScreeningStep.tsx` | Ny rubrik, lägg till "vill ha dietist oavsett"-alternativ, ta bort routing-logik |
| `ProblemStep.tsx` | Unified kategorilista, "Annat"-alternativ, optional skip |
| `CoachProblemStep.tsx` | Ta bort (slå ihop med ProblemStep) |
| `TagsStep.tsx` | Gör valfritt eller ta bort helt |
| `SupportAreasStep.tsx` | Lägg till skip-knapp, neutral text |
| `SummaryStep.tsx` | Lägg till "Tror du att du behöver dietist?"-knapp för coach-resultat |
| `QualifyingFlow.tsx` | Uppdatera steg-logik, ta bort isCoachPath-lock, lägg till restart-funktion |
| `triageEngine.ts` | Ändra till rekommendationsbaserad logik istället för tvång |
| `types/intake.ts` | Lägg till unified kategorier |
| `screeningQuestions.ts` | Lägg till "vill ha dietist oavsett"-alternativ |

---

### Ny kategorilista (unified)

**Sammanslagna kategorier för alla användare:**
- Gå ner i vikt
- Bygga muskler / gå upp i vikt
- Hälsosamma vanor & struktur
- Träning, prestation & återhämtning
- Energi, fokus & mättnad
- Vegetariskt/veganskt eller balanserad kost
- Tarmhälsa (IBS, mage, etc.)
- Diabetes eller blodsockerhantering
- Hjärthälsa
- Kvinnohälsa (PCOS, fertilitet, klimakteriet)
- Ätstörning eller svår relation till mat
- Annat / vet inte än

---

### Nytt ScreeningStep-beteende

**Nya alternativ:**
1. Jag har en medicinsk diagnos som kan påverka kosten
2. Jag är gravid eller nyligen gravid
3. Jag har symptom som oroar mig (viktnedgång, magproblem)
4. Jag har eller misstänker en ätstörning
5. Jag tar mediciner som kan påverka kosten
6. **Jag vill träffa en dietist oavsett**
7. Inget av ovanstående / osäker

**Logik:**
- Alternativ 1-5: Sparas som info, påverkar rekommendation
- Alternativ 6: Sätter triageResult = 'dietist' direkt
- Alternativ 7: Neutral, fortsätt till problemval
- ALLA går till samma nästa steg (unified problem)

---

### Nytt SummaryStep med "byt till dietist"

**Om triageResult === 'coach':**
```text
┌────────────────────────────────────────────────┐
│  Din kostrådgivare väntar                      │
│  [Befintligt innehåll...]                      │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ Tror du att du är i behov av att träffa  │  │
│  │ en dietist? Vi kan ha tagit fel.         │  │
│  │                                           │  │
│  │ [Börja om med dietist-spår]              │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

---

### Implementationsordning

1. Uppdatera `screeningQuestions.ts` med nya alternativ
2. Uppdatera `types/intake.ts` med unified kategorier
3. Uppdatera `ScreeningStep.tsx` - ny logik och alternativ
4. Slå ihop `ProblemStep.tsx` och `CoachProblemStep.tsx`
5. Gör `TagsStep.tsx` valfritt eller ta bort
6. Uppdatera `SupportAreasStep.tsx` med skip-knapp
7. Uppdatera `SummaryStep.tsx` med "byt till dietist"-knapp
8. Uppdatera `QualifyingFlow.tsx` med ny flödeslogik
9. Uppdatera `triageEngine.ts` till rekommendationsbaserad

---

### UX-principer

- Användaren ska ALDRIG känna sig låst i ett spår
- Screening samlar info, bestämmer INTE
- Triagen är en hjälpsam rekommendation
- "Vet inte" och "Hoppa över" är alltid OK
- Möjlighet att ändra sig finns alltid

