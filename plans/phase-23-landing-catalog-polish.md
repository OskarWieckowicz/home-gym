# Phase 23 — Landing page and catalog polish

> Order 1 in the [active queue](README.md). Depends on Phase 16 for final product assets.
> Phase 26 demo and Phase 27 primary 3D editor are implemented. Blocks Phase 24.

## Problem

`src/app/page.tsx` implements only the hero section from
[the landing specification](../docs/LANDING_PAGE.md). The hero exists with both start-mode CTAs and a
procedural `HeroPlanSketch`; "How it works", the differentiator, the sample scenario, the capability
list and the closing CTA are all missing, and the header's "How it works" link points at `/` with no
anchor to land on. The catalog page and product detail page are functionally complete — filters,
cards, empty state, WebMCP bridge and mapped product-detail images. Unmapped products still render
"Product image coming later", and the project summary sidebar remains a static placeholder.

## Scope

In scope: the five missing landing sections, replacing the placeholder hero visual with real demo
imagery, aligning copy with the specification, catalog image coverage or an explicit fallback
decision shared by cards and the existing detail-page image surface.

Out of scope: new catalog products, changes to filters or catalog queries, a working sort control, a
live project summary in the catalog sidebar, and any change to the creator, the domain layer or the
WebMCP tools.

## Decisions

**D1 — figures come from the built product, not from the specification.** `docs/LANDING_PAGE.md`
now records the Phase 26 baseline: four products and PLN 8,596. The checked-in demo project from
Phase 26 is the real thing. Derive every number on the page from that project's actual contents and
state them once; if they disagree with the doc, the doc is what changes.

**D2 — one real screenshot beats three synthetic ones.** The hero and the sample scenario use
captures of the Phase 26 demo project in the Phase 27 primary 3D editor, showing the layout and its validation
warning. An in-editor activity feed is not required. `HeroPlanSketch` stays in the repository as the
fallback only if a real capture cannot be produced; it is not the shipped hero when a capture is available.

**D3 — every missing photo needs an explicit fallback decision.** Every current catalog product
either has an image or is recorded as an intentional fallback with a reason. Replace remaining
"Product image coming later" copy with a neutral category-shaped placeholder on cards and detail
pages. Do not expand the approved generation queue to fill every gap.

**D4 — the catalog sidebar placeholder is cut, not faked.** A static "Build your room first" panel
that never updates is worse than no panel. Either remove it or turn it into a link into the creator.
Wiring real project state into a server-rendered catalog page is out of scope.

**D5 — no new dependency and no new layout system.** The sections use the existing Tailwind v4 setup,
the `Card` and `LinkButton` primitives, and the tokens already in `globals.css`.

## Implementation tasks

1. **Landing sections.** Extend `src/app/page.tsx` with sections 2 to 6 from the specification. Put
   each section in its own component under `src/components/landing/` rather than growing `page.tsx`
   past a comfortable size:

   - "How it works" with a stable `id` so `headerLinks` can anchor to it, three steps: describe the
     space, set goals and budget, design together with an agent.
   - The differentiator: physical fit, safe exercise space and budget analysed together.
   - The sample scenario: the demo room, its obstacle, its budget and goals, the resulting product
     count, total cost and coverage per D1, with the "Open this project" CTA already defined as
     `siteLinks.openSampleProject`.
   - Creator capabilities: room and obstacle editing, drag and rotate, validation, clearance
     visualisation, 2D and 3D, shared editing with an agent.
   - The closing CTA using `siteLinks.designMyGym`.

2. **Fix the navigation link.** Point the header's "How it works" entry at the new anchor in
   `src/lib/navigation.ts` and confirm it works from `/catalog` and `/creator`, not only from `/`.

3. **Align hero copy.** Match the specification's headline and the "Launch sample project" CTA label,
   or update the specification if the current wording is preferred. One of the two must move; the
   mismatch cannot survive into submission.

4. **Real imagery.** Capture the Phase 26 demo project in the primary 3D editor, replace the hero visual with
   a real capture, and illustrate the sample scenario with the layout and validation panel. Record
   the captures' provenance. Use `next/image` with
   explicit dimensions, meaningful alt text and appropriate priority on the hero image so the largest
   contentful paint does not regress.

5. **Missing-photo presentation.** The separate [photo queue](phase-16-catalog-images.md) contains
   only Foundry Bumper Plates and resumes at the user's request. Current Fold Bike and Quarry
   Power Bar already have mapped photos. Apply D3 to other unmapped products and record intentional
   fallbacks; keep cards and the existing detail-page image block consistent. Update mappings and
   regression tests together when coverage changes.

6. **Sidebar decision.** Apply D4 to `catalog-project-summary.tsx`.

7. **Stale facts.** Reconcile catalog totals in documentation against the current seed data,
   rather than retaining old hard-coded product counts.

## Acceptance criteria

- All six specification sections render on `/`, in order, and read coherently on a phone-width and a
  desktop-width viewport.
- Every landing CTA resolves to the correct start mode and the demo CTA opens the same project the
  sample scenario describes.
- Every number stated in the sample scenario matches the checked-in demo project.
- The hero and sample scenario use real captures of the finished product.
- "How it works" scrolls to its section from every page in the header.
- Every catalog card and every detail page either shows a product image or a deliberate placeholder,
  and the intentional fallbacks are recorded with reasons.
- No image is committed without recorded provenance and a clear license, per the repository rule on
  visual assets.
- The catalog filters, the empty state and the two catalog WebMCP tools behave exactly as before.

## Tests

- `src/app/page.test.tsx` — extend for the presence of each section, its heading, and each CTA's
  href, including the anchor target.
- `src/lib/navigation.test.ts` — extend for the corrected "How it works" href.
- `src/features/catalog/product-assets.test.ts` — extend to assert that every catalog product ID is
  either mapped to an existing file or listed in an explicit fallback set, so a new product cannot
  silently ship without a decision.
- `src/app/catalog/[slug]/page.test.tsx` — update existing image/fallback assertions for D3.
- New landing section components get focused rendering tests only where they contain logic; static
  copy blocks do not need one each.

## Manual checks

Open the deployed build logged out at phone, tablet and desktop widths. Confirm image loading does
not shift layout, confirm the hero image is not lazy-loaded, and click every CTA.

## Exit gate

All acceptance criteria hold, `npm run agent:verify` passes, and `npm run build` passes because
routing and page composition changed. Delete this file and its index row afterwards, and delete
`phase-16-catalog-images.md` if its queue is empty by then.
