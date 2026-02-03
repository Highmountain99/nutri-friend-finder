

## Förenkling av Qualifying-flödet (IMPLEMENTERAT)

### Genomförda ändringar

| Nuvarande | Ändring | Status |
|-----------|---------|--------|
| Steg 3 (Screening) | **Borttagen** | ✅ |
| "Jag vill träffa en dietist oavsett" | **Borttagen** | ✅ |
| Gravid-frågan | **Flyttad** till ProblemStep som checkbox | ✅ |
| Medicinerfrågan | **Flyttad** till ProblemStep som checkbox | ✅ |
| Steg 5 (TagsStep) | **Borttagen** | ✅ |

---

### Nytt flöde (9 steg)

```text
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
1. ☐ Jag är gravid eller har nyligen varit gravid
2. ☐ Jag tar mediciner som kan påverka kosten

**Logik:**
- Om gravid kryssas i → visa gravidtriage-substeget efter submit
- Medicin-info sparas för triage-beräkning → rekommenderar dietist
- Kategorival är valfritt (kan hoppa över)

---

### Triage-logik

Utan `wantsDietist`, baseras triage på:
1. **Mediciner som påverkar kost** → dietist (rekommendation)
2. **Graviditet med komplikation** → dietist
3. **Vald kategori** (diabetes, ätstörning, hjärthälsa, tarmhälsa) → dietist
4. **Wellness-kategorier** → coach
5. **Inget val** → coach (default)
