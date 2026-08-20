# ADR 007 — Visual Identity & Theme System

**Status:** Accepted
**Date:** Post-Phase 7

## Context

The master plan (§47) calls for a visual direction that feels "modern, quiet,
focused, premium, minimal, fast, technical without looking like an admin panel"
with intentional inspiration from Linear, Raycast, Notion, Arc, Vercel, and
Craft. It also requires (§48) that dark mode be "designed intentionally rather
than produced by simple color inversion" and (§49) that the app use semantic
design tokens rather than hard-coded colors.

The initial Phase 0 theme used a neutral slate palette with no brand identity.
## Decision

Introduce a **purple/cyan brand identity** with a dedicated `LexoraMark`
component and a redesigned token system.

### Brand mark

`src/components/brand/lexora-mark.tsx` — an SVG mark with a purple-to-cyan
linear gradient (`#8b5cf6` → `#22d3ee`) on a rounded square, forming a
stylized "L" with a secondary stroke. Used in the sidebar header and auth
layout. An `icon.svg` is registered at the app root for favicon support.

### Theme tokens

The HSL token palette was redesigned (in `src/app/globals.css`):

- **Primary**: purple (`252 78% 55%` light, `258 100% 72%` dark) — used for
  active nav items, focus rings, and primary buttons.
- **Accent**: light purple tint — used for hover states.
- **Surfaces**: warm white with subtle purple/cyan radial gradients on the
  body background (fixed attachment). Dark mode uses deep indigo surfaces.
- **Border**: purple-tinted neutral, softer than pure gray.
- **Radius**: increased to `0.75rem` for a softer, more premium feel.

### Sidebar redesign

- Width increased to `w-64`, with `backdrop-blur-xl` on a semi-transparent
  surface.
- Active nav items use `bg-primary` with a colored shadow.
- User avatar uses `rounded-xl` with a primary-colored shadow.
- Brand mark in the header replaces the plain text "Lexora".

## Rationale

- Purple/cyan is distinctive without being flashy — fits "premium, minimal,
  technical."
- Radial gradient backgrounds add depth without distracting from content.
- Intentional dark mode: dark surfaces shift to deep indigo (not inverted
  gray), and the primary shifts to a lighter purple for contrast.
- Semantic tokens are preserved — all components use `bg-surface`,
  `text-muted-foreground`, etc., so the palette can be re-tuned in one place.

## Consequences

- All theme changes live in `:root` and `.dark` in `globals.css` — no
  hard-coded colors in components.
- The `LexoraMark` component is the single source of truth for the brand
  visual; it accepts `label` and `className` props.
- Writing-issue decoration colors (§8) remain category-specific and are not
  affected by the brand palette.
