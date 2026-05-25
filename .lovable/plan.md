# Brand redesign — Gutfeeling

Apply the uploaded brand book as the app's new visual identity. This is a pure design-system swap — no business logic, routes, data, or feature behavior changes.

## 1. Design tokens (foundation)

Rewrite `src/index.css` `:root` (and `.dark`) with the brand palette, converted to HSL:

```text
--beige (canvas)      #EBE5D6   → 44 31% 88%
--beige-2 (surface)   #E4DCC7   → 44 33% 84%
--ink (text)          #1F2A22   → 140 16% 14%
--green (primary)     #1F3A2E   → 150 31% 17%
--green-deep          #142319   → 145 30% 11%
--green-soft (accent) #2D4F3E   → 150 27% 24%
--line                rgba(31,42,34,0.18)
```

Semantic mapping:
- `--background` → beige, `--foreground` → ink
- `--card` → white-ish beige (`--beige`), `--card-foreground` → green-deep
- `--primary` → green, `--primary-foreground` → beige
- `--secondary` → beige-2
- `--accent` → green-soft (replace coral entirely — brand has no coral)
- `--muted` → beige-2, `--muted-foreground` → green-soft
- `--border`, `--input` → line color
- `--ring` → green
- Sidebar tokens mirror the same palette
- Gradients (`--gradient-hero`, `--gradient-card`) flattened or restated as subtle beige→beige-2; remove the sage gradient

Dark mode: invert to green-deep canvas with beige text (brand supports dark surfaces).

Keep `--radius: 1rem` (brand uses 8–12px on cards, fine).

## 2. Typography

- Load Google Fonts: Instrument Serif (regular + italic), Geist (300/400/500/600), JetBrains Mono (400/500) — add `<link>` in `index.html`.
- `tailwind.config.ts` fontFamily:
  - `sans: ['Geist', ...]`
  - `serif: ['"Instrument Serif"', 'serif']` (new)
  - `mono: ['"JetBrains Mono"', ...]` (new)
- Heading defaults in `index.css` `@layer base`: headings use `font-serif`, weight 400, tight tracking, with italic available for emphasis.
- Add small utility classes: `.eyebrow` (mono, 11px, uppercase, tracked, green) and `.lede` (serif italic) — used in Header, section titles, cards.

## 3. Component-level restyling (no behavior changes)

Touch the shared chrome and most visible surfaces. All edits keep existing markup/props; only classNames and small token usages change.

- **Header** (`src/components/layout/Header.tsx`): greeting in mono eyebrow style, name in serif italic; leaf avatar bg becomes flat green (no gradient).
- **BottomNav, SideMenu**: beige background, green icons, mono labels.
- **AppLayout**: beige body (already via token).
- **Buttons** (`src/components/ui/button.tsx` variants): primary = green/beige, secondary = beige-2/green-deep, ghost stays; pill radius preserved. Remove any coral references.
- **Cards** (`src/components/ui/card.tsx`): beige surface, hairline `--line` border, soft shadow.
- **Inputs / Sheet / Dialog / Tabs**: rely on tokens — should adopt automatically once tokens change; quick visual sweep to fix anything hardcoded.
- **Home page** (`src/pages/Home.tsx`, `AppointmentCard`, `QuickActionCard`): hero greeting in serif italic, section eyebrows in mono.
- **OrganicLoader CSS** (`src/styles/organic-loaders.css`): swap any hardcoded sage/coral hues to brand green tokens.
- **DietitianSidebar / DietitianLayout**: same token-driven swap; brand wordmark uses serif italic.
- **Auth landing** (`src/components/auth/AuthLanding.tsx`): full editorial restyle — big serif wordmark "Gut*feeling*" (italic on second word), beige canvas, mono meta line, single green CTA.

## 4. Cleanup

- Search and replace hardcoded color classes that bypass tokens (`text-white`, `bg-emerald-*`, `text-coral*`, gradient utility usages) in components touched above. Anything not visited stays token-driven and will pick up the new palette automatically.
- Update memory entry "Brand Colors" to reflect the new palette (beige + forest green, no coral).

## 5. Out of scope

- No changes to routing, data, edge functions, RLS, or feature behavior.
- No restructuring of pages or component hierarchy.
- Per-page deep editorial redesign beyond Header, Home hero, Auth landing is deferred — token swap alone will refresh ~90% of surfaces consistently.

## Verification

- Visit `/auth`, `/home`, `/journal`, `/messages`, `/progress`, `/dietitian` and confirm: beige canvas, green primary, serif headings, mono eyebrows, no leftover sage/coral.
- Confirm OrganicLoader colors match the new palette.
- Check dark mode renders with deep-green canvas.
