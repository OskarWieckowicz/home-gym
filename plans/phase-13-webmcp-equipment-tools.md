# Phase 13 — WebMCP equipment tools in the creator

## Objective

Expose exactly four equipment capabilities on `/creator`: `search_products`, `place_product`,
`update_placement`, and `remove_product`. They must reuse the catalog query and the existing
placement commands/store so agent edits share UI state, deterministic validation, revision,
undo/redo, autosave, and project-v3 persistence with manual edits.

## Dependencies

- Phase 8 catalog WebMCP contract and verified client-side registration.
- Phase 12 deterministic equipment placement domain and creator UI.

## Scope boundary

Included: catalog search in the creator, placing one catalog product, moving and/or rotating one
placement, and removing one placement. `remove_product` receives a placement ID because multiple
placements may reference one product.

Excluded: product-detail registration in the creator, placement suggestions, candidate generation,
batch mutations, WebMCP undo/redo/import/export tools, activity feed, 3D assets, and UI redesign.

## Implementation tasks

1. Export and compose the existing canonical `search_products` definition into the creator tool
   set without changing catalog-route behavior.
2. Add strict runtime/JSON schemas for place, update, and remove inputs using the existing project
   placement schemas and canonical identifiers.
3. Add store-bound handlers which dispatch only `PRODUCT_PLACED`, `PLACEMENT_UPDATED`, and
   `PLACEMENT_REMOVED`; return detached placement metadata, revision, affected IDs, and
   current deterministic validation.
4. Register 14 unique creator tools atomically under the existing shared lifecycle signal.
5. Add schema, handler, registration, shared-editing, undo/redo, and persistence coverage.

## Acceptance criteria

- `search_products` works on `/creator` with its existing filters, ordering, compact results,
  read-only annotation, cancellation, and stable errors.
- Placement tools accept only canonical product/placement IDs, integer-centimetre positions, and
  rotations `0 | 90 | 180 | 270`; update patches are strict and non-empty.
- Unknown products/placements, malformed input, cancellation, and unexpected failures do not
  mutate state and return structured errors.
- Schema-valid but spatially invalid edits remain applied and return deterministic validation
  issues; handlers contain no duplicate geometry rules.
- Each changed call creates one revision and at most one shared undo step; no-op updates report
  `changed: false`; UI edits and agent edits can undo/redo each other.
- Creator registration contains exactly the existing ten room tools plus the four requested tools.

## Validation

1. Run narrow schema, handler, registration, creator-flow, and persistence tests.
2. Run `npm run quality:quick` after the coherent implementation slice.
3. Run `npm run lint:report` during cleanup if complexity warnings appear.
4. Run `npm run agent:verify` as the canonical gate.
5. Verify the supported runtime flow `search → place → read/validate → update → remove`, including
   visible editor changes and manual undo/redo. Record any environment limitation honestly.

Current runtime note: the local creator renders correctly in Chrome, but the available browser
session exposes neither `document.modelContext` nor a WebMCP capability, so a real browser-agent
tool call cannot be completed in this environment. The equivalent registered-tool integration flow
is covered end to end; this runtime check remains the only open exit-gate item.

## Exit gate

The phase is complete only when all four tools are discoverable and callable in the creator, the
shared store/history/persistence behavior is proven, the runtime scenario is checked, the canonical
local gate passes, and no non-test source/configuration file exceeds 500 physical lines. Then remove
this detailed plan and advance the queue to the 3D scene shell and squat-rack vertical slice.
