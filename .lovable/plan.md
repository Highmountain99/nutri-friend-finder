

# Plan: Förenklad desktop-sidebar för dietist-dashboarden

## Vad som ändras

Byt ut den nuvarande Radix `Sidebar`-komponenten mot en enkel, fast sidebar byggd med ren Tailwind. Ingen collapsible-logik, ingen `SidebarProvider` — bara en ren vertikal navigation som alltid syns på skärmen.

## Ändringar

### 1. `DietitianSidebar.tsx` — Skriv om helt
- Ta bort alla Radix Sidebar-importer
- Enkel `<nav>` med fast bredd (~240px), full höjd, border-right
- Varje tab är en `NavLink` med ikon + text, aktiv state via bakgrundsfärg
- "EatSuite Pro" som logotyp/rubrik högst upp
- "Logga ut"-knapp längst ner

### 2. `DietitianLayout.tsx` — Förenkla
- Ta bort `SidebarProvider` och `SidebarTrigger`
- Enkel flex-layout: sidebar + main content area
- Ta bort headern med trigger-knappen (behövs inte när sidebar alltid syns)

