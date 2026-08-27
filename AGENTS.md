# Home Gym Creator repository guidance

## Project context

Home Gym Creator is a WebMCP-first home-gym planning application. The defining product behavior is that a person and an AI agent edit the same room model through the same domain operations.

Before changing behavior, read only the project documents relevant to the task:

- `docs/PRODUCT_CONCEPT.md` for product intent and MVP scope.
- `docs/TECHNICAL_ARCHITECTURE.md` for module boundaries and implementation decisions.
- `docs/HACKATHON_REQUIREMENTS.md` for submission constraints.
- `docs/WEBMCP_SOURCES.md` for the project's current WebMCP research and source map.
- `docs/LANDING_PAGE.md` and `docs/EDITOR_MOCKUP.md` for their respective UI surfaces.

Treat time-sensitive external claims as candidates for verification rather than permanent facts.

## Architecture invariants

- UI actions and WebMCP tools must call the same domain commands and update the same project store.
- Keep geometry, placement validation, collision detection, and rule checking deterministic. The runtime agent interprets results; it does not replace the geometry engine.
- Register WebMCP tools on the client after the creator is running. Do not create a separate backend-only planning path for the MVP.
- Validate tool arguments at runtime. Prefer Zod constructs with unambiguous JSON Schema equivalents.
- Return structured tool results that let both the calling agent and the user verify the resulting state.
- Make agent mutations visible and compatible with the same undo/redo history as manual edits.
- Preserve the agreed MVP boundary unless the user explicitly expands it.

## Working agreements

- Inspect the current tree and nearby code before editing. Preserve unrelated user changes.
- Prefer `rg` and targeted file reads over broad scans.
- Make the smallest coherent change that satisfies the request.
- Write concrete implementation plans as Markdown files in the repository-root `plans/` directory. Use chat for brief outlines only; once a plan is detailed enough to guide implementation, persist it there.
- Add or update tests for changed behavior, especially domain commands, geometry, schemas, WebMCP contracts, and the main shared-editing flow.
- Run the narrowest relevant checks first, then broader validation when proportionate to the change.
- Do not invent package-manager, build, lint, or test commands before the repository defines them.
- Summaries should identify changed behavior, validation performed, and any remaining risk or unverified assumption.

## Subagent orchestration

The primary agent owns task decomposition, final decisions, repository-wide edits, and synthesis. Subagents must stay within their assigned scope and must not spawn further agents unless the primary agent explicitly asks them to.

- Use the built-in `worker` for bounded implementation and fixes.
- Use the built-in `explorer` for read-heavy code discovery, execution-path tracing, and locating relevant tests.
- Use `planner` when work is ambiguous, crosses multiple modules, or needs sequencing and acceptance criteria before implementation.
- Use `researcher` when a decision depends on current external documentation, standards, APIs, compatibility, or other internet research.
- Use `reviewer` after material changes to core domain logic, geometry, WebMCP contracts, persistence, security boundaries, or critical user flows, and whenever the user requests review.
- Skip delegation for small, self-contained tasks where coordination would add more work than value.
- Parallelize independent read-only exploration or research when useful. Avoid parallel edits to overlapping files or behavior; assign one worker as the owner of a given implementation area.
- Give every delegated task a bounded question, relevant context, expected evidence, and required return format. The primary agent waits for required results and delivers one consolidated answer.

These development subagents are separate from the end-user AI agent demonstrated by the Home Gym Creator product.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
