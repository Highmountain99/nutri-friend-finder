
# Plan: Journal Kalender som Tidsarkiv med Streak-funktion

## Översikt
Bygg ut kalendern i Journal-vyn till ett komplett tidsarkiv där användare kan navigera bakåt i tiden för att se loggade måltider och näringsvärden. Lägg till en riktig streak-räknare som visar antal dagar i rad man loggat måltider.

## Nuvarande tillstånd
- **WeekDaySelector.tsx**: Visar endast en vecka åt gången (7 dagar)
- **Journal.tsx**: Har en statisk streak-placeholder som alltid visar "🔥 1-dagarsstreak!"
- **useJournalData.ts**: Laddar data för vald dag men beräknar inte streak
- **nutrition_entries tabell**: Har `entry_date` kolumn som kan användas för streak-beräkning

## Planerade förändringar

### 1. Ny kalenderkomponent med helårsnavigering
**Fil:** `src/components/journal/JournalCalendar.tsx` (ny)

Skapa en ny kalenderkomponent som:
- Visar aktuell vecka med horisontell scroll
- Har en klickbar datumvisning som öppnar en full kalender-popover
- Tillåter navigering bakåt till 1 januari 2025 (eller start av användarens loggning)
- Markerar dagar med loggade måltider visuellt
- Använder `react-day-picker` via befintliga `Calendar`-komponenten
- Begränsar framtida datum (kan inte välja datum efter idag)

**Visuell design:**
```text
[< veckopilar >]  [M] [T] [O] [T] [F] [L] [S]
                   27  28  29  30  31   1   2

      Tryck på datumet för kalender-popup:
           "28 januari 2025" (klickbar)
                  ↓
      +---------------------------+
      |    ← Januari 2025 →       |
      | M  T  O  T  F  L  S       |
      |          1  2  3  4       |
      | 5  6  7  8  9 10 11       |
      | ... (markerade loggedagar) |
      +---------------------------+
```

### 2. Uppdatera WeekDaySelector för bättre UX
**Fil:** `src/components/journal/WeekDaySelector.tsx`

- Lägg till veckopilnavigering (föregående/nästa vecka)
- Markera dagar med loggade måltider med en liten prick
- Integrera med kalender-popup via callback

### 3. Lägg till streak-beräkning
**Fil:** `src/hooks/useJournalData.ts`

Ny funktion för att beräkna streak:
```text
1. Hämta alla unika entry_date för användaren
2. Starta från igår och räkna bakåt
3. Öka streak för varje konsekutiv dag med loggningar
4. Returnera streak-antal
```

Exposa `streak` och `daysWithEntries` från hooken.

### 4. Visa streak endast vid loggning
**Fil:** `src/pages/Journal.tsx`

- Ta bort den statiska streak-placeholdern
- Visa streak-emoji endast om `streak > 0`
- Visa dynamisk text baserat på streak-antal:
  - 1 dag: "🔥 1-dagarsstreak!"
  - 2-6 dagar: "🔥 X-dagarsstreak!"
  - 7+ dagar: "🔥🔥 X-dagarsstreak!" (dubbel emoji)
  - 30+ dagar: "🔥🔥🔥 X-dagarsstreak!" (trippel emoji)

### 5. Markera dagar med loggningar i kalendern
**Fil:** `src/components/journal/JournalCalendar.tsx`

- Hämta lista över alla dagar med loggade måltider
- Visa en liten prick under datum som har loggningar
- Olika färg för dagar med få vs många loggningar (valfritt)

---

## Tekniska detaljer

### Streak-beräkningslogik
```text
function calculateStreak(datesWithEntries: string[]): number {
  // Sortera datum i fallande ordning
  // Starta från igår (eller idag om det finns loggning idag)
  // Räkna konsekutiva dagar bakåt
  // Returnera antal
}
```

### Kalenderbegränsningar
```text
fromDate: new Date(2025, 0, 1)  // 1 januari 2025
toDate: new Date()              // Idag (ingen framtida val)
```

### Databasfråga för dagar med loggningar
```sql
SELECT DISTINCT entry_date 
FROM nutrition_entries 
WHERE user_id = $1 
ORDER BY entry_date DESC;
```

---

## Filer att skapa/ändra

| Fil | Åtgärd |
|-----|--------|
| `src/components/journal/JournalCalendar.tsx` | Skapa ny komponent med kalender-popup |
| `src/components/journal/WeekDaySelector.tsx` | Uppdatera med veckopilnavigering |
| `src/hooks/useJournalData.ts` | Lägg till streak-beräkning och daysWithEntries |
| `src/pages/Journal.tsx` | Ersätt WeekDaySelector med JournalCalendar, dynamisk streak |

---

## Stegordning för implementation

1. **useJournalData**: Lägg till hämtning av alla entry_dates och streak-beräkning
2. **JournalCalendar**: Skapa ny komponent med:
   - Horisontell veckovisning
   - Kalender-popover för helårsnavigering
   - Markering av loggade dagar
3. **Journal.tsx**: 
   - Ersätt WeekDaySelector med JournalCalendar
   - Visa dynamisk streak baserat på faktiska data
   - Göm streak om ingen loggning finns
4. **Rensa**: Ta bort eller behåll WeekDaySelector beroende på om den återanvänds

---

## Design/UX-detaljer

### Veckovisning
- Behåll nuvarande cirkulära dagsknappar
- Lägg till små pilar för att byta vecka
- Dagar med loggningar får en liten grön prick

### Kalender-popup
- Öppnas när användaren trycker på datumet under veckodagarna
- Visar full månadsvy med react-day-picker
- Tillbaka till januari 2025
- Markerar dagar med loggningar
- Stängs automatiskt vid val av datum

### Streak-display
- Visas endast om minst 1 dag loggats i rad
- Placeras under veckoväljaren
- Animeras in mjukt när en streak finns
