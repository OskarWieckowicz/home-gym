# Phase 9 — Local project persistence

Umbrella: [implementation plan index](./README.md).

Status: ready to execute after Phase 8.

Depends on:

- Phase 6's runtime-validated `GymProject` schema, deterministic validation, vanilla Zustand
  store, revision counter, and bounded undo/redo history,
- Phase 7's manual creator, where room, settings, obstacle, drag, undo, and redo changes already
  use the shared project store,
- Phase 8's creator WebMCP bridge, whose tools read and mutate that same live store and therefore
  must not mount against a temporary default project during restoration.

Primary output: a local-first `/creator` experience that restores one validated, versioned project
from `localStorage`, automatically saves every real project change, remains usable when browser
storage fails, and supports validated JSON export, import, and reset without introducing a backend
or a second project-state path.

## Goal

Make the creator resilient to refreshes, direct visits, and development rebuilds under the same
browser origin. A project changed manually or through WebMCP must be restored as the initial shared
state before the editor and room tools become available.

This phase establishes the persistence boundary before equipment is added. Later project-schema
versions, including placements, must extend the same codec and migration path rather than creating
separate storage.

## Fixed product and architecture decisions

1. Use `localStorage`, not IndexedDB, for the MVP. The application has one small JSON project and
   stores no photos, binaries, durable activity log, or collection of projects.
2. Use one stable storage key: `home-gym-creator.project`. Do not encode the project version in the
   key; a stable key is required to discover and migrate older documents.
3. Persist only the canonical `GymProject`. Do not persist Zustand functions, validation results,
   revision, undo/redo flags, history snapshots, selection, active panels, WebMCP status, or other
   derived/UI state.
4. Use the existing `GymProject.version` as the saved-format migration discriminator. Do not add a
   second storage-envelope version until storage metadata has a demonstrated independent lifecycle.
5. Keep serialization and migrations in pure project modules. The project/domain layer must not
   import React, Zustand, `window`, `localStorage`, Blob, File, or DOM APIs.
6. Implement persistence explicitly rather than adding Zustand `persist` middleware. Restore
   ordering, strict validation, migrations, storage failures, and WebMCP readiness must remain
   visible and testable.
7. Restore is initialization, not an edit: it creates the store baseline at `revision: 0`, with
   empty undo/redo history and freshly computed deterministic validation.
8. Import and reset are user edits: each successful real replacement creates exactly one revision
   and at most one undo step. Invalid import and replacement no-ops change nothing.
9. Mount the editor workspace and `CreatorWebMcpBridge` only after the persistence boundary has
   completed its first restore attempt. Neither a person nor an agent may observe or mutate a
   temporary default project.
10. Autosave subscribes only after restore. Save immediately whenever the `project` reference
    changes, including dispatch, undo, redo, import, reset, and WebMCP mutations. Current room drag
    behavior commits one domain change, so debounce is unnecessary until measurements show a
    synchronous-write problem.
11. A missing, blocked, quota-limited, corrupt, or unsupported storage implementation must never
    prevent in-memory editing. Show a concise non-blocking persistence status and keep the manual
    and WebMCP flows operating on the same store.
12. A corrupt or unsupported saved document falls back to the default/explicit initial project
    and is not overwritten during initialization. The next real project change may replace it with
    a valid current-version document; reset may clear it explicitly.
13. JSON export contains the canonical current `GymProject`, not private history or persistence
    metadata. JSON import runs through the same migration and schema-validation codec as restore.
14. Explicit `initialProject` usage in component tests and embedded/demo scenarios must remain
    deterministic. It bypasses browser restore unless persistence is explicitly enabled or an
    injected storage adapter is supplied for a persistence test.
15. Cross-tab synchronization is out of scope. Multiple tabs are last-write-wins; no `storage`
    event listener, merge UI, or conflict resolution is added in this phase.

## Saved-project contract

The stored and exported document is the project itself:

```json
{
  "version": 1,
  "room": { "widthCm": 400, "depthCm": 320, "heightCm": 240 },
  "obstacles": [],
  "budget": 10000,
  "trainingGoals": []
}
```

The codec accepts `unknown`, identifies the declared version, applies sequential migrations when
needed, and finally parses with `gymProjectSchema`. It must distinguish at least:

- invalid JSON,
- missing or invalid version,
- a future unsupported version,
- migration failure,
- current-schema validation failure.

Errors exposed to the UI must be stable and actionable without including stack traces or raw
browser exception details. The original imported file or storage value is untrusted input.

## Expected file map

Keep domain serialization separate from browser storage and React lifecycle code:

```text
src/features/
├── project/
│   └── serialization/
│       ├── project-codec.ts
│       └── project-migrations.ts
└── creator/
    ├── persistence/
    │   ├── local-project-storage.ts
    │   └── project-persistence-boundary.tsx
    ├── store/
    │   ├── project-store.ts
    │   └── project-store-context.tsx
    └── components/
        ├── creator-editor.tsx
        ├── creator-toolbar.tsx
        └── project-file-actions.tsx
```

Exact names may adjust to nearby conventions. Keep browser APIs out of module initialization,
preserve one store per provider, inject a minimal storage interface for tests, and split any
non-test source file before it approaches 500 physical lines.

## Implementation sequence

### 1. Freeze the persistence and replacement contracts

- Define the stable storage key, supported project versions, codec result/error types, persistence
  status values, and semantics for restore, autosave, import, export, and reset.
- Confirm that only `GymProject` is durable and list every excluded transient/derived field.
- Define the store-level project replacement operation used by import and reset, including no-op,
  revision, validation, and history behavior.
- Read the installed Next.js Client Component and hydration guidance before changing the provider
  boundary; do not access browser storage during server rendering.

Acceptance:

- The contract has one version discriminator and one stable key.
- Restore, import, reset, and ordinary dispatch have unambiguous and distinct history semantics.
- No proposed type makes the domain layer depend on browser or framework APIs.

### 2. Implement the pure project codec and migration pipeline

- Add a deterministic JSON decoder that accepts text/unknown data, rejects malformed documents,
  routes by `version`, applies migrations sequentially, and finishes with `gymProjectSchema`.
- Add canonical serialization of a current project without functions, validation, history, or UI
  state.
- Represent migrations as explicit `vN -> vN+1` functions even though version 1 currently needs no
  migration. Future versions must add fixtures before becoming current.
- Reject future versions rather than guessing or silently dropping fields.

Acceptance:

- A version-1 project round-trips without semantic loss.
- Strict-schema violations, duplicate obstacle IDs, bad JSON, missing versions, and future versions
  return stable failures without throwing across the public codec boundary.
- Codec and migration modules run without a DOM and do not import creator/WebMCP modules.

### 3. Add a defensive localStorage adapter

- Implement `load`, `save`, and `clear` over an injected minimal `Storage`-like interface.
- Keep all `getItem`, `setItem`, and `removeItem` access inside `try/catch`; map unavailable access,
  quota/write failure, corrupt content, and unsupported versions to stable results.
- Use the pure codec for both load and save. Do not duplicate JSON parsing or schema validation in
  React code.
- Ensure failed save/clear operations do not mutate the project store.

Acceptance:

- Missing storage returns an empty result, not an error.
- Valid storage restores a fully parsed `GymProject`.
- Exceptions from every storage method are contained and classified.
- Loading never writes, clears, or repairs storage as a side effect.

### 4. Add atomic project replacement to the shared store

- Add the smallest public store operation that validates and replaces the current project for
  import/reset while preserving the existing command executor for normal domain edits.
- Record the previous project as one history snapshot for a real replacement, clear the redo
  branch, recompute validation, increment revision once, and report a structured result.
- Treat an equal replacement as a no-op; invalid input leaves state and history untouched.
- Keep restore outside this action by creating the store from the restored initial project.

Acceptance:

- Import/reset replacement is reversible through the same manual undo/redo controls.
- Replacement, its undo, and its redo each expose one coherent project, validation, and revision.
- Existing dispatch, history limit, generated-ID behavior, and WebMCP command handling do not
  regress.

### 5. Gate store creation, editor rendering, and WebMCP registration on restore

- Introduce a client persistence boundary that renders the same lightweight loading state on the
  server and on the first client render.
- In its first client effect, attempt storage load, choose restored or fallback initial/default
  project, then create/mount exactly one provider store.
- Mount `EditorWorkspace` and `CreatorWebMcpBridge` only after that decision.
- Preserve explicit non-persistent `initialProject` behavior used by existing tests; enable and
  inject persistence deliberately in new tests.
- Ensure React Strict Mode mount/cleanup cannot create duplicate stores, subscriptions, saves, or
  WebMCP registrations.

Acceptance:

- Hard refresh and direct `/creator` load produce no hydration warning or visible default-project
  flash.
- A valid saved project is the store's revision-0 baseline with empty history.
- WebMCP first registers against the restored store and its first read returns restored state.
- A failed restore still mounts one fully usable in-memory workspace.

### 6. Connect autosave and visible persistence status

- Subscribe after hydration and save only when the canonical project reference changes.
- Cover manual dispatch, WebMCP dispatch, import, reset, undo, and redo without adding a second
  mutation path.
- Do not save for read-only tools, rejected commands, no-ops, selection/panel changes, or other
  store updates that leave `project` unchanged.
- Expose concise statuses such as loading, saved locally, storage unavailable, invalid saved
  project, and save failed. Announce meaningful status changes accessibly without noisy updates.

Acceptance:

- One real project change produces the current serialized project in storage before the next user
  action completes.
- No-op/rejected/read-only activity does not write.
- Write failure leaves current in-memory editing, validation, history, and WebMCP usable.
- Subscription cleanup is correct on unmount and Strict Mode remount.

### 7. Add validated export, import, and reset controls

- Export the current canonical project as UTF-8 JSON with a stable filename and revoke any created
  object URL after download initiation.
- Accept only a bounded JSON file, decode it as untrusted text through the shared codec, and apply a
  successful import through the one-step store replacement operation.
- Report import failures without changing project, history, revision, or saved state.
- Reset to `createDefaultProject()` through the same replacement operation after a clear user
  confirmation; autosave then makes the reset state durable.
- Keep controls keyboard accessible and place them with the creator's existing project/history
  actions without redesigning the full toolbar.

Acceptance:

- Export then import round-trips the current project exactly.
- Importing invalid, oversized, future-version, or schema-invalid JSON is non-destructive.
- Reset is undoable during the current session and persists only after confirmation.
- Import and reset changes are immediately visible to both the editor and live WebMCP reads.

### 8. Prove persistence across the shared manual-agent flow

- Add focused codec, migration, storage-adapter, store-replacement, boundary, and file-action tests.
- Add an integration test that seeds storage, mounts the creator, verifies the first WebMCP read,
  performs an agent mutation, unmounts/remounts, and observes the identical canonical project.
- Include manual mutation, undo, redo, import, reset, corrupt storage, unavailable storage, write
  failure, direct load, and React Strict Mode cases.
- Run the narrowest tests first, then the repository validation ladder and production build because
  the phase changes a Client Component/hydration boundary.

Acceptance:

- Tests prove one shared restored store for manual UI and WebMCP with no stale default-state window.
- Every durable mutation path restores correctly; every failure path remains safely in memory.
- Existing project, geometry, creator, history, WebMCP, catalog, and landing behavior remains green.

## Test matrix

### Pure codec and migrations

- canonical version-1 round-trip,
- whitespace and field-order tolerance,
- malformed JSON,
- non-object roots,
- missing, fractional, negative, and future versions,
- strict unknown fields and invalid nested geometry,
- duplicate obstacle IDs,
- representative migration fixture for every historical version once version 2 exists.

### Storage adapter

- missing key,
- valid current document,
- corrupt and unsupported document,
- `getItem`, `setItem`, and `removeItem` exceptions,
- write quota/failure,
- save followed by load equality,
- no write during load.

### Store and React lifecycle

- restored baseline has revision 0 and empty history,
- import/reset real change creates one undo entry,
- replacement no-op and invalid replacement create none,
- undo/redo after replacement recomputes validation and autosaves,
- server/first-client loading output agrees,
- Strict Mode has one active subscription and no initialization write,
- editor and WebMCP mount only after restore settles,
- explicit non-persistent `initialProject` remains deterministic.

### Shared-flow integration

- seeded project -> restore -> first WebMCP read,
- manual change -> saved project -> remount,
- agent change -> saved project -> remount,
- agent change -> manual undo/redo -> saved current snapshot,
- valid import -> editor/WebMCP agreement -> remount,
- corrupt/unavailable storage -> in-memory fallback remains usable,
- failed save -> visible status with unchanged project/history.

## Manual checks

1. Open `/creator`, change room settings, add and move an obstacle, refresh, and verify exact state.
2. Trigger a development rebuild without changing the origin and verify the project remains.
3. Open `/creator` directly in a new tab and verify the stored project appears before room tools
   become available.
4. Perform a WebMCP mutation, refresh, and verify the agent-created state remains.
5. Undo and redo changes, refreshing after each, and verify the currently visible snapshot wins.
6. Export a project, reset it, import the file, and verify the editor and WebMCP read agree.
7. Test malformed JSON and a future-version fixture; verify the existing project is untouched.
8. Block or stub browser storage and verify the editor remains usable with a concise warning.
9. Verify behavior on the public deployment and document that storage is origin-specific: a new
   preview URL or development port has independent local data.

## Scope boundary

Out of scope for Phase 9:

- IndexedDB, service-worker caches, cookies, server persistence, API routes, databases, accounts,
  authentication, cloud sync, share URLs, or collaboration between devices,
- multiple named projects, recent-project lists, cross-tab synchronization, conflict resolution,
  storage-event merging, or multi-user editing,
- persisting undo/redo history, revision numbers, validation arrays, selected entities, panels,
  WebMCP registration state, or activity-feed events,
- photos, binary files, product images, 3D assets, compression, encryption, or storage quotas beyond
  safe failure handling,
- equipment placements or catalog expansion; Phase 11 must extend the established codec/migrations
  when placements enter `GymProject`,
- WebMCP import, export, reset, storage-management tools, or a separate agent persistence path,
- presets beyond the existing default project, autosave debounce, background sync, telemetry, or
  a redesigned project-management UI.

## Verification commands

During implementation, run the narrowest Vitest files for each slice, followed by:

```text
npm run quality:quick
npm run agent:verify
npm run build
```

The production build is mandatory because the phase changes browser-only access, hydration order,
and the Client Component boundary around the creator.

## Exit gate

Phase 9 is complete when:

1. A canonical project changed manually or through WebMCP survives refresh, direct visit, and
   rebuild under the same origin.
2. Restore completes before the editor and creator WebMCP bridge mount; the restored project is a
   revision-0 baseline with freshly computed validation and empty history.
3. Autosave persists every real project mutation, import, reset, undo, and redo, while rejected,
   no-op, read-only, and UI-only activity performs no write.
4. JSON export/import round-trips the current version, older versions migrate explicitly, future or
   invalid documents fail non-destructively, and reset is confirmed and undoable.
5. Missing, blocked, corrupt, unsupported, quota-limited, or failing storage leaves one shared
   in-memory editor/WebMCP store usable with a concise status.
6. Focused tests, shared-flow integration coverage, manual checks, `quality:quick`, `agent:verify`,
   and the production build pass without weakening existing checks or exceeding file-size limits.
