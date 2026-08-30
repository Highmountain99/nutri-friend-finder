# Introduktionsguide för nya användare

En kort, klickbar guide i 5 steg som visas första gången en användare kommer in i appen. Varje steg mörklägger skärmen, lyfter fram rätt del av gränssnittet och visar en pil som pekar mot den, tillsammans med en kort förklarande text.

## Stegen

1. **Hälsoprofil** – pekar mot profil-/menyikonen i toppen. "Fyll i vikt, längd, blodtryck och midjemått. Då kan din dietist sätta mål utifrån dina värden."
2. **Journal** – pekar mot Journal i bottenmenyn. "Här loggar du vad du äter. Enklast är att ta kort på maten — annars kan du skriva exakt vad du ätit."
3. **Dagliga näringsmål** – fortsatt fokus på Journal. "Du och din dietist sätter dagliga mål för näringsämnen. De uppdateras allt eftersom du loggar."
4. **Recept** – pekar mot Recept i bottenmenyn. "Här finns recepten din dietist rekommenderar. Spara de du gillar — de dyker upp här. Du kan också bläddra bland recept från hela dietistcommunityn."
5. **Utveckling** – pekar mot Utveckling i bottenmenyn. "Här ser du planen din dietist sätter för dig, din resa och målen längs vägen. Kostrelaterade mål bockas av allt eftersom du loggar."

Navigering: "Nästa"/"Tillbaka", punktindikator, samt "Hoppa över" som stänger guiden. Sista steget avslutas med "Kom igång".

## Beteende

- Visas automatiskt en gång, efter att onboarding/kvalificering är klar och användaren landar på /home.
- Markeras som avklarad när guiden slutförs eller hoppas över — visas då aldrig igen.
- Kan startas om manuellt via sidomenyn ("Visa introduktion igen").

## Teknisk beskrivning

- Ny komponent `src/components/tutorial/AppTutorial.tsx`: overlay renderad via React Portal till `document.body`, med backdrop, hål/ring runt målelementet (mätt med `getBoundingClientRect`) och en pil mot målet.
- Målelement identifieras med `data-tour="profile" | "journal" | "recipes" | "progress"` — attribut läggs på befintliga knappar i `Header.tsx` och `BottomNav.tsx` (endast attribut, ingen ändrad logik).
- Monteras i `AppLayout.tsx` så den ligger över hela patientvyn; respekterar safe areas.
- Status sparas i `localStorage` per användar-id (`gf_tutorial_v1_<userId>`), så ingen databasändring behövs.
- Formspråk enligt befintlig design: beige kort, Instrument Serif-rubrik, Geist brödtext, mjuka rundade hörn, inga toasts.
