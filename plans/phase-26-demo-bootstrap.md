# Phase 26 — Demo bootstrap and creator start modes

> Order 1 in the [active queue](README.md). Depends on nothing.
> Blocks Phase 22 (the demo needs a reproducible starting layout) and Phase 23
> (landing CTAs already point at both start modes).

## Problem

`src/lib/navigation.ts` already publishes `/creator?start=demo` and `/creator?start=new`, and the
header, hero and footer link to them. The creator ignores the query string entirely.
`src/app/creator/page.tsx` renders `<CreatorEditor />` with no props, `CreatorEditor` turns
persistence on, and `ProjectPersistenceBoundary.restoreSession()` returns the saved project whenever
`home-gym-creator.project` decodes successfully. A judge who opens the demo link after any earlier
visit gets their previous session, and there is no checked-in demo project to load at all. The only
project JSON in the repository is `src/features/project/serialization/fixtures/v3-four-product-room.json`,
a legacy v3 file used solely by migration tests.

## Scope

In scope: reading and validating the `start` query parameter, a checked-in v4 demo project,
start-mode branching inside the existing persistence boundary, and tests for both modes.

Out of scope: named sessions, multiple saved projects, server-side persistence, a project picker,
changing the storage key or schema version, and any change to `analyzeProject` or the command layer.

## Decisions

**D1 — the URL is the source of truth for start mode.** `?start=demo` seeds the demo project and
`?start=new` seeds an empty room, in both cases overriding a restored session. Re-visiting or
reloading the same URL re-applies the same mode, which is what the exit gate asks for. The accepted
cost is that reloading `?start=demo` discards edits made since the seed; the demo script must not
reload mid-edit, and the toolbar already exposes export. The alternative — seeding only when storage
is empty — was rejected because a judge's second visit would silently get a different product than a
first-time visitor.

**D2 — the mode is read on the server and passed down as a prop.** `page.tsx` reads `searchParams`,
parses it through one helper, and passes `startMode` to `CreatorEditor`, which forwards it to
`ProjectPersistenceBoundary`. This avoids adding a `useSearchParams` Suspense boundary inside the
client editor and keeps the client restore path a single function. It makes `/creator` dynamically
rendered, so this phase requires `npm run build`.

**D3 — the demo fixture is data, not a code path.** It is a checked-in JSON file decoded through the
existing `decodeProject`, so it passes migration, `gymProjectSchema` and `projectUsesKnownProducts`
exactly like an imported file. No demo-only store, no demo-only storage key, no bypass of validation.

**D4 — the demo layout must be valid but not sterile.** It must produce zero errors and at least one
warning, so the validation panel and the Phase 22 correction story both have something real to show
on first paint.

## Implementation tasks

1. **Parse the start mode.** Add `parseCreatorStartMode(value: unknown): CreatorStartMode | null` to
   `src/lib/navigation.ts` next to `CREATOR_START_MODES`. Unknown values, arrays and absent values
   return `null`, meaning "restore as before". Do not throw and do not redirect.

2. **Author the demo project.** Add `src/features/project/fixtures/demo-project.json` at version 4
   and `createDemoProject()` in `src/features/project/fixtures/demo-project.ts` that decodes it with
   `decodeProject` and throws on failure. Re-export `createDemoProject` from
   `src/features/project/index.ts` beside `createDefaultProject`.

   Base the content on the v3 migration fixture, converted to the v4 `projectItems` + `placements`
   shape: a 400 × 320 × 240 room, the locked wardrobe obstacle, the entry door on the top wall, and
   the Northstar half rack, Arc adjustable bench, Ironvale barbell set and Foundry bumper plates,
   with `budget: 10000` and the strength and muscle-gain goals. Keep every ID readable
   (`project-item_rack`, `placement_rack`) so activity-feed and tool output stay legible in the
   video. Do not copy or move the v3 fixture; migration tests keep owning it.

3. **Branch the restore path.** Give `ProjectPersistenceBoundary` an optional
   `startMode?: CreatorStartMode` prop and resolve the session once on mount:

   - `"demo"` → seed `createDemoProject()`, skip the load result entirely;
   - `"new"` → call `storage.clear()`, then seed `createDefaultProject()`;
   - `undefined` → today's `restoreSession()` behaviour, unchanged.

   Keep the branch inside the existing `queueMicrotask` effect and the existing
   `setSession(current => current ?? restored)` guard so there is still exactly one client-only
   storage read and no SSR access to `localStorage`.

4. **Thread the prop.** Add `startMode` to `CreatorEditorProps`, forward it to the boundary, and make
   `src/app/creator/page.tsx` read `searchParams`, parse it and pass it. Leave the existing
   `initialProject` / `persistence` props alone — tests depend on them.

5. **Fix the stale "How it works" link only if it is free.** `headerLinks` points it at `/`; that
   belongs to Phase 23 and must not grow this change.

## Acceptance criteria

- `/creator?start=demo` shows the four demo products in the plan and in the project item list, with
  zero validation errors and at least one warning, in a browser profile that has never opened the app.
- `/creator?start=demo` shows the same layout when storage already holds a different project.
- `/creator?start=new` shows an empty 400 × 320 × 240 room and leaves nothing in storage from the
  previous session.
- `/creator` with no query parameter still restores the last session.
- A reload of either mode reproduces the mode, and a direct paste of either URL behaves the same as
  a click from the landing page.
- The demo project round-trips through `serializeProject` / `decodeProject` without change.
- Undo, redo, export, import, reset and every WebMCP tool behave identically in all three modes.

## Tests

- `src/lib/navigation.test.ts` — extend with `parseCreatorStartMode` for `"demo"`, `"new"`,
  `"DEMO"`, `""`, `undefined`, `["demo"]` and an unrelated string.
- `src/features/project/fixtures/demo-project.test.ts` — new. Asserts the fixture parses through
  `decodeProject`, is version 4, references only known catalog products, serializes back byte-stable,
  and that `analyzeProject` reports `errorCount === 0` with `warningCount >= 1`. Assert the total
  cost against the catalog rather than a hard-coded literal that can drift.
- `src/features/creator/persistence/project-persistence-boundary.test.tsx` — extend with three
  cases: demo mode overrides a valid stored project; new mode clears storage and yields the default
  room; absent mode keeps the current restore behaviour.
- `src/app/creator/page.test.tsx` — extend to assert the page parses `searchParams` and passes the
  mode through, including an invalid value falling back to restore.
- One integration case in `src/features/creator/persistence/project-persistence-flow.integration.test.tsx`:
  boot in demo mode, make a manual edit, confirm it autosaves under the existing key, and confirm a
  remount without a start mode restores the edited project.

## Manual checks

In a private window: open the landing page, click "Run the sample project", confirm the layout and
the warning; reload; edit the room width; open `/creator` bare and confirm the edit persisted; open
`/creator?start=new` and confirm an empty room; reload once more.

## Exit gate

All acceptance criteria hold, `npm run agent:verify` passes, and `npm run build` passes with
`/creator` rendering correctly as a dynamic route. Delete this file and its index row afterwards.
