

# Plan: Fem buggfixar och förbättringar

## 1. Ta bort "Söker i Livsmedelsverkets databas..." text
**Fil:** `src/components/journal/AddMealSheet.tsx` (rad 336)

Ta bort raden `<p className="text-xs text-muted-foreground">Söker i Livsmedelsverkets databas...</p>` från loading-state. Behåll "Analyserar måltiden...".

## 2. Fixa bifogade filer i patientchatten
**Fil:** `src/components/messages/ChatAttachmentPicker.tsx`

Problemet är sannolikt att `storage.foldername()` inte fungerar som förväntat med uppladdningssökvägen. Lägger till bättre felhantering med en `toast`-notis så att användaren ser vad som gått fel, och undersöker om sökvägsformatet matchar RLS-policyn. Eventuellt behöver vi justera RLS-policyn via en migration.

## 3. BottomNav safe area för iPhone
**Fil:** `src/components/layout/BottomNav.tsx`

Lägger till `pb-safe` (safe-area padding) i navigationskomponenten så att den respekterar iPhone:s hemknapp-zon. Ändrar `<nav>` till att inkludera `pb-[env(safe-area-inset-bottom)]` och ökar höjden på hela navigationsblocket.

## 4. Förhindra zoom på textinput (iOS)
**Fil:** `index.html`

Uppdaterar viewport meta-taggen till `maximum-scale=1` för att förhindra iOS auto-zoom vid fokus på textfält med font-size < 16px. Alternativt sätter vi `font-size: 16px` som minimum på alla input/textarea-element via CSS.

Ändring i `index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

## 5. Push-notiser via Web Push API
**Nya filer/ändringar:**
- **`src/hooks/usePushNotifications.ts`** — Hook som begär push-tillstånd via Web Push API, sparar subscription i en ny databastabell.
- **Ny databastabell `push_subscriptions`** — Lagrar endpoint, keys (p256dh, auth) kopplat till user_id.
- **Ny backend-funktion `supabase/functions/send-push-notification/index.ts`** — Anropas via en database webhook/trigger när ett nytt `chat_messages`-meddelande skapas med `sender = 'dietitian'`. Skickar web push via Web Push Protocol.
- **Trigger i databasen** — `AFTER INSERT ON chat_messages` anropar edge function om `sender = 'dietitian'` och `status = 'sent'`.

Patienten kommer automatiskt att tillfrågas om push-tillstånd vid inloggning. Notisen visar "Nytt meddelande från din dietist" med en klickbar länk till `/messages`.

## Tekniska detaljer

| Ärende | Fil(er) | Typ |
|--------|---------|-----|
| Livsmedelsverket-text | `AddMealSheet.tsx` | Radera 1 rad |
| Bilagor i chat | `ChatAttachmentPicker.tsx` + ev. migration | Felhantering + RLS-fix |
| BottomNav safe area | `BottomNav.tsx`, `index.css` | CSS padding |
| Zoom-prevention | `index.html` | Viewport meta |
| Push-notiser | Ny hook, ny edge function, ny tabell, trigger | Fullständig ny feature |

