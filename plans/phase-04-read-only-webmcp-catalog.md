# Phase 4 — Read-only WebMCP over the catalog

Umbrella: [implementation plan index](./README.md).

Status: implemented and validated locally; the Chrome-specific matrix remains before the phase
exit gate is closed.

Depends on: Phase 2 catalog queries and schemas; Phase 3 WebMCP implementation contract.

Primary output: route-scoped `search_products` and `get_product_details` tools over the existing
fictional catalog.

## Goal

Prove the smallest useful WebMCP integration before mutable room state exists. On catalog routes,
a supported browser can discover two read-only tools, call them with runtime-validated arguments,
and receive compact structured results sourced from the same catalog queries used by the site.
Unsupported browsers keep the complete manual catalog experience and show a clear, non-blocking
fallback.

This phase proves registration, schemas, handlers, results, cleanup, typing, and local browser
behavior. Phase 5 owns discovery and successful calls from a supported agent environment, public
deployment, and any hosting-specific configuration.

## Starting point and dependency note

- `searchProducts` already provides deterministic query, category, maximum-price, and
  training-goal filtering without mutating the catalog.
- `findProductBySlug` and the validated, deeply frozen catalog already support product lookup and
  details pages.
- `/catalog` and `/catalog/[slug]` are Server Component routes. No WebMCP client boundary or
  browser-global typing exists yet.
- The repository still lists Phase 3 as ready to execute, while `WEBMCP_SOURCES.md` still ends with
  unchecked implementation questions. The user has completed the theory, but the written handoff
  must be reconciled before the first production code change so Phase 4 does not silently choose
  between incompatible API versions.

## Fixed implementation decisions

1. Use the Imperative API exposed at `document.modelContext`; do not create an HTTP, SSE, stdio, or
   backend MCP path.
2. Register both catalog tools only under the `/catalog` route segment. Keep the page and product
   detail routes as Server Components and add the smallest possible Client Component bridge in a
   catalog layout.
3. Use one `AbortController` per mounted bridge. Pass its signal to every `registerTool` call and
   abort it during cleanup, failed partial registration, route exit, and React Strict Mode remount.
4. Keep WebMCP browser types local to the adapter surface instead of globally claiming a DOM API
   shape that may change. Revisit an official type package only if the Phase 3 handoff records it
   as the verified current choice.
5. Define strict Zod input schemas specifically for tools. Generate their JSON Schemas with
   `z.toJSONSchema()` and still validate every `execute` input with `safeParse`.
6. Reuse catalog query functions for behavior, but do not reuse their permissive URL parsing as
   tool validation. Invalid tool arguments must return a stable error instead of being ignored.
7. Mark both tools with `annotations: { readOnlyHint: true }` and return only JSON-serializable
   application data.
8. Use stable success and error envelopes. Do not expose raw Zod issues, stack traces, or browser
   exception text to the agent.
9. Do not add `navigator.modelContext`, declarative form tools, mutable state, a WebMCP polyfill,
   secrets, analytics, or a second catalog implementation.

## Tool contracts

### `search_products`

Purpose: search the canonical catalog by the same semantics used by the manual catalog.

Input fields, all optional:

- `query`: trimmed non-empty text with a documented upper length bound, searched across the
  existing searchable product fields,
- `category`: the existing `PRODUCT_CATEGORIES` enum,
- `maxPrice`: a non-negative integer in PLN,
- `trainingGoal`: the existing `TRAINING_GOALS` enum.

Unknown keys and invalid values are rejected. An empty object returns the complete starter catalog.
The successful result contains:

- `ok`, `tool`, and normalized `filters`,
- `matchCount`,
- compact product summaries with `productId`, `slug`, `name`, `brand`, `category`, `price`,
  dimensions, training goals, and exercises,
- an explicit empty `products` array when there are no matches.

The result must be small enough to chain into `get_product_details` without returning every optional
constraint and requirement for every match.

### `get_product_details`

Purpose: retrieve the complete validated catalog record for one product returned by
`search_products`.

Input:

- required `productId`, using the catalog's canonical product ID rather than accepting ambiguous
  ID-or-slug alternatives.

The successful result contains `ok`, `tool`, and the complete product record. A syntactically
invalid ID returns `INVALID_INPUT`; a valid but unknown ID returns `PRODUCT_NOT_FOUND`.

### Stable errors

Handler-level failures use this bounded contract:

- `ok: false`,
- `tool`,
- `error.code`: `INVALID_INPUT`, `PRODUCT_NOT_FOUND`, or `EXECUTION_FAILED`,
- a concise `error.message`,
- optional field-level issue entries containing only stable paths and project-authored messages.

Registration and feature-detection failures are UI state, not fabricated tool results, because no
callable tool exists when registration did not complete.

## Expected file map

The exact split may change to satisfy the 500-line guard, but responsibilities should remain:

```text
src/app/catalog/
└── layout.tsx                         route-scoped server layout
src/features/webmcp/
├── components/
│   └── catalog-webmcp-bridge.tsx      client lifecycle and visible fallback
├── catalog-tool-handlers.ts           pure handler factories over catalog queries
├── catalog-tool-results.ts            summaries and stable result/error envelopes
├── catalog-tool-schemas.ts            strict Zod inputs and JSON Schema projections
├── register-catalog-tools.ts          two definitions and registration orchestration
└── types.ts                           narrow local WebMCP adapter types
```

Add colocated focused tests for schemas, handlers/results, registration, and the bridge. The
current test environment is Node-only, so add React Testing Library and `jsdom` as development
dependencies and opt only the bridge test into `jsdom`; do not move the entire suite into a browser
environment. Extend the existing catalog query tests only if lookup behavior changes.

## Implementation sequence

### 1. Reconcile the Phase 3 handoff

- Replace the unchecked implementation list in `WEBMCP_SOURCES.md` with a dated decision table:
  document API, async registration, cleanup, execution callback, supported JSON Schema subset,
  result serialization, annotations, typing, secure-context constraints, and phase ownership.
- Separate facts verified from current primary sources from local project choices.
- Assign only real-environment discovery, public hosting, origin-trial/header behavior, and
  pre-submission availability refreshes to Phase 5.
- Once its exit gate is actually reflected in the repository, remove Phase 3 from the active index
  and delete its detailed plan according to the repository planning convention.

Acceptance:

- No API-shape question needed to write Phase 4 code remains as a free-floating checkbox.
- Every remaining unknown has a concrete Phase 4 or Phase 5 experiment and a safe fallback.

### 2. Add strict tool schemas and JSON Schema projections

- Define separate Zod object schemas for the two tools and keep them strict.
- Reuse catalog enums rather than copying their values.
- Export inferred input types and generated JSON Schemas through a WebMCP-facing module.
- Map Zod failures into the stable application error shape.

Acceptance:

- Unknown keys, wrong types, invalid enum values, fractional or negative prices, blank queries, and
  missing product IDs are rejected predictably.
- Generated object schemas have `additionalProperties: false`, expected required fields, field
  descriptions where the runtime preserves them, and no unsupported Zod construct.
- No handler trusts the advertised JSON Schema as runtime validation.

### 3. Add catalog lookup and result mappers

- Add a deterministic `findProductById` query beside `findProductBySlug` if the handler cannot
  reuse an equally clear existing function.
- Build compact search summaries and complete detail results from canonical `Product` values.
- Ensure result construction does not mutate or leak mutable references from the frozen catalog.
- Keep messages in English because the application and submission are English-first.

Acceptance:

- Search results preserve canonical catalog order and match existing manual filter semantics.
- Empty search results are successful and distinguishable from errors.
- Detail lookup distinguishes malformed input from a missing product.
- Every success and error result can be passed through `JSON.stringify`.

### 4. Implement pure tool handlers

- Create handler factories whose only dependencies are catalog query functions or a narrow catalog
  service, making them testable without DOM or React.
- Validate `unknown` input before executing catalog logic.
- Catch unexpected internal failures and return `EXECUTION_FAILED` without exposing internals.
- Check an execution `AbortSignal` if the verified callback contract supplies one; do not confuse
  execution cancellation with registration cleanup.

Acceptance:

- Direct unit calls cover valid, empty, invalid, not-found, and unexpected-failure paths.
- Both handlers use the same source data and query behavior as the manual catalog.
- Handlers have no React, Next.js, network, localStorage, or backend dependency.

### 5. Register both tools with explicit lifecycle ownership

- Define atomic tool metadata with unambiguous names, positive descriptions, strict input schemas,
  handlers, and `readOnlyHint`.
- Implement feature detection against a narrow local `Document`/`ModelContext` adapter type.
- Register the pair asynchronously with one supplied `AbortSignal`.
- Treat partial registration as failure and abort the controller so the page never advertises a
  half-working catalog contract.
- Make expected aborts during cleanup quiet; map duplicate-name, security, and other registration
  failures to an internal status for the UI.

Acceptance:

- Exactly two unique tools are registered on a successful catalog mount.
- Both registrations receive the same lifecycle signal and both definitions are read-only.
- Cleanup removes the tools on catalog route exit and prevents duplicate-name failures on React
  Strict Mode remount.
- Unsupported or rejected registration never crashes rendering or manual catalog use.

### 6. Add the route-scoped Client Component bridge and fallback

- Add a catalog segment layout that renders a small Client Component bridge without converting
  the catalog pages or product data pipeline into Client Components.
- Keep the bridge visually silent while checking and after successful registration unless a small
  ready indicator materially helps manual verification.
- On unsupported API or registration failure, render an accessible, non-blocking message such as:
  “Agent catalog tools are unavailable in this browser. You can still browse and filter manually.”
- Use `aria-live="polite"` for the final status and avoid presenting a server-rendered unsupported
  state before hydration.

Acceptance:

- `/catalog` and direct `/catalog/[slug]` loads attempt registration only after hydration.
- Navigating outside the catalog scope triggers cleanup.
- The fallback explains the limitation and the working manual path without blocking content.
- Existing metadata, filtering, static params, and product detail rendering remain server-driven.

### 7. Verify the complete local slice

Run the narrowest tests after each module, then:

```bash
npm test -- src/features/webmcp
npm test -- src/features/catalog
npm run quality:quick
npm run lint:report
npm run agent:verify
npm run build
```

The production build is required because this phase adds a route layout and a Server/Client
Component boundary.

Manual checks in an ordinary unsupported browser:

- catalog listing, URL filters, details links, and direct detail URLs still work,
- the fallback appears only after client feature detection and does not cause hydration errors,
- no uncaught `modelContext` error appears in the console.

Manual checks in the locally supported Chrome environment recorded by Phase 3:

- a fresh `/catalog` load exposes exactly `search_products` and `get_product_details`,
- direct `/catalog/[slug]` load exposes the same pair,
- valid search, empty results, product details, invalid input, and unknown product calls return the
  planned envelopes,
- navigation within the catalog does not create duplicates,
- navigation outside the catalog removes the tools, and returning registers one fresh pair,
- hard refresh behaves like a clean registration.

Do not require a Codex/ChatGPT agent call or public URL to close this phase; those are Phase 5's hard
gate.

## Test inventory

### Unit tests

- input schema acceptance/rejection and selected JSON Schema properties,
- stable Zod issue mapping,
- search success with no filters and combined filters,
- empty search success,
- complete detail success,
- malformed and unknown product IDs,
- unexpected handler failure redaction,
- tool names, descriptions, annotations, schemas, and handler wiring,
- registration success, shared signal, partial failure cleanup, and unsupported feature detection,
- bridge unsupported/failed fallback, successful silent state, stale-promise guard, and unmount
  abort in a per-file `jsdom` environment.

### Existing regression coverage to preserve

- catalog data schema and invariants,
- catalog query normalization, filtering, order, and immutability,
- catalog route and product detail behavior,
- global lint, type, duplicate, file-size, test, and build gates.

### Manual-only in Phase 4

- actual browser discovery after hydration,
- cleanup across App Router navigation and hard reload,
- fallback appearance in a browser without WebMCP,
- compatibility with the exact local Chrome version/flag recorded in Phase 3.

## Scope boundary

Out of scope for Phase 4:

- room/project/store tools or any mutation,
- undo/redo, activity feed, localStorage, or creator state,
- declarative WebMCP forms,
- agent evals, prompt tuning, or a full multi-tool room scenario,
- public deployment, origin trial enrollment, hosting headers, or judge-environment proof,
- expanding the catalog dataset or redesigning the catalog UI,
- backend MCP, API routes, authentication, database work, or secrets.

## Exit gate

Phase 4 is complete when:

1. `search_products` and `get_product_details` are registered only in the catalog route scope using
   the verified lifecycle contract.
2. Inputs are advertised as strict JSON Schema and independently validated by Zod at execution.
3. Valid, empty, invalid, missing-record, and unexpected-failure paths return stable,
   JSON-serializable results.
4. Unsupported and failed registration leave the manual catalog working and present a clear
   fallback.
5. Unit tests, `npm run quality:quick`, `npm run agent:verify`, and `npm run build` pass.
6. The local Chrome matrix passes fresh load, direct detail load, navigation cleanup, remount, tool
   invocation, and error checks.
7. Phase 5 has a concrete handoff containing the public URL requirement, supported agent
   environment, discovery prompts, expected calls, and any unresolved deployment experiment.

After the gate passes, remove Phase 4 from the active implementation index, delete this file, and
promote Phase 5 to a detailed plan. Git history remains the implementation record.

## Risks and controls

| Risk | Control |
|---|---|
| The browser implements a different draft than the written source map | Reconcile Phase 3 first; target verified runtime behavior and keep adapter types narrow. |
| React Strict Mode creates duplicate registrations | One controller per effect, signal-based cleanup, partial-failure abort, and remount tests. |
| URL parsing silently accepts bad agent arguments | Separate strict tool schemas from permissive route normalization. |
| Search results are too large or details too sparse for chaining | Compact summaries with canonical `productId`; full record only from the details tool. |
| A browser without WebMCP crashes or shows a false error during SSR | Feature detection only after hydration and a non-blocking client fallback. |
| Phase 4 expands into room-domain architecture | Keep both tools read-only and catalog-only; Phase 6 onward owns project state. |
| Local tests are mistaken for agent compatibility | Make Phase 5's real agent and public deployment gate explicit and mandatory. |
