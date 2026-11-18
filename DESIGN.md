---
name: The Gold Plan
description: "Disciplined XAUUSD trading journal — dark editorial marketing canvas, one scarce gold accent, Playfair for brand moments over Inter working type, hairline borders, no decoration the discipline story cannot justify."
colors:
  gold: "#c9a227"
  gold-bright: "#e9c84a"
  gold-soft: "rgba(201,162,39,0.07)"
  on-gold: "#12140f"
  canvas: "#0d0f14"
  card: "#141822"
  code-bg: "#1b2130"
  line: "#232a36"
  ink: "#e9ecf1"
  ink-body: "#cdd4e0"
  ink-dim: "#9aa3b2"
  green-positive: "#7fbf7f"
  red-negative: "#e06c6c"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.7rem, 4.4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1.3
  subtitle:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.06rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  pill: 9999px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 38px
  section: 38px
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.on-gold}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 11px 20px
  button-ghost:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 11px 20px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 22px
  callout:
    backgroundColor: "{colors.gold-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 10px 12px
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-dim}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 5px 14px
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: 48px
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 18px 0px
---

# Design System: The Gold Plan

## Overview

**Creative North Star: "The Quiet Ledger"**

The Gold Plan's public surface is a dark editorial ledger: a near-black canvas, hairline rules, one scarce gold accent, and typography that reads like a well-kept trading journal. Every marketing page is an article that argues discipline, not profit — the design carries the same argument by being quiet, exact, and unhurried.

The app itself ships three design variants (`data-design="linear | gold | mono"`, each with light/dark) defined as CSS custom properties in `src/index.css`. The default variant is `linear`. The marketing/static pages and share cards carry the gold-ledger palette documented in this file. The former Linear.app reference analysis lives at `docs/DESIGN-Linear-Analysis.md` and documents the `linear` variant's source inspiration; it is reference material, not the system.

**Key Characteristics:**
- Dark blueprint-black canvas (`{colors.canvas}` #0d0f14) with hairline slate borders — depth comes from surface steps, never shadows.
- One scarce gold accent (`{colors.gold}` #c9a227) for links, key numbers, and the single primary CTA.
- Playfair Display for brand moments (landing hero in the Gold variant, og share cards, the in-app share card); Inter for working type; JetBrains Mono for numbers and code.
- Single 65–75ch reading column — marketing pages are articles, not dashboards.
- Flat by default: no drop shadows, no gradients, no glass.

## Colors

> The palette is a ledger: near-black paper, graphite ink, and gold ink used the way a highlighter is used — rarely.

### Primary
- **Ledger Gold** ({colors.gold}): Links, the lot-size result number, the primary CTA fill, active states. The only chromatic accent.
- **Bright Gold** ({colors.gold-bright}): Hover/pressed shift of the accent, og-card headline gold. Sparing.
- **Gold Soft** ({colors.gold-soft}): Callout panel tint — the honesty boxes ("One honest thing", "Fair comparison").

### Neutral
- **Blueprint Black** ({colors.canvas}): Page background and input wells.
- **Card Slate** ({colors.card}): CTA panels, calculator panels, feature boxes — one step above canvas.
- **Code Slate** ({colors.code-bg}): Inline code chips.
- **Hairline Slate** ({colors.line}): 1px borders, rules, dividers.
- **Ledger White** ({colors.ink}): Headlines and emphasized values.
- **Body Ink** ({colors.ink-body}): Default paragraph and list text.
- **Dim Slate** ({colors.ink-dim}): Meta text, nav links, footers, labels.

### Semantic
- **Positive Green** ({colors.green-positive}): Take-profit values only.
- **Negative Red** ({colors.red-negative}): Risk-at-stop when it exceeds budget, loss states only.

### Named Rules
**The Scarce Gold Rule.** Gold appears on links, one or two key numbers, and one primary CTA per view — under 10% of any screen. When everything is gold, nothing is.

## Typography

**Display Font:** Playfair Display (Georgia, serif fallback) — brand moments only.
**Body Font:** Inter (system-ui, -apple-system fallback) — everything that works.
**Mono Font:** JetBrains Mono (ui-monospace, Menlo fallback) — numbers, code, tabular data.

**Character:** A serif with a banknote's authority for the brand voice; a neutral, information-first sans for everything the reader actually reads. The pairing says: serious about the craft, no theatrics.

### Hierarchy
- **Display** (Playfair, 600, clamp(2rem→3.5rem), lh 1.1): Landing hero in the Gold variant, og share cards. Never article body.
- **Headline** (Inter, 700, clamp(1.7rem→2.5rem), lh 1.18): Article h1 on marketing pages.
- **Title** (Inter, 700, 1.35rem, lh 1.3): Article h2, section titles.
- **Subtitle** (Inter, 700, 1.06rem): Article h3, FAQ questions.
- **Body** (Inter, 400, 16px, lh 1.65): Default reading text in the 720px column (65–75ch).
- **Label** (Inter, 400, 13px): Footer, nav, hints.
- **Mono** (JetBrains Mono, 400, 14px): Formulas, code, pip values.

### Named Rules
**The Ledger Voice Rule.** Headlines state facts in the product's own language ("Prop firm daily loss tracker for gold traders"), never marketing abstractions. No eyebrows or kickers above a heading — the heading carries its own weight.

## Layout

Single reading column: `.wrap` max-width 720px, 28px/20px padding, centered. The calculator page widens to 860px with a 2-column input/result grid that stacks below 760px. Sections separate by 38px (`{spacing.section}`) and hairline rules, never by boxed card grids. Cards exist only where content earns one (CTA panel, calculator panels, callouts).

## Elevation & Depth

Flat by default. Depth is carried by surface color steps (canvas → card → code-bg) and 1px hairline borders. No drop shadows anywhere on the marketing surface. Focus is the only glow allowed: 2px gold outline on `:focus-visible`.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat with 1px hairline borders. Depth is surface color steps, not shadows.

## Shapes

Corners: 4px small (status chips), 8px buttons and inputs ({rounded.md}), 12px cards ({rounded.lg}), pill for preset chips and toggles. No rounded-* above 12px on marketing chrome. Borders are always 1px hairline slate; the accent never draws a border except as a focus ring.

## Components

### Buttons
- **Primary (`button-primary`):** Gold fill, on-gold text, 8px radius, 11px/20px padding, 600 weight. One per view.
- **Ghost (`button-ghost`):** Transparent with hairline border, ink text; border shifts gold on hover.

### Cards / Containers
- **Card (`card`):** Card slate fill, hairline border, 12px radius, 22px padding. CTA panels and calculator panels.
- **Callout (`callout`):** Gold-soft tinted panel, 8px radius, 12px/16px padding, no border bar. Used for honesty notes.

### Inputs / Fields
- **Text input (`text-input`):** Canvas-dark fill, hairline border, 8px radius, 10px/12px padding. Focus: gold outline.

### Chips
- **Preset chip (`chip`):** Hairline pill, dim text; selected state = gold border + gold text.

### Navigation
- **Top nav (`top-nav`):** Brand bold left, quiet dim links right, hairline rule below. 14px.

### Footer
- **Footer (`footer`):** Hairline rule above, dim 13px text, plain separator dots.

## Do's and Don'ts

### Do
- **Do** keep body copy at 16px/1.65 in the 720px column (65–75ch).
- **Do** give headings more space above than below (h2: 38px above, 10px below).
- **Do** use gold-tinted panels for callouts instead of border-left bars.
- **Do** keep one primary CTA per view; everything else is ghost.
- **Do** theme focus rings, selection, and active states from the palette.

### Don't
- **Don't** use gold as a section background or card fill.
- **Don't** place eyebrows/kickers above headings.
- **Don't** use border-left or border-right bars above 1px on callouts and cards.
- **Don't** introduce a second chromatic accent; green/red are for P&L values only.
- **Don't** ship drop shadows, gradients, or glass on the marketing canvas.
- **Don't** set article headlines in Playfair; the serif is for brand moments, not working text.

## Responsive Behavior

- Calculator grid: 2-column above 760px, single column below.
- Reading column stays 720px at every width; padding shrinks to 20px on mobile.
- H1 scales by clamp (1.7rem→2.5rem); no layout jumps.
- Touch targets: buttons ≥40px height; inputs ≥40px; chips ≥30px.

## Known Gaps

- The three app variants (linear/gold/mono × light/dark) are tokenized in `src/index.css`; this file documents the public marketing surface and the Gold brand identity. Full app-variant documentation is future work.
- The `linear` variant's reference inspiration is preserved at `docs/DESIGN-Linear-Analysis.md`.
- Light mode exists only in the app variants, not on marketing pages — marketing ships dark only.
