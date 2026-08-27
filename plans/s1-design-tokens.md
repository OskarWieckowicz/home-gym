# S1 — Design tokens and shared components

Umbrella: [implementation plan](../docs/IMPLEMENTATION_PLAN.md) § Design system and slice S1.

## Goal

Replace the leftover dark-placeholder look with the mockup palette, then restyle the existing shell. No new routes, no new product behavior.

## Scope

1. Semantic color (and card shadow) tokens in `src/app/globals.css`, mapped through Tailwind v4 `@theme inline` so utilities and SVG `var(--*)` share one source.
2. Button styles used by both `<button>` and `LinkButton`; a `Card` primitive for surfaces.
3. Restyle header, footer, hero, and the catalog/creator placeholders to consume those primitives.
4. Put the existing static `HeroPlanSketch` in the hero so clearance (blue) and a tight-space warning (amber) are visible without the editor.

## Out of scope

Landing-page sections 2–6, section-anchor nav, catalog grid, editor chrome, shadcn/ui installation.

## Tokens

| Token | Role | Value |
|---|---|---|
| canvas | page background | slate-50 `#f8fafc` |
| surface / surface-muted / line | cards, muted fills, borders | white, slate-100, slate-200 |
| ink / ink-muted / ink-subtle | headings, body, captions | slate-900, slate-600, slate-500 |
| brand / brand-strong / brand-soft / brand-muted | accent, hover, selected UI | blue-600/700/50/100 |
| success / success-soft | fits the project | emerald-600/50 |
| caution / caution-soft | needs more space, warnings | amber-600/50 |
| footprint | equipment solids | slate-700 |
| clearance / clearance-soft | clearance zones | blue-500, 18% fill |
| select / select-soft | selected plan item | amber-500/50 |

## Done when

- Header, footer, hero, `/catalog`, and `/creator` read as the light mockup shell.
- `npm run agent:verify` passes. `npm run build` if routing or layout boundaries change (layout already imports `globals.css`; restyle only).
