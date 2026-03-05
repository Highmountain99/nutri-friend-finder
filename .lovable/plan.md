

## Plan: Livsmedelsskanner på Receptsidan

### Översikt
Bygga en komplett livsmedelsskanner som nås via en knapp på Receptsidan. Skannern använder kameran för att läsa streckkoder, hämtar produktdata från Open Food Facts API, och visar detaljerad näringsinformation. Inkluderar sökhistorik och jämförelsefunktion.

### Nya beroenden
- `html5-qrcode` – streckkodsläsning via kamera

### Nya filer

**Typer & API**
- `src/types/scanner.ts` – TypeScript-interface för ProductResponse, nutriments, etc.
- `src/lib/api/openFoodFacts.ts` – API-anrop mot Open Food Facts, caching i minnet
- `src/lib/scanner/nutritionThresholds.ts` – EU-trafikljuströskelvärden och allergenöversättningar

**Context**
- `src/contexts/ScannerHistoryContext.tsx` – React context för sessionsbaserad sökhistorik (inga databas/localStorage)

**Komponenter** (`src/components/scanner/`)
- `BarcodeScanner.tsx` – Kameravy med html5-qrcode, animerad skanningsram, manuellt inmatningsfält, demoknappar
- `ProductView.tsx` – Fullständig produktsida: header, Nutri-Score, NOVA, näringstabell, makro-donut (Recharts), allergener, ingredienser, action-knappar
- `NutriScoreDisplay.tsx` – A-B-C-D-E visuell skala med färgkodning
- `NovaGroupDisplay.tsx` – NOVA 1-4 med färg och beskrivning
- `NutritionTable.tsx` – Tabell med EU-trafikljusfärgkodning per rad
- `MacroDonutChart.tsx` – Recharts donut med protein/kolhydrater/fett
- `AllergenBadges.tsx` – Allergenbadges med svensk översättning
- `IngredientsCollapsible.tsx` – Expanderbar ingredienslista
- `ScannerHistory.tsx` – Lista med tidigare skannade produkter
- `ProductCompare.tsx` – Jämförelsevy för 2-3 produkter sida vid sida
- `ScannerSheet.tsx` – Sheet/fullskärmsvy som wraps hela flödet med intern navigation (scanner → produkt → historik → jämför)

### Ändringar i befintliga filer

**`src/pages/Recipes.tsx`**
- Lägg till "Skanna livsmedel"-knapp (Scan-ikon från Lucide) i headern bredvid titeln
- Wrappa med ScannerHistoryProvider
- Knappen öppnar `ScannerSheet`

**`src/App.tsx`**
- Ingen ändring – skannern lever som en Sheet/overlay inom Recipes, inte som en separat route

### Flöde

```text
Receptsidan
  └─ Klick "Skanna" → öppnar ScannerSheet (fullskärm)
       ├─ Scanner-vy (kamera + manuell input + demoknappar)
       │    └─ Lyckad skanning → ProductView
       │         └─ "Spara i historik" / "Skanna ny"
       ├─ Historik-vy (lista, checkbox-markering)
       │    └─ "Jämför" → ProductCompare
       └─ Tillbaka-knapp stänger sheeten
```

### Tekniska detaljer

- **Kamera**: `html5-qrcode` med stöd för EAN-13, EAN-8, UPC-A. Fallback med demoknappar om kamera ej tillgänglig.
- **API**: Direkt klientanrop till `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`. Caching i React state (Map). User-Agent header.
- **Vibration**: `navigator.vibrate(200)` vid lyckad skanning.
- **Färgkodning näring**: EU-trafikljuströskelvärden per 100g (fett ≤3g grön, 3-17.5g gul, >17.5g röd, etc.)
- **Nutri-Score**: Visuell A-E skala med färgerna #1E8F4E, #60AC0E, #EEAE0E, #FF6F1E, #E63E11
- **NOVA**: 1-4 med grön/gul/orange/röd
- **Donut chart**: Recharts PieChart med innerRadius/outerRadius, kalorier i mitten
- **Allergenöversättning**: Map från `en:gluten` → `Gluten`, `en:milk` → `Mjölk`, etc.
- **Historik**: SessionContext med `useState<Product[]>`, ingen persistens
- **Jämförelse**: Tabell med kolumner per produkt, bästa värde per rad markerat grönt
- **Dark mode**: Använder befintliga CSS-variabler (redan implementerat i appen)
- **Animationer**: Tailwind animate classes för slide-in, skanningslinje med CSS keyframe

### Steg i implementationsordning
1. Installera `html5-qrcode`
2. Skapa typer och API-hjälpfiler
3. Skapa ScannerHistoryContext
4. Bygga alla scanner-komponenter (bottom-up: små → stora)
5. Skapa ScannerSheet som orkestrerar flödet
6. Integrera knappen i Recipes.tsx

