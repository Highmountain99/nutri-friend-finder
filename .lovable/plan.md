

## Uppdatera sidomeny med 1177-länk och betalningsmetoder

### Sammanfattning
Lägga till en extern länk "1177 - Journal" under Hälsoprofil-sektionen, samt en ny kategori "Betalningsmetod" med tre knappar som navigerar till nya sidor (Frikort, Koder, SEB försäkring).

---

### Del 1: Uppdatera SideMenu.tsx

**Ändringar i sidomenykomponenten:**

1. **Lägg till nya ikoner** - Importera `ExternalLink`, `CreditCard`, `KeyRound`, `Shield` från lucide-react

2. **Lägg till "1177 - Journal" knapp** - Placera den direkt efter "Hälsoprofil" i Konto-sektionen
   - Öppnar extern länk i ny flik
   - Använder `window.open()` istället för React Router

3. **Lägg till ny sektion "Betalningsmetod"** - Längst ner innan logout-knappen
   - Frikort (navigerar till /frikort)
   - Koder (navigerar till /koder)  
   - SEB försäkring (navigerar till /seb-forsakring)

---

### Del 2: Skapa nya sidor

Skapa tre nya sidor baserat på designinspirationerna:

**Frikort.tsx** (`/frikort`)
- Kort med frikortsnummer och utgångsdatum
- Accordion-sektioner: "Vad innebär frikort?" och "Hur vet jag om jag har frikort?"
- "Redigera"-knapp i botten

**Koder.tsx** (`/koder`)
- Formulär för att ange kod från arbetsgivare/försäkring
- Länk till privat erbjudande
- "Spara"-knapp

**SEBForsakring.tsx** (`/seb-forsakring`)
- Illustration/bild högst upp
- Information om SEB + EatSuite samarbete
- Input för skadenummer/försäkringsnummer
- Info-dialog för hjälp

---

### Del 3: Uppdatera routing

**App.tsx:**
- Importera de tre nya sidorna
- Lägg till routes under AppLayout:
  - `/frikort`
  - `/koder`
  - `/seb-forsakring`

---

### Tekniska detaljer

**Ny menystruktur i SideMenu.tsx:**
```text
Navigering
  - Hem
  - Journal
  - Meddelanden
  - Recept
  - Utveckling
──────────────
Konto
  - Hälsoprofil
  - 1177 - Journal → [extern länk]
  - Inställningar
  - Hjälp & Support
──────────────
Betalningsmetod
  - Frikort
  - Koder
  - SEB försäkring
──────────────
[Logga ut]
```

**Extern länk för 1177:**
```
https://m07-mg-local.idp.funktionstjanster.se/samlv2/idp/sign_in/781
```

---

### Filer som skapas/ändras

| Fil | Åtgärd |
|-----|--------|
| `src/components/layout/SideMenu.tsx` | Uppdatera med nya menyalternativ |
| `src/pages/Frikort.tsx` | Skapa ny sida |
| `src/pages/Koder.tsx` | Skapa ny sida |
| `src/pages/SEBForsakring.tsx` | Skapa ny sida |
| `src/App.tsx` | Lägg till nya routes |

