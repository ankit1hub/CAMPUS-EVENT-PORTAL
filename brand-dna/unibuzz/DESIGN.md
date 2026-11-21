# UNIBuzz Editorial Campus Hub — Design System & Visual Guidelines
*Derived from Brand DNA: Modern Tactile Minimalism*

## 1. Palette: Curated Foundation
- **Canvas / Ground (`--bg-canvas`):** `#FAF8FF` / `#FFF3E3` — Warm, tactile presence with soft contrast against clinical white backgrounds.
- **Surface / Cards (`--bg-surface`):** `#FFFFFF` / `#FAF8FF` — Crisp elevated surfaces bordered with subtle 1px frames.
- **Surface Containers:**
  - `surface-container-lowest`: `#FFFFFF`
  - `surface-container-low`: `#F3F2FF`
  - `surface-container`: `#EDEDFA`
  - `surface-container-high`: `#E7E7F4`
  - `surface-container-highest`: `#E1E1EE`
- **Primary / Accent (`--primary` / `--accent`):** `#9FA0FF` (Digital Periwinkle) & `#5354AD` (Deep Periwinkle) — Powers active navigation items, high-priority action buttons, and prominent triggers.
  - `on-primary`: `#FFFFFF`
  - `primary-container`: `#9FA0FF`
  - `on-primary-container`: `#32328A`
- **Secondary / Soft Mint (`--secondary`):** `#D5E8E6` / `#506260` — Cool, refreshing pale mint used for subtle structural frames, 1px separation lines, secondary button surfaces, chip backgrounds, and ambient badge containers.
  - `secondary-container`: `#D3E6E4`
  - `on-secondary-container`: `#566866`
- **Alert / Action / Coral (`--accent-rose` / `--error`):** `#FF7171` / `#BA1A1A` — High-energy coral for urgent campus alerts, live status indicators, sell-outs, destructive operations, and active bookmark/favorite toggles.
  - `tertiary`: `#AB3337`
  - `tertiary-container`: `#FF8583`
- **Neutral Deep Slate (`--text-main`):** `#1E2029` / `#191B24` — Primary ink ensuring absolute legibility across titles, figures, and high-density typography.
  - `on-surface-variant`: `#464651`
  - `outline`: `#777683`
  - `outline-variant`: `#C7C5D3` (1px frames & hairlines)

## 2. Typography
- **Headings & Dynamic Display:** `Plus Jakarta Sans`, sans-serif.
  - Display: 3.5rem (mobile: 2.25rem), weight 800, line-height 4rem, tracking -0.03em.
  - Headline-lg: 2.25rem (mobile: 1.75rem), weight 700, line-height 2.75rem, tracking -0.02em.
  - Headline-md: 1.5rem, weight 700, line-height 2rem, tracking -0.01em.
  - Headline-sm: 1.25rem, weight 600, line-height 1.75rem.
- **Body & Operational Data:** `Inter`, sans-serif.
  - Body-lg: 1.125rem, weight 400, line-height 1.75rem.
  - Body-md: 1rem, weight 400, line-height 1.5rem.
  - Body-sm: 0.875rem, weight 400, line-height 1.25rem.
  - Label-lg: 0.875rem, weight 600, tracking 0.01em.
  - Label-md: 0.75rem, weight 600, tracking 0.02em.
  - Label-sm: 0.6875rem, weight 500, tracking 0.03em.

## 3. Shapes & Spacing
- **Radii:**
  - `rounded-sm`: 4px (0.25rem)
  - `rounded-md`: 12px (0.75rem) — standard buttons, input controls, chips
  - `rounded-lg`: 16px (1rem) — event cards, modular containers, modal sheets
  - `rounded-xl`: 24px (1.5rem)
  - `rounded-full`: 9999px — badges, status pills, filter toggles
- **Spacing Steps:**
  - `space-xs`: 4px (0.25rem)
  - `space-sm`: 8px (0.5rem)
  - `space-md`: 16px (1rem)
  - `space-lg`: 24px (1.5rem)
  - `space-xl`: 40px (2.5rem)

## 4. Components & Buttons Format (Preserved)
- **Primary Button (`.btn-primary`):** Solid `#9FA0FF` fill, `#1E2029` text, `rounded-md` (12px). Hover state deepens with subtle 1px border. Focus ring uses a 2px offset ring colored `#9FA0FF`.
- **Secondary Button (`.btn-secondary`):** `#D5E8E6` fill, `#1E2029` text, 1px border in `#D5E8E6`. Hover shifts surface contrast with crisp transitions.
- **Urgent / Cancel Action:** `#FF7171` background, `#FFF3E3` text, rounded at 12px.
- **Event Cards:** Elevated surface with continuous 1px `#D5E8E6` (or `#C7C5D3`) border, 16px border-radius, soft elevation `0 8px 30px rgba(30, 32, 41, 0.06)`, and hover lift `translateY(-2px)`.
- **Chips & Filter Pills:** Unselected has faint `#D5E8E6` background and border; selected has `#9FA0FF` background with `#1E2029` bold label.
