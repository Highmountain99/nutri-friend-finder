# Förenklad version: kostverktyg för PT och klient

Appen slimmas till ett rent kostverktyg. Coachen (tidigare "dietist") ger kostrådgivning till sina klienter via klientkort, journalinsyn, recept, behandlingsplan och chatt. All vårdrelaterad och bokningsrelaterad funktionalitet tas bort.

## Detta tas bort i klientvyn

- All bokning: bokningssidan, tidsval, bokningsbekräftelse, betalning/no-show-avgift, "Nästa samtal"-kort och bokning i chatten
- Videosamtal
- 1177 – Journal (extern länk i menyn)
- Möteshistorik
- Frikort, Koder, SEB försäkring (hela betalningsmetod-sektionen i menyn)
- Diagnoser & tillstånd samt blodtryck i Hälsoprofilen
- Hela onboarding/kvalificeringsflödet – efter kontoskapande hamnar man direkt på startsidan

Kvar i hälsoprofilen: vikt, längd, midjemått, aktivitetsnivå och mål.

## Detta tas bort i coachvyn

- Blockbibliotek
- Kalender/schema (inklusive kalendersynk och tillgänglighetstider)
- Statistik
- Videosamtal från klientkortet

## Namnbyten

- "Dietist" → "Coach" i all synlig text, i både klient- och coachvyn
- "Patient/Patienter" → "Klient/Klienter" i coachvyn
- Sidebar och rubriker uppdateras: Klienter, Meddelanden, Recept, Profil

## Så fungerar flödet efteråt

1. Klienten skapar konto (eller kommer in via coachens inbjudningslänk) och landar direkt i appen.
2. Klienten loggar mat, symtom, vikt och midjemått samt använder recept.
3. Coachen ser klientens loggning, sätter mål och behandlingsplan, föreslår recept och chattar.

## Tekniska detaljer

- Routes som tas bort i `src/App.tsx`: `/booking`, `/booking-success`, `/meeting-history`, `/frikort`, `/koder`, `/seb-forsakring`, `/qualifying`, `/dietitian/schedule`, `/dietitian/blocks`, `/dietitian/statistics`. Tillhörande sidor och komponenter (`src/components/booking/*`, `VideoCallModal`, `CalendarSyncSheet`, block-biblioteket, qualifying-komponenterna) raderas.
- `QualifyingRoute` ersätts av en enkel inloggningsvakt; ingen omdirigering till `/qualifying`. `useIntakeProfile` behålls bara där progress-vyn behöver `unified_concern_category`, annars tas beroendet bort.
- `SideMenu` rensas: Konto (Hälsoprofil, Inställningar, Hjälp), introduktion, logga ut. Betalningssektionen och 1177 försvinner. `BottomNav` är oförändrad.
- `Profile.tsx`: kortet för blodtryck och sektionen "Diagnoser & tillstånd" tas bort tillsammans med `EditBloodPressureSheet` och `EditConditionsSheet`.
- Coach-sidebar (`DietitianSidebar`) får posterna Översikt, Klienter, Meddelanden, Recept, Profil (+ Admin för admins).
- Introduktionsguiden (`CoachTour`) uppdateras så steg som pekar på borttagna ytor försvinner.
- Databasen lämnas orörd i detta steg (tabeller som `appointments` och `block_templates` blir oanvända men raderas inte, så inget data går förlorat).
