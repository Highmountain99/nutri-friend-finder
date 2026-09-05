# Tre justeringar: notiser, profilbild och specialiseringar

## 1. Notissymbolen ska försvinna när meddelanden är lästa

I coachvyn markeras klientens meddelanden som lästa när samtalet öppnas, men siffran i sidomenyn hämtas bara om på ett 30-sekundersintervall. Därför ligger notisbubblan kvar en stund efter att man läst.

Åtgärd:
- När meddelanden markeras som lästa uppdateras notisräknaren direkt (ingen väntan på nästa intervall).
- Räknaren uppdateras också när ett samtal öppnas och när nya meddelanden kommer in i realtid.

Resultat: bubblan försvinner i samma stund som samtalet läses.

## 2. Profilbilden för coach sparas inte

Kontroll mot databasen visar att inga coachprofiler har någon sparad bild alls (bildfältet är tomt för båda coacherna), trots uppladdningsförsök. Uppladdning och sparning behöver alltså felsökas, inte bara visningen.

Åtgärd:
- Först verifiera var det brister (uppladdning till lagringen eller sparningen på profilen) genom att köra flödet och läsa felmeddelandet.
- Rätta felet och gör flödet robust: alltid samma filnamn oavsett filändelse så gamla bilder inte blir kvar, tydligt felmeddelande om något går fel, och bilden visas direkt efter uppladdning utan omladdning av sidan.
- Kontrollera att bilden också syns för klienten (chattens header och kort med coachen).

## 3. Nya specialiseringar för PT

Ersätt nuvarande dietistinriktade lista i coachens profil med:

Styrketräning och muskeluppbyggnad · Viktminskning och livsstilsförändring · Funktionell träning och vardagsstyrka · Kondition, löpning eller uthållighet · Idrottsspecifik prestationsutveckling · Rörlighet och mobilitet · Seniorträning · Träning under och efter graviditet · Träning för barn och ungdomar · Träning för personer med funktionsnedsättning · Återgång till träning efter skada, i samarbete med fysioterapeut · Smärtanpassad träning, inom PT:ns kompetensområde · Träning vid exempelvis diabetes eller hjärt-kärlsjukdom, med rätt vidareutbildning och vårdkontakt · Kostcoachning och beteendeförändring · Stresshantering, återhämtning och sömnvanor · Onlinecoachning · Företagshälsa och arbetsplatsträning · Gruppträning · Bodybuilding, powerlifting, tyngdlyftning eller CrossFit · Kampsportsfys eller annan sportspecifik fysträning

Möjligheten att lägga till egen specialisering behålls. Redan sparade specialiseringar på befintliga profiler tas inte bort automatiskt — de visas kvar tills coachen ändrar dem själv.

## Teknisk sammanfattning

- `useUnreadMessages`: invalidera `["unread-messages"]` efter att `read_at` satts i `DietitianMessages.tsx`; behåll intervallet som fallback.
- `DietitianProfile.tsx`: felsök `handleAvatarUpload` (storage-policy för `avatars` finns för insert/update/delete), normalisera sökväg till `${user.id}/avatar` med fast ändelse, logga/visa faktiskt fel, och uppdatera cachen optimistiskt med cache-buster.
- `SPECIALIZATION_OPTIONS` i `DietitianProfile.tsx` byts ut mot den nya listan; kontrollera om `specializationLabels` i `src/types/dietitian.ts` används för visning och uppdatera vid behov.
