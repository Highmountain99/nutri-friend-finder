

# Plan: Stripe-betalningsintegration för bokningar

## Sammanfattning

Implementera en betalningssida som visas när användaren klickar "Bekräfta bokning". Även om besöket är kostnadsfritt (0 kr) måste användaren registrera sitt kort för att möjliggöra debitering av no-show-avgiften på 275 kr.

## Lösningsöversikt

Stripes **Setup Mode** används för att:
- Validera och spara kortuppgifter utan att debitera
- Koppla kortet till en Stripe Customer
- Möjliggöra framtida debiteringar (t.ex. no-show-avgift)

## Flöde

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Välj tid       │ --> │  Stripe         │ --> │  Bekräftelse    │
│  "Bekräfta      │     │  Checkout       │     │  Tid bokad!     │
│   bokning"      │     │  (lägg in kort) │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Steg

### 1. Skapa Edge Function: `create-booking-checkout`

Skapar en Stripe Checkout-session i **setup mode** för att samla in kortuppgifter.

**Funktionalitet:**
- Kontrollera om användaren redan är Stripe-kund
- Skapa en ny kund om inte
- Skapa Checkout-session med `mode: "setup"`
- Returnera URL till Stripe Checkout

### 2. Uppdatera bokningskomponenter

**ChatBookingSheet.tsx och DietitianDetailSheet.tsx:**
- När användaren klickar "Bekräfta bokning", anropa edge function
- Öppna Stripe Checkout i ny flik
- Vid framgång, redirect till en callback-sida

### 3. Skapa callback-sida för lyckad kortregistrering

**Ny sida:** `/booking-success`
- Hämta bokningsdetaljer från URL-parametrar eller session
- Slutför bokningen i databasen
- Visa bekräftelse

### 4. Uppdatera appointments-tabellen

Lägg till fält för att spara Stripe-kundens ID och Setup Intent-referens.

## Tekniska detaljer

### Edge Function: create-booking-checkout

```text
Endpoint: POST /create-booking-checkout
Body: {
  dietitian_id: string,
  appointment_date: ISO string,
  appointment_type: string
}

Response: { url: string }
```

### Databasändringar

Lägg till i appointments-tabellen:
- `stripe_customer_id` (text, nullable) - Stripe-kund-ID
- `stripe_setup_intent_id` (text, nullable) - Setup Intent för referens
- `payment_method_saved` (boolean, default false) - Om kort är sparat

### UI-ändringar

1. **ChatBookingSheet.tsx**: 
   - Byt ut direkt bokning mot Stripe-redirect
   - Spara bokningsdata temporärt

2. **DietitianDetailSheet.tsx**:
   - Samma ändring för det fullständiga bokningsflödet

3. **BookingStep.tsx** (qualifying flow):
   - Integrera samma logik för nya användare

4. **Ny sida: BookingSuccess.tsx**:
   - Hantera Stripe-callback
   - Slutför bokning
   - Visa bekräftelse

## Användarupplevelse

1. Användaren väljer tid och klickar "Bekräfta bokning"
2. Informationsruta visas: "Besöket kostar 0 kr. Vi behöver dina kortuppgifter för eventuell no-show-avgift (275 kr)"
3. Redirect till Stripe Checkout
4. Användaren fyller i kortuppgifter
5. Redirect tillbaka till appen
6. Bokningen slutförs och bekräftelse visas

## Fördelar med denna lösning

- **Säkerhet**: Stripe hanterar all kortdata (PCI-compliant)
- **Enkelhet**: Ingen egen betalningsformulär behövs
- **Flexibilitet**: Kan enkelt debitera no-show-avgift senare
- **Spårbarhet**: Alla kort kopplas till Stripe-kunder

