
# Plan: AI-chattbot för meddelandesidan

## Översikt

Den nya meddelandesidan får en intelligent AI-assistent som är specialanpassad efter användarens behandlingsplan och hälsoprofil. AI:n kan snabbt svara på vanliga frågor (t.ex. "Kan jag dricka laktosfri mjölk under FODMAP?") och eskalerar automatiskt till dietisten när frågan är för komplex eller medicinsk.

## Hur det fungerar

```text
┌─────────────────────────────────────────────────────────────┐
│                     Meddelandesidan                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    Användaren skriver fråga    ┌───────────┐  │
│  │ Patient │ ───────────────────────────────▶│ AI-bot    │  │
│  └─────────┘                                 └─────┬─────┘  │
│                                                    │        │
│                              ┌─────────────────────┼────────┤
│                              │                     │        │
│                              ▼                     ▼        │
│                     ┌───────────────┐     ┌──────────────┐  │
│                     │ Kan AI svara? │     │ Hämtar:      │  │
│                     │ säkert?       │     │ • Profil     │  │
│                     └───────┬───────┘     │ • Diagnos    │  │
│                             │             │ • Behandling │  │
│               ┌─────────────┴────────┐    └──────────────┘  │
│               │                      │                      │
│               ▼                      ▼                      │
│      ┌─────────────────┐    ┌───────────────────┐          │
│      │ JA: AI svarar   │    │ NEJ: Eskalera     │          │
│      │ direkt          │    │ till dietist      │          │
│      └─────────────────┘    └───────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Exempel på interaktion

**Användare:** "Är laktosfri mjölk okej på FODMAP?"  
**AI:** "Ja, laktosfri mjölk är helt okej under lågFODMAP-fasen! Laktos är den FODMAP som tas bort, så laktosfri fungerar bra. 🥛"

**Användare:** "Jag har ont i magen efter varje måltid och blod i avföringen"  
**AI:** "Jag förstår att du är orolig. Det här är något jag vill att din dietist Anna ska bedöma direkt. Jag har skickat ditt meddelande till henne, och hon återkommer så snart som möjligt. ❤️"

---

## Tekniska detaljer

### 1. Ny databastabell för meddelanden

En ny tabell `chat_messages` för att spara konversationshistorik:

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| user_id | uuid | Koppling till användare |
| conversation_type | text | "ai" eller "dietitian" |
| sender | text | "user", "ai", eller "dietitian" |
| content | text | Meddelandetext |
| escalated | boolean | Om AI eskalerat till dietist |
| escalation_reason | text | Varför AI eskalerade |
| created_at | timestamp | Tidsstämpel |

RLS-policyer säkerställer att användare bara ser sina egna meddelanden och att dietister kan se sina patienters meddelanden.

### 2. Ny edge function: `chat-assistant`

En backend-funktion som:
- Hämtar användarens intake-profil (diagnos, behandlingsplan, concern category)
- Skapar en kontextrik systemprompt baserat på profilen
- Använder Lovable AI (google/gemini-3-flash-preview) för att generera svar
- Returnerar en "confidence score" och eskaleringsrekommendation
- Streamar svaret för snabb respons

**Systemprompt-exempel för FODMAP-patient:**
```
Du är en AI-assistent för EatSuite som hjälper patienter med dietistfrågor.

PATIENTENS PROFIL:
- Huvudområde: Tarmhälsa (IBS)
- Behandling: FODMAP-elimination
- Aktivitetsnivå: Medel

RIKTLINJER:
- Svara på enkla FODMAP-frågor (godkända livsmedel, portionsstorlekar)
- Eskalera vid: medicinska symtom, blod, smärta, viktnedgång, osäkerhet
- Ton: Varm, stöttande, aldrig uppfordrande
```

### 3. Uppdaterad Messages-sida

**Ny design:**
- Header visar "EatSuite Assistent" med AI-ikon
- En liten banner under headern: "AI-assistenten hjälper dig snabbt. Din dietist tar vid när det behövs."
- Meddelanden har olika styling för AI vs dietist
- Vid eskalering visas ett tydligt statusmeddelande

**Ny funktionalitet:**
- Skriv meddelande → Skickas till edge function
- AI svarar med streaming (token-by-token)
- Om AI eskalerar visas: "Jag har kopplat på [Dietistens namn]. Hon återkommer snart."

### 4. Eskaleringslogik

AI:n instrueras att eskalera när:
- Medicinska symtom nämns (blod, smärta, yrsel, kraftig viktnedgång)
- Patienten uttrycker stark oro
- Frågan är utanför AI:ns kunskapsområde
- AI:n är osäker på svaret (confidence < 0.7)
- Patienten explicit ber om dietisten

Vid eskalering:
1. Meddelandet markeras som `escalated = true`
2. Dietisten får en notifikation (framtida funktion)
3. Patienten ser bekräftelse att dietisten kontaktats

---

## Filer som skapas/ändras

| Fil | Åtgärd |
|-----|--------|
| `supabase/functions/chat-assistant/index.ts` | Ny edge function |
| `src/pages/Messages.tsx` | Ombyggd med AI-chattlogik |
| `src/hooks/useChatMessages.ts` | Ny hook för meddelanden |
| `src/components/messages/ChatMessage.tsx` | Meddelandekomponent |
| `src/components/messages/ChatHeader.tsx` | Header med AI/dietist-info |
| `supabase/config.toml` | Registrera ny funktion |
| Databasmigration | Ny tabell + RLS |

---

## Säkerhetsaspekter

- **RLS-policyer:** Användare ser endast sina meddelanden; dietister endast tilldelade patienter
- **Promptsäkerhet:** Sanitisering av input för att förhindra prompt injection
- **Autentisering:** Edge function kräver giltig JWT-token
- **Dataminimering:** AI ser bara relevant profilinformation, inte hela journalen
