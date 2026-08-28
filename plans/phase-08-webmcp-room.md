# Phase 8 — WebMCP for the room

Umbrella: [implementation plan index](./README.md).

Status: ready to execute.

Depends on:

- Phase 4's verified `document.modelContext` registration, strict Zod-to-JSON-Schema inputs,
  plain result envelopes, lifecycle cleanup, and unsupported-browser fallback,
- Phase 5's successful discovery and real catalog-tool call in the supported agent environment,
- Phase 6's runtime-validated project schemas, deterministic validation, single command executor,
  vanilla Zustand store, revision counter, and bounded undo/redo history,
- Phase 7's manual `/creator` editor, with every room, settings, obstacle, unavailable-zone, drag,
  undo, and redo action using that same store.

Primary output: route-scoped WebMCP tools on `/creator` through which an agent reads the live room
project, configures the room and project settings, adds or edits obstacles and unavailable zones,
and validates the current layout. Mutations must dispatch the same domain commands as the manual
editor, update the visible UI before the tool returns, and enter the same undo/redo history.

## Goal

Prove the first mutable human-agent collaboration loop on the completed room editor. A person can
make a manual change, an agent can read that exact revision and continue through WebMCP, the
deterministic validator can report problems, and the person can undo or redo the agent's change
with the existing toolbar.

This phase connects WebMCP only to the room model already implemented in Phases 6 and 7. Product
placement, candidate generation, shopping totals, persistence, and the final activity feed remain
owned by later phases.

## Fixed product and architecture decisions

1. Register exactly these creator tools in this phase:
   - read-only: `get_project_state`, `validate_layout`,
   - mutating: `configure_room`, `update_project_settings`, `add_obstacle`, `update_obstacle`,
     `remove_obstacle`.
2. Keep `configure_room` limited to width, depth, and height. Map budget and training goals to the
   separate `update_project_settings` tool so one successful tool mutation equals one domain
   command, one revision, and at most one undo step.
3. Do not expose WebMCP `undo` or `redo`. Agent mutations are reversible through the existing
   manual history controls; private history snapshots never become tool output.
4. Handlers receive a stable creator-store API and call `store.getState()` at execution time.
   Never capture a project snapshot, validation array, revision, or bound dispatch from render.
5. Every mutating handler translates its strict tool input into one existing
   `store.getState().dispatch(command)` call. It does not call the command executor directly,
   mutate Zustand state, recreate validation, or maintain an agent-only project copy.
6. Spatially invalid but schema-valid edits remain applied, exactly like manual edits. Their
   structured validation issues are returned so the agent can correct the room; invalid tool
   inputs and command precondition failures do not change project state or history.
7. `get_project_state` returns the current project, validation, revision, `canUndo`, and `canRedo`.
   `validate_layout` is a non-mutating view of the store's deterministic validation at one stated
   revision. Both return cloned, plain application data rather than Zustand or schema objects.
8. A successful mutation returns `changed`, `revision`, affected entity IDs, current validation,
   and the smallest useful current-state fragment. `add_obstacle` returns the executor-generated
   obstacle ID and canonical obstacle; callers never supply IDs for new entities.
9. Preserve locked-entity semantics. A locked obstacle can only be unlocked with the exact
   `update_obstacle` patch `{ locked: false }`; other updates and removal return the domain's
   `ENTITY_LOCKED` failure without adding history.
10. Use simple, strict, tool-specific Zod objects with unambiguous JSON Schema output. Runtime
    validation remains mandatory even though the same constraints are advertised to the agent.
11. Reuse the Phase 4 imperative lifecycle: client-only registration after hydration, awaited
    registration, one `AbortController` for the mounted creator bridge, signal-based cleanup,
    partial-failure abort, and a non-blocking manual-editor fallback. Keep the narrow adapter type;
    do not globally augment `Document` or fall back to the obsolete `navigator.modelContext`.
12. Tool results are stable JSON-serializable values, not backend MCP `{ content: ... }` results.
    Unexpected exceptions are converted to safe error codes and must not leak stack traces,
    component state, or implementation details.
13. Keep room tools scoped to `/creator` and catalog tools scoped to `/catalog` for now. Phase 11
    will compose the complete creator tool set after equipment exists; Phase 8 must not register
    premature product-placement or suggestion tools.
14. No confirmation dialog is required for these reversible MVP mutations. The visible update and
    shared undo/redo history are the human-control mechanism; genuinely destructive or external
    actions remain outside this phase.

The mandatory modern-web guidance for imperative WebMCP reinforces feature detection, route-aware
registration, signal-based cleanup, atomic and composable tools, runtime validation, and returning
only after UI state updates. Where generic guidance mentions legacy entry points, the project's
newer primary-source contract in `docs/WEBMCP_SOURCES.md` takes precedence.

## Tool contract

| Tool | Input | Domain/store path | Minimum successful result |
|---|---|---|---|
| `get_project_state` | strict empty object | live `store.getState()` | project, validation, revision, undo/redo availability |
| `configure_room` | width, depth, height in integer cm | `ROOM_CONFIGURED` | command outcome, revision, canonical room, validation |
| `update_project_settings` | non-empty budget and/or training-goal patch | `PROJECT_SETTINGS_UPDATED` | command outcome, revision, canonical settings, validation |
| `add_obstacle` | kind, name, position, dimensions, rotation, locked | `OBSTACLE_ADDED` | generated ID, canonical obstacle, revision, validation |
| `update_obstacle` | obstacle ID plus non-empty strict patch | `OBSTACLE_UPDATED` | canonical obstacle, revision, validation |
| `remove_obstacle` | obstacle ID | `OBSTACLE_REMOVED` | removed ID, revision, validation |
| `validate_layout` | strict empty object | live store validation read | valid flag, issue counts/issues, revision |

Descriptions must tell the agent that positions use the minimum corner of the rotated footprint,
dimensions are integer centimeters, rotations are `0 | 90 | 180 | 270`, invalid spatial layouts
may be applied and returned with issues, and canonical obstacle IDs come from read/add results.

## Expected file map

Keep shared lifecycle code small, room contracts separated by responsibility, and the bridge inside
the existing creator provider:

```text
src/features/
├── creator/
│   └── store/
│       └── project-store-context.tsx
└── webmcp/
    ├── register-tool-set.ts
    ├── room-tool-schemas.ts
    ├── room-tool-results.ts
    ├── room-tool-handlers.ts
    ├── register-room-tools.ts
    └── components/
        └── creator-webmcp-bridge.tsx
```

The exact names may adjust to preserve nearby conventions. Reuse `types.ts`, keep existing catalog
behavior intact, colocate focused tests, and split any non-test file before it approaches 500
physical lines.

## Implementation sequence

### 1. Reconfirm the verified WebMCP and creator boundaries

- Compare the Phase 4 contract in `docs/WEBMCP_SOURCES.md` with the current creator store and
  manual flow; refresh only time-sensitive runtime facts that affect implementation.
- Read the installed Next.js Client Component and route-segment guidance before moving or adding
  a client boundary.
- Freeze the seven tool names, descriptions, inputs, result fields, read-only annotations, and
  error codes before writing handlers.
- Reconcile `docs/TECHNICAL_ARCHITECTURE.md` with the separate `update_project_settings` tool and
  the reduced Phase 8 room-only set if its planned list would otherwise contradict the code.

Acceptance:

- Every tool has one distinct purpose and maps to zero or one existing dispatch.
- No input requires the agent to calculate pixels, scene units, generated IDs, or rotated bounds.
- Read-only annotations appear only on `get_project_state` and `validate_layout`.
- Equipment, suggestions, persistence, activity-feed metadata, and photo binaries are absent.

### 2. Expose a stable store API and generalize registration lifecycle

- Add the smallest provider-scoped way for the creator bridge to obtain the stable
  `ProjectStore` API while keeping `setState` and private history inaccessible.
- Extract a focused registrar helper only if it removes real duplication between catalog and room
  registration; preserve the catalog's all-or-unavailable semantics and status contract.
- Keep one creator store per provider and one registration controller per mounted bridge.
- Preserve the pure project/geometry dependency boundary: domain modules must not import WebMCP,
  React, Zustand UI adapters, or browser APIs.

Acceptance:

- The bridge receives the provider's store instance, not a module singleton or copied project.
- A handler created once observes manual changes, undo, and redo performed after its creation.
- Catalog registration behavior and tests remain unchanged after any lifecycle extraction.
- Two creator providers remain independent in project state, revision, history, and tool services.

### 3. Define strict schemas and advertised JSON Schema

- Build tool-specific Zod schemas from the existing room, settings, obstacle, geometry, and
  training-goal fields without advertising the internal discriminated command union.
- Require strict empty objects for both read tools and reject extra keys everywhere.
- Keep settings and obstacle patches non-empty. Preserve exact integer, non-negative, positive,
  enum, trimming, and maximum-length constraints from the domain schemas.
- Generate JSON Schema with `z.toJSONSchema()` and centralize stable mapping of Zod issues to
  agent-readable paths and messages.

Acceptance:

- Tests cover every valid boundary, missing field, fractional/negative/zero value, invalid enum,
  empty patch, unknown goal, overlong text, and extra property.
- Advertised schemas have explicit object shapes, required fields, and
  `additionalProperties: false` wherever applicable.
- Runtime parsing and the advertised schema agree for all fixtures.
- Schema and representative result fixtures survive `JSON.stringify` without loss or exception.

### 4. Implement read results and current-state serialization

- Create canonical serializers for room, settings, obstacles, project state, and validation issues
  so tools never return mutable store references.
- Implement `get_project_state` from one live store snapshot and include project version, current
  revision, undo/redo availability, and complete current Phase 8 state.
- Implement `validate_layout` as a read of validation already derived by the shared deterministic
  store path; add stable valid/issue-count fields useful for an agent's next decision.
- Handle an optional execution `AbortSignal` without requiring the runtime to provide callback
  options.

Acceptance:

- Mutating a returned object cannot mutate store state.
- Both handlers report the revision corresponding to the returned project/validation snapshot.
- Empty, valid, overflow, height, collision, unavailable-zone, and multi-issue states are stable
  and deterministic.
- Read calls do not dispatch, increment revision, change undo/redo, or create history.

### 5. Implement mutating handlers through the shared dispatch

- Translate each parsed input into its one matching Phase 6 command and call the current store's
  public `dispatch`.
- After dispatch returns, read the current store once more and build the result from the applied
  canonical state, returned revision, affected IDs, and validation.
- Map domain failures (`INVALID_COMMAND`, `ENTITY_NOT_FOUND`, `ENTITY_LOCKED`, `ID_CONFLICT`,
  `EXECUTION_FAILED`) into stable tool envelopes without losing retry-relevant codes.
- Treat schema-valid no-ops as successful `changed: false` results at the unchanged revision and
  make cancellation and unexpected exceptions explicit safe failures.

Acceptance:

- Every successful real change produces exactly one revision and one undo entry.
- Rejected input, cancellation before dispatch, domain failure, and no-op produce no history.
- Add returns the generated canonical obstacle; update returns the post-command obstacle; removal
  cannot accidentally return a stale still-present entity.
- Locked, unlock-only, not-found, outside-room, collision, and unavailable-zone cases match the
  manual editor's domain behavior exactly.
- The visible creator state is updated synchronously before the fulfilled tool result is returned.

### 6. Register the creator tool set and mount its bridge

- Define the seven tool objects with unique names, precise descriptions, strict input schemas,
  correct annotations, and handlers bound to the provider's store API.
- Register them after the creator has hydrated, await the complete set, abort on partial failure,
  and abort on unmount, navigation, and React Strict Mode remount.
- Mount the bridge inside the same `ProjectStoreProvider` as `CreatorEditor` so tools and manual
  controls share the instance.
- Show a concise non-blocking status only when tools are unsupported or registration fails; the
  manual editor must remain fully usable and must not claim agent mutations succeeded.

Acceptance:

- `/creator` registers exactly seven Phase 8 tools once per active bridge, with no duplicates.
- Direct route load, remount, navigation away, partial rejection, late promise resolution, and
  unsupported `document.modelContext` all clean up safely.
- The bridge causes no hydration warning, module-level shared store, or creator reset.
- Catalog routes still register only the existing catalog tools.

### 7. Prove the shared manual-agent-history scenario in automated tests

- Add a React/store/WebMCP integration test that performs: manual room/settings edit → agent state
  read → agent add/update → deterministic validation → agent correction → manual undo → manual
  redo → agent state re-read.
- Execute the registered tool definitions from a fake model context rather than bypassing the
  registrar or calling private handler helpers only.
- Assert visible forms, SVG plan, issue summary, undo/redo buttons, store revision, and tool results
  all describe the same state after each boundary crossing.
- Add focused handler tests for stale-closure prevention, valid/no-op/failure/cancellation paths,
  generated IDs, locks, serialization, and safe unexpected-error handling.

Acceptance:

- A manual change made after registration is visible to the next `get_project_state` call.
- An agent mutation updates the existing UI and is reverted/restored by the manual toolbar with no
  separate history.
- `validate_layout` returns the same structured issues shown by the editor for the same revision.
- No test reaches into Zustand `setState`, private history arrays, or a second command executor.
- Existing project, geometry, store, creator, catalog, and catalog-WebMCP tests continue to pass.

### 8. Verify a real agent call and close the phase

Run narrow checks during implementation, then the local gate:

```bash
npm test -- src/features/webmcp
npm test -- src/features/creator
npm test -- src/app/creator
npm run quality:quick
npm run lint:report
npm run agent:verify
npm run build
```

Manual Chrome checks:

- fresh `/creator` load and direct navigation register exactly the seven tools,
- inspect names, descriptions, schemas, read-only annotations, and absence of duplicates,
- call every tool with valid and invalid input and inspect plain serialized results,
- navigate away and back, remount, and verify cleanup without losing manual functionality,
- create collisions, unavailable-zone conflicts, out-of-room entities, and locked-entity failures,
- verify every agent mutation appears immediately and is covered by manual undo/redo.

Fresh supported Codex/ChatGPT session:

1. Open the current public `/creator` page with the ready demo project.
2. Ask the agent to inspect the room and report its revision and current issues.
3. Make one manual room or obstacle change, then ask the agent to re-read before acting.
4. Ask it to configure the room/settings and add or edit an obstacle through discovered tools.
5. Ask it to validate, interpret any structured issue, and correct one invalid result.
6. Undo and redo the agent mutation manually, then have the agent confirm the final revision/state.

Record the exact environment, prompts, discovered tool names, call order, salient results, and any
runtime discrepancy in a short Phase 9 handoff note or the repository's durable WebMCP source map.
Do not close Phase 8 on unit tests alone.

## Test inventory

### Schemas and results

- strict empty read inputs and extra-key rejection,
- all room/settings/obstacle boundaries and non-empty patches,
- Zod issue paths and stable error codes,
- JSON Schema agreement and `additionalProperties: false`,
- canonical cloning and JSON serialization.

### Handlers and store integration

- live state after post-registration manual dispatch, undo, and redo,
- successful, no-op, rejected, cancelled, locked, missing, and unexpected-failure calls,
- generated obstacle ID and canonical post-mutation fragments,
- one real mutation = one revision = one undo step,
- validation equivalence between tool result, store, and visible editor.

### Registration and React lifecycle

- exact names, descriptions, annotations, schemas, and unique tool count,
- unsupported API, full success, partial failure, already-aborted registration, and late resolution,
- Strict Mode remount, unmount, navigation cleanup, and direct creator load,
- one provider/store per workspace and no stale closures,
- non-blocking fallback with a fully usable manual editor.

### Existing regressions to preserve

- project schema, command, validation, geometry, history, and dependency-boundary tests,
- manual forms, drag, lock, issue display, selection, undo, and redo,
- catalog data/queries/pages and existing read-only catalog WebMCP tools,
- landing/shared UI tests, lint, TypeScript, duplicate detection, file-size guard, and build.

## Scope boundary

Out of scope for Phase 8:

- product placement, placement movement/removal, candidate generation, batch layout changes, or a
  global solver,
- expanding or registering creator catalog search, product details, shopping list, totals,
  training-goal coverage, or project summary,
- persistence, localStorage, autosave, import/export, migrations, reset tools, or share URLs,
- WebMCP undo/redo, raw history snapshots, multi-command transactions, activity feed, caller
  attribution, agent highlights, notifications, or audit storage,
- 3D rendering, React Three Fiber, photo upload/analysis, multimodal tool arguments, backend MCP,
  API routes, authentication, accounts, a database, or secrets,
- speculative security/origin-trial headers, declarative tools, browser polyfills, or global
  `Document` augmentation.

## Exit gate

Phase 8 is complete when:

1. `/creator` exposes exactly the seven scoped room tools with strict runtime-validated inputs,
   plain verifiable results, correct annotations, and safe lifecycle cleanup.
2. Read handlers observe the live provider store at execution time and report a coherent project,
   validation, revision, and undo/redo state without exposing private history.
3. Every agent mutation uses one existing store `dispatch(command)`, updates the visible editor
   before returning, and creates no separate state or validation path.
4. Invalid inputs, domain failures, cancellations, no-ops, spatial issues, and locked entities have
   deterministic results and correct history behavior.
5. A complete automated manual → agent read → agent mutation → validation → correction → manual
   undo/redo scenario proves shared state and history.
6. Unsupported or failed WebMCP registration leaves the manual editor usable, while route changes,
   direct load, and Strict Mode remount produce no duplicates or leaks.
7. Focused tests, `quality:quick`, `agent:verify`, and the production build pass with existing
   catalog and creator behavior preserved.
8. A fresh supported agent session on the current public creator discovers the tools, reads a
   manual change, performs and corrects a real mutation, and observes the undo/redo result.

After the gate passes, remove Phase 8 from the active implementation index, delete this file, and
promote Phase 9 to a detailed plan. Git history remains the implementation record.

## Risks and controls

| Risk | Control |
|---|---|
| Handler closes over the initial project | Inject the stable store API and test a manual mutation after registration but before execution. |
| WebMCP creates a second mutation/history path | Require one public `dispatch` per mutating tool and prove manual undo/redo of agent changes. |
| One tool silently creates two undo steps | Keep room and project settings as separate atomic tools. |
| Tool results describe pre-update state | Re-read the store after synchronous dispatch and assert UI/result/revision equivalence. |
| Agent cannot recover from invalid geometry | Apply schema-valid edits and return complete structured validation issues and canonical IDs. |
| Mutable result objects corrupt the store | Serialize cloned plain data and test mutation isolation plus `JSON.stringify`. |
| Strict Mode or partial registration leaves duplicates | One controller per bridge, awaited registration, abort-all failure handling, and remount tests. |
| Generic guidance reintroduces obsolete API paths | Follow the project's current primary-source `document.modelContext` contract only. |
| Phase expands into equipment or activity UX | Hold the seven-tool boundary; Phase 11 and Phase 12 own those surfaces. |
| Unit mocks hide agent incompatibility | Make the fresh public agent scenario a hard exit gate and record exact evidence. |
