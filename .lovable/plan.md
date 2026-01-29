

## Omdesign av symptomkort i journaltidslinjen

### Sammanfattning
Gör symptomkortet mer kompakt och subtilt jämfört med måltidskortet. Lägg till en visuell koppling (streck) mellan symptom och dess kopplade måltid. Byt ut utropstecknet mot en mildare symbol.

---

### Ändringar i SymptomCard

**Ny design:**
```text
┌──────────────────────────────────┐
│  ○  08:30 · Fick ont i magen     │
└──────────────────────────────────┘
```

**Förändringar:**
- **Mildare ikon:** Byt `AlertTriangle` mot `Circle` (fylld liten cirkel) eller `Activity` för att antyda en händelse utan att vara alarmistisk
- **Kompaktare layout:** Ta bort padding och gör kortet till en enkel rad
- **Endast tid + beskrivning:** Visa bara tid och en trunkerad rubrik (ej "Kopplat till"-text)
- **Mindre storlek:** Reducera padding från `p-3` till `py-1.5 px-3`
- **Ta bort border-left:** Använd istället en liten cirkel-ikon inline

**Ny struktur:**
```tsx
<div
  className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-muted/50 
             cursor-pointer hover:bg-muted transition-colors text-sm"
  onClick={onClick}
>
  <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
  <span className="text-xs text-muted-foreground">{timeDisplay}</span>
  <span className="text-xs truncate">{symptom.description}</span>
</div>
```

---

### Ändringar i MealTimeline

**Visuell koppling för länkade symptom:**

Nuvarande design visar endast en liten punkt. Ny design lägger till ett vertikalt streck som binder ihop symptomet med måltiden.

**Ny struktur för länkade symptom:**
```text
       ┌────────────────────────────────────┐
   ●   │ Lunch • 12:30                      │
       │ Pasta carbonara                    │
       │ ⬤ 450  ⬤ 32g  ⬤ 45g  ⬤ 18g        │
       └────────────────────────────────────┘
       │  ← Vertikal linje som kopplar
       ├──○ 14:30 · Fick ont i magen
       │
       ├──○ 15:00 · Uppsvälld
```

**Implementation:**
- Lägg till en vertikal linje (`border-l-2`) som sträcker sig från måltidskortet ner till symptomen
- Lägg till en horisontell linje (`w-4 h-0.5`) som kopplar från den vertikala linjen till symptomet
- Placera en liten punkt vid kopplingspunkten

**Uppdaterad JSX för länkade symptom:**
```tsx
{item.linkedSymptoms && item.linkedSymptoms.length > 0 && (
  <div className="ml-4 mt-1 border-l-2 border-accent/30 pl-4 space-y-1">
    {item.linkedSymptoms.map((symptom) => (
      <div key={symptom.id} className="relative flex items-center">
        {/* Horisontell kopplingsstreck */}
        <div className="absolute -left-4 top-1/2 w-3 h-0.5 bg-accent/30" />
        <SymptomCard
          symptom={symptom}
          onClick={() => onSymptomClick?.(symptom)}
        />
      </div>
    ))}
  </div>
)}
```

---

### Tekniska detaljer

**Filer som ändras:**

| Fil | Åtgärd |
|-----|--------|
| `src/components/journal/SymptomCard.tsx` | Gör kompaktare, byt ikon, visa endast tid + rubrik |
| `src/components/journal/MealTimeline.tsx` | Lägg till visuellt kopplingsstreck för länkade symptom |

**Storleksjämförelse:**

| Element | Före | Efter |
|---------|------|-------|
| SymptomCard padding | `p-3` | `py-1.5 px-3` |
| SymptomCard höjd | ~60px | ~32px |
| Ikon | `AlertTriangle` (utropstecken) | Liten fylld cirkel |
| Innehåll | Tid + beskrivning + länkinfo | Endast tid + trunkerad beskrivning |

