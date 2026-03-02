

# Plan: Lägg till "Logga in som dietist"-knapp på /auth

Lägg till en diskret knapp längst ner i `AuthLanding.tsx`, under villkorstexten. Knappen navigerar direkt till `/dietitian` (eller loggar in med ett test-konto om vi vill). Enklaste lösningen: en textlänk-knapp som navigerar till `/dietitian`.

## Ändring

**`src/components/auth/AuthLanding.tsx`**
- Lägg till en liten `ghost`-knapp eller länk under privacy-texten: "Logga in som dietist"
- Använder `useNavigate` för att gå till `/dietitian`
- Stilmässigt diskret: liten text, `text-muted-foreground`, ingen bakgrund

