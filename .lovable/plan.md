
# Integration av ICA:s Receptdatabas

## Översikt

ICA har **23 564 recept** i sin databas. Din app har redan en väl strukturerad `recipes`-tabell med 20 recept. Planen är att skapa ett automatiserat system som kan hämta, transformera och lagra ICA-recept i din databas.

## Juridiska Överväganden (Viktigt!)

Innan vi implementerar detta måste du överväga:

1. **Upphovsrätt**: ICA:s recept kan vara upphovsrättsskyddade
2. **Användarvillkor**: ICA:s webbplats kan ha restriktioner mot scraping
3. **Rekommendation**: Kontakta ICA för att undersöka om det finns ett officiellt API eller partneravtal

Om du får tillstånd eller beslutar att gå vidare, här är den tekniska planen:

---

## Teknisk Arkitektur

```text
┌─────────────────────────────────────────────────────────┐
│                    Admin Dashboard                       │
│         (Starta import, visa progress, statistik)       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Edge Function: recipe-import               │
│                                                         │
│  1. Firecrawl MAP → Hämta alla recept-URLer            │
│  2. Firecrawl SCRAPE → Hämta receptdetaljer            │
│  3. AI PARSE → Strukturera data                         │
│  4. INSERT → Spara till recipes-tabell                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   Lovable Cloud DB                      │
│                     recipes-tabell                       │
└─────────────────────────────────────────────────────────┘
```

---

## Steg 1: Anslut Firecrawl

Firecrawl är ett verktyg för att scrapa webbsidor på ett strukturerat sätt. Det behöver kopplas till projektet via Connectors.

**Åtgärd**: Anslut Firecrawl-connector i inställningarna.

---

## Steg 2: Skapa Edge Functions

### 2.1 `recipe-discover` - Hitta alla recept-URLer

Använder Firecrawl MAP för att snabbt hitta alla recept-URLer på ica.se/recept/:

- Input: Bas-URL (`https://www.ica.se/recept/`)
- Output: Lista med upp till 5000 recept-URLer
- Sparar URLer till en ny tabell `recipe_import_queue`

### 2.2 `recipe-scrape` - Hämta receptdata

Hämtar detaljer från enskilda recept:

- Tar recept-URL från kön
- Scrapar med Firecrawl SCRAPE (markdown-format)
- Skickar till AI för strukturering

### 2.3 `recipe-parse` - AI-strukturering

Använder Lovable AI (Gemini) för att:

- Extrahera ingredienser med mängd, enhet, och namn
- Extrahera instruktionssteg
- Kategorisera kök, måltidstyp, allergener
- Identifiera näringsvärden om tillgängligt

---

## Steg 3: Databas-uppdateringar

### Ny tabell: `recipe_import_queue`

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| source_url | text | ICA recept-URL |
| status | text | pending/processing/completed/failed |
| scraped_data | jsonb | Rå markdown-data |
| parsed_data | jsonb | AI-strukturerad data |
| error_message | text | Eventuellt fel |
| created_at | timestamp | Skapad |
| processed_at | timestamp | Bearbetad |

### Uppdatering av `recipes`-tabell

Lägg till kolumn:
- `source_url` (redan finns!) - för att spåra ursprung och undvika dubbletter

---

## Steg 4: Datamappning ICA → EatSuite

| ICA-data | Din kolumn | Transformation |
|----------|------------|----------------|
| Titel | `title` | Direkt |
| Beskrivning | `description` | Första stycket |
| Bild-URL | `image_url` | Direkt |
| Tid | `time_minutes` | Parsa "Under 45 min" → 45 |
| Portioner | `servings` | Parsa "ca 8 bitar" → 8 |
| Svårighetsgrad | `difficulty` | Mappa: Enkel/Medel/Svår |
| Ingredienser | `ingredients` | JSON-array med mängd, enhet, namn |
| Instruktioner | `instructions` | JSON-array med steg |
| Betyg | `rating` | Direkt |
| Taggar | `tags`, `meal_types`, `cuisine_types` | AI-kategorisering |
| Allergener | `allergen_free`, `dietary_needs` | AI-analys av "Innehåller..." |

---

## Steg 5: Admin-gränssnitt

En enkel admin-sida för att:

1. **Starta import** - Knapp för att köra recipe-discover
2. **Visa kö** - Status på recept i kön
3. **Batch-bearbetning** - Kör recipe-scrape + recipe-parse
4. **Statistik** - Antal importerade, misslyckade, etc.

---

## Implementeringsordning

1. **Anslut Firecrawl-connector**
2. **Skapa databas-tabell** för importkö
3. **Skapa Edge Function: recipe-discover** (MAP)
4. **Skapa Edge Function: recipe-scrape** (SCRAPE)
5. **Skapa Edge Function: recipe-parse** (AI)
6. **Skapa Admin-sida** för att hantera import
7. **Testa med 10-20 recept** innan full import
8. **Kör batch-import** (chunked för att undvika rate limits)

---

## Tidsuppskattning

- Steg 1-3: ~30 min
- Steg 4-5: ~1 timme
- Steg 6: ~30 min
- Steg 7-8: ~2 timmar (beroende på rate limits)

---

## Alternativa Lösningar

### Alternativ A: Manuell CSV-import
Om scraping inte är tillåtet kan du:
1. Exportera recept manuellt (om ICA erbjuder detta)
2. Ladda upp CSV via admin
3. Parsa och importera

### Alternativ B: Begränsad import
Importera endast:
- Topp 500 mest populära recept
- Specifika kategorier (svenska klassiker, snabba middagar)

---

## Kostnad och Rate Limits

- **Firecrawl**: Har användningsbegränsningar baserat på plan
- **Lovable AI**: Ingår i projektet utan extra kostnad
- **Rekommendation**: Importera i batches om 50-100 recept åt gången

