# Phase 22 — Shared-editing demo and activity feed

> Order 2 in the [active queue](README.md). Depends on Phase 26 (a reproducible demo project) and
> completed Phase 21 (suggestions and batch apply). Blocks Phase 23, which needs real screenshots from here.

## Problem

The shared-editing loop already works and is proven in
`src/features/webmcp/creator-room-flow.integration.test.tsx`: a manual change, `get_project_state`,
an agent mutation, `validate_layout`, a correction, and a shared undo stack. None of it is visible.
The editor has no surface that says an agent did anything. A judge watching the screen sees entities
appear with no attribution, and the video has nothing to point at while narrating the WebMCP story.
This is the single highest-leverage gap against the "WebMCP Leverage" judging category.

## Scope

In scope: an activity record for every WebMCP tool invocation and every manual project change, a
panel that renders it, linking an entry back to the entities it touched, and a scripted demo path
that exercises the full loop end to end.

Out of scope: an in-app model call, a chat interface, server-side logging, analytics, persisting the
activity log across reloads, and any change to the domain, command or validation layers.

## Decisions

**D1 — instrument once, at `createRoomWebMcpTools`.** Wrap each tool's `execute` in
`src/features/webmcp/register-room-tools.ts` before handing the set to `registerToolSet`. All 20
tools flow through that one point, the handlers in `room-tool-handlers.ts` and
`placement-tool-handlers.ts` stay untouched, and the store dispatch remains the only mutation path.
Wrapping the individual handler factories was rejected as duplication across roughly 700 lines.

**D2 — the log is UI state, not project state.** It lives in a small React context created above
both `CreatorWebMcpBridge` and `EditorWorkspace`, holds a bounded ring buffer (50 entries), and is
discarded on reload. It never enters `GymProject`, the schema, autosave or undo.

**D3 — attribution is derived, not guessed per entry.** The recorder exposes
`runAsTool(toolName, fn)`, which marks the current source while the handler runs synchronously. A
store subscription records anything that changes the project outside such a window as a manual edit.
This gives correct attribution without a second mutation path.

**D4 — an entry is a fact, not a narration.** Each entry stores source, label, timestamp, whether it
changed anything, the resulting revision, the affected entity IDs, and the error and warning counts
after the change. Rendering turns that into a sentence. Do not store pre-formatted prose.

**D5 — the feed lives in the right panel, above the validation summary.** Both are consequences of
the last change and share the `.creator-validation` sectioning pattern. A fourth grid column was
rejected because `.creator-layout` already collapses twice for narrow viewports.

## Implementation tasks

1. **Activity model.** New `src/features/creator/activity/activity-log.ts`: the `ActivityEntry`
   type, `createActivityLog(limit)` with `append` and `entries`, and a pure `describeActivity(entry,
   names)` that produces the display sentence, mirroring how `describeValidationIssue` already
   separates data from copy. Keep it free of React so it is unit-testable.

2. **Recorder context.** New `src/features/creator/activity/activity-context.tsx`: a provider
   holding the log in state, exposing `record(entry)` and `runAsTool(toolName, fn)`, and subscribing
   to `store.subscribe` for project changes outside a tool window. Follow the existing subscription
   pattern in `project-persistence-boundary.tsx`, including the Strict Mode single-subscription
   behaviour that file's tests already lock down.

3. **Tool instrumentation.** Add `withActivityRecording(tools, recorder)` in
   `src/features/webmcp/` and call it from `registerRoomTools`. The recorder is optional so
   non-editor callers and existing unit tests keep working unchanged. Capture the tool name, a short
   argument summary, `ok`, `changed`, `revision`, `affectedEntityIds` and the validation counts from
   the existing result envelope; do not re-read the store to build an entry.

4. **Feed component.** New `src/features/creator/components/activity-feed.tsx`, rendered in the
   right `aside` above `ValidationSummary`. Newest first, an agent/you badge per entry, the entity
   names it touched, and the resulting error and warning counts. Empty state explains that agent
   actions will appear there. Use the existing `creator-*` class conventions and `aria-live="polite"`
   consistent with the validation list and the toolbar status. Add the styles to
   `src/app/globals.css` beside `.creator-validation`.

5. **Entry to selection.** Give the feed an `onSelect` callback wired to the existing `select(id)` in
   `EditorWorkspace`, so clicking an entry selects the first affected entity and opens its inspector.
   Selection stays local state in `EditorWorkspace`; do not lift it into a context for this.

6. **Guard the file budget.** `creator-editor.tsx` is at 222 lines and `room-plan.tsx` at 481. Put
   all new code in the new files above; if `creator-editor.tsx` grows past roughly 300 lines, extract
   the right panel into its own component rather than absorbing the feed inline.

7. **Scripted demo path.** Add `docs/DEMO_SCRIPT.md`: the exact prompts and the expected observable
   result for each step, starting from `/creator?start=demo`. The script is the contract for the
   Phase 24 video and for manual verification, and it must exercise a manual change, an agent read,
   an agent change, a validation failure, and an agent correction using the Phase 21 tools.

## Acceptance criteria

- Every tool invocation, including read-only and failed ones, produces exactly one feed entry.
- A manual edit produces exactly one entry attributed to the user, and does not produce an extra
  agent entry.
- A batch apply from Phase 21 produces one entry naming all affected entities, matching its single
  undo step.
- A rejected tool call is visible as a failed entry with its error code, and the project is unchanged.
- Clicking an entry selects the entity and opens its inspector panel.
- The feed is bounded: the fifty-first entry evicts the first, and long sessions do not grow memory.
- Undo and redo appear in the feed and keep the displayed revision consistent with the store.
- With WebMCP unavailable, the editor and the feed both render; the feed simply stays at the manual
  entries and the existing unavailable banner still explains why.
- The full loop in `docs/DEMO_SCRIPT.md` completes in one session against the deployed build.

## Tests

- `src/features/creator/activity/activity-log.test.ts` — append, eviction at the limit, ordering,
  `describeActivity` copy for agent, manual, failure, no-op and batch entries.
- `src/features/creator/activity/activity-context.test.tsx` — `runAsTool` attribution, manual
  attribution from the store subscription, one subscription under Strict Mode.
- `src/features/webmcp/with-activity-recording.test.ts` — wrapper records success, failure and
  read-only calls, passes arguments and the abort signal through untouched, and returns the original
  result object unmodified.
- `src/features/creator/components/activity-feed.test.tsx` — empty state, agent and manual entries,
  failure styling, selection callback, `aria-live` region.
- `src/features/webmcp/creator-room-flow.integration.test.tsx` — extend the existing flow to assert
  the feed shows the agent's read, its mutation, the validation failure and the correction, in order,
  in the same rendered editor. This is the test that proves the exit gate.

## Manual checks

Run `docs/DEMO_SCRIPT.md` end to end in a fresh WebMCP session against the deployed build, and
capture screenshots at the moments Phase 23 needs: the demo layout with its warning, an agent entry
in the feed next to the validation panel, and the corrected layout. Store them where Phase 23 can
reference them and record their provenance.

## Exit gate

All acceptance criteria hold, the demo script runs clean in a fresh session, `npm run agent:verify`
passes, and `npm run build` passes because the editor's client component tree changed. Delete this
file and its index row afterwards; keep `docs/DEMO_SCRIPT.md`, which Phase 24 consumes.
