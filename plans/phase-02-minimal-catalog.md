# Phase 2 — Minimal catalog

Umbrella: [implementation plan index](./README.md).  
Status: ready to execute.  
Depends on: the existing application shell and shared design primitives.

## Goal

Replace the `/catalog` placeholder with the smallest useful product catalog and establish the
final product data contract that the creator, geometry engine, and WebMCP tools will reuse. This
phase proves data quality, browse and detail routing, and deterministic catalog queries; it does
not attempt the final catalog depth or editor integration.

## Product outcome

A visitor can browse a compact set of fictional home-gym products, narrow it with simple URL-based
filters, open a product page, and understand both the equipment footprint and the extra space it
needs for safe use.

## Scope

1. Add Zod as the runtime schema dependency and define the canonical product schema.
2. Add 8–12 fictional products covering racks, benches, cardio, weights, and accessories.
3. Parse the entire static dataset at module load so invalid product data fails loudly.
4. Add pure catalog query helpers for lookup, text search, and the initial filters.
5. Build the `/catalog` Server Component browse page with a responsive product grid.
6. Add `/catalog/[slug]` product detail pages with missing-slug handling and static metadata.
7. Add focused tests for schemas, dataset invariants, queries, and non-trivial presentation logic.

## Out of scope

- The final 30–50-product catalog, polished imagery, comparison, sorting, pagination, inventory,
  checkout, or real prices.
- Filtering by every final data field; Phase 9 adds the complete filter surface.
- The creator-side catalog panel, drag-and-drop, placement, budget calculation, or project state.
- WebMCP registration and tool handlers; Phase 4 consumes the queries established here.
- Introducing a general component library beyond the existing primitives.

## Data contract

The schema is the single source of truth and must have an unambiguous JSON Schema representation
for later WebMCP reuse. Infer TypeScript types from Zod rather than maintaining parallel
interfaces.

The canonical `Product` record must cover fields already committed in the product concept and
technical architecture:

- stable `id`, unique URL-safe `slug`, `name`, fictional `brand`, `category`, short description,
  and integer price in PLN,
- integer-centimetre `dimensions` with width, depth, and height,
- integer-centimetre `clearance` on front, back, left, and right,
- exercises, training goals, and muscle groups,
- optional weight and maximum load where meaningful,
- requirements for minimum ceiling height, anchoring, flooring, and assembly where meaningful,
- constraints or safety notes needed to explain suitability.

Use finite enums or literal unions for fields that drive filters or later tool schemas. Use
optional fields only when the concept genuinely does not apply to a category. Reject unknown keys
so typos in seed data cannot silently become part of the contract.

Dataset invariants beyond single-record validation:

- IDs and slugs are unique.
- Every required category is represented.
- Prices and dimensions are positive integers; clearance values are non-negative integers.
- Search/filter vocabulary uses normalized canonical values rather than display-label variants.
- Data and UI copy remain fictional and in English.

## Initial query contract

Keep queries pure and independent of React or Next.js so Phase 4 can call the exact same functions.
The initial query object should support:

- free-text search across name, brand, category, exercises, and training goals,
- category,
- maximum price,
- training goal.

Normalize whitespace and case. Missing filters return the full dataset. Unknown categories or
goals and invalid numeric values should follow one predictable, tested policy; route parsing must
never throw on a user-edited URL. Multiple filters form an intersection, ordering is stable, and
lookup by slug returns one product or `undefined`.

## Planned structure

Exact filenames may adjust to nearby code during implementation, but responsibilities should land
under these boundaries:

```text
src/
├── app/catalog/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── data/products/
│   └── products.ts
└── features/catalog/
    ├── components/
    ├── queries/
    └── schemas/
```

Keep route files focused on parsing route inputs, metadata, and composition. Dataset parsing and
query behavior belong in feature modules, not in page components.

## Implementation sequence

### 1. Establish schema and vocabulary

- Install the repository-selected current Zod version and confirm the JSON Schema API that Phase 4
  will rely on.
- Define category, training-goal, and requirement vocabularies before authoring data.
- Define and export the schema and inferred types.
- Test a complete valid product and representative failures: bad slug, fractional dimensions or
  price, negative clearance, invalid enum value, and unknown keys.

Acceptance:

- One schema describes the full planned product shape.
- Invalid spatial or commercial data fails with useful Zod issues.
- No hand-written `Product` interface can drift from runtime validation.

### 2. Add and validate the seed catalog

- Author 8–12 coherent fictional products across the required categories.
- Parse the collection once and export only validated, readonly data.
- Add collection-level invariant checks and tests for unique IDs/slugs and category coverage.
- Include the rack, bench, barbell/weights, and at least one compact cardio option needed by the
  future demo scenario.

Acceptance:

- Importing the catalog yields only validated products.
- The seed set supports the example strength-plus-cardio scenario without pretending to be the
  final catalog.

### 3. Build reusable catalog queries

- Implement lookup by slug and a single search/filter entry point.
- Normalize text consistently and make multi-filter behavior an intersection.
- Return deterministic ordering based on dataset order or one explicit stable sort.
- Test each filter alone, combined filters, normalization, no matches, empty input, and slug lookup.

Acceptance:

- The UI and future WebMCP handlers can consume the same query API.
- Query results are deterministic and input data is never mutated.

### 4. Replace the catalog placeholder

- Render a Server Component heading, concise explanation, filter form, result count, active-filter
  state, responsive grid, and useful empty state.
- Encode filters in the URL so direct visits, refresh, and browser navigation preserve them.
- Reuse `Card`, button styles, and existing semantic tokens.
- Show name, category, price, physical dimensions, and a compact clearance summary on each card.
- Preserve the catalog's secondary role relative to the creator.

Acceptance:

- A visitor can submit and clear filters without client-side application state.
- Every result links to its canonical product URL.
- Keyboard navigation and visible labels work without relying on images or color alone.

### 5. Add product detail routes

- Add `/catalog/[slug]` as a Server Component route.
- Return `notFound()` for an unknown slug and provide static params if it materially improves the
  build without duplicating data access.
- Generate product-specific title and description metadata from validated data.
- Present footprint, clearance by side, price, supported exercises/goals, and requirements in a
  readable hierarchy, with paths back to the catalog and onward to the creator.

Acceptance:

- Every seed product has a buildable detail page.
- Unknown slugs use the application 404 behavior rather than throwing.
- Detail content comes from the canonical validated record.

### 6. Close the phase

- Inspect the route in narrow and wide layouts.
- Check URLs with valid, empty, unknown, and malformed filters.
- Run the validation ladder and update this plan only if implementation evidence changes a recorded
  decision.

## Verification

Run the narrowest relevant tests during implementation, then the complete phase gates:

```bash
npm test -- src/features/catalog
npm run quality:quick
npm run agent:verify
npm run build
```

Manual checks:

- `/catalog` renders all seed products with no query string.
- Each initial filter works alone and in combination, survives refresh, and can be cleared.
- A no-results query explains the state and offers recovery.
- Every product card opens the matching detail page.
- A made-up slug shows the normal not-found experience.
- Pages remain legible at mobile and desktop widths and show no runtime warnings.

## Exit gate

Phase 2 is complete only when the final schema, validated seed data, reusable query API, browse
route, filters, and detail routes pass focused tests, `npm run agent:verify`, and `npm run build`.
Then remove Phase 2 from the active implementation index and delete this file; Git history keeps
the implementation record.

## Risks and controls

| Risk | Control |
|---|---|
| Seed-data work expands into Phase 9 | Stop at 8–12 records and the categories required by the demo. |
| UI-specific filters make Phase 4 duplicate logic | Keep normalization and filtering in pure feature queries. |
| The schema is too shallow for placement | Lock dimensions and per-side clearance now, plus the already-agreed requirement fields. |
| The schema becomes speculative | Add only fields committed by product/architecture documents; defer merchandising extras. |
| Route files accumulate domain logic | Keep route input parsing and composition thin; test feature modules directly. |
