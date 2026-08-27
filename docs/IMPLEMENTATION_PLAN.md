# Home Gym Creator — implementation plan

> Status: working roadmap.
> Created: 27 August 2026. Resequenced: 27 August 2026.
> Horizon: submission deadline on 3 September 2026, 22:00 CEST.
>
> This document sequences the work. It does not restate the product scope
> ([product concept](./PRODUCT_CONCEPT.md)) or the technical decisions
> ([technical architecture](./TECHNICAL_ARCHITECTURE.md)). Detailed per-slice plans belong in
> the repository-root `plans/` directory; this file is the umbrella schedule they hang from.

## 1. Starting point

Already in the repository:

- Next.js App Router 16.3.3, React 19.2.8, TypeScript, Tailwind CSS 4.
- ESLint with SonarJS, Vitest, jscpd duplicate detection, 500-line file guard.
- `npm run quality:quick` and `npm run agent:verify` as the local validation gates.
- Product, architecture, requirements, landing page and editor specifications in `docs/`.
- MIT license, English README, and the `/`, `/catalog`, `/creator` routes with shared navigation
  and the destinations defined by the landing page specification.

Not yet present: the design system, any domain code, the catalog, the editor, WebMCP, and a
public deployment.

## 2. Sequencing principle

Seven days is short enough that ordering matters more than velocity. Four rules drive the
sequence below.

1. **Learn the unknown on the cheap surface.** WebMCP tie-breaks the judging and nobody here has
   run it yet. The catalog is a read-only view over static data, so it teaches registration,
   schemas, result shapes, and the Chrome and ChatGPT plumbing without geometry and shared state
   in the way. The creator gets WebMCP second, when the API is already understood.
2. **Prove it in the judges' environment before building on it.** A successful tool call from
   Codex or ChatGPT against a real page is a hard gate. Nothing downstream starts until it passes.
3. **Manual editing and agent editing are the same code path.** Every editing slice is built as
   domain commands first, so the matching WebMCP slice is wiring rather than a rewrite. This is
   the architecture's core invariant and also the schedule's biggest lever.
4. **Always deployable.** `main` stays green against `agent:verify` and the deployment stays
   openable. A broken URL on 3 September is unrecoverable, not a bug.

### Why the catalog comes before the creator, and the landing page last

The catalog is small, its data is static, and its WebMCP surface is read-only. That makes it the
right place to learn an unfamiliar API. The creator is where the product's value lives, so it
gets the majority of the week — but it gets it after the WebMCP mechanics are settled.

The landing page is the most completely specified part of the project
([landing page specification](./LANDING_PAGE.md)) and carries no technical unknowns, which is
exactly why it should not consume the days when unknowns are still open. Building it now would
also mean building it twice: its hero shows a real 2D plan with clearance zones and a warning,
and its sample-scenario section quotes the demo project's real numbers. Both come from the
editor. Its skeleton already exists, so the flow is real; the full six-section build lands on
2 September.

## 3. Design system

The mockups in [`docs/mockups`](./mockups) define a light interface, not the dark placeholder
the skeleton shipped with:

- page background in light slate, surfaces in white, borders in slate-200,
- headings in near-navy slate, body copy in slate-600,
- one primary accent: blue-600, with blue-50 and blue-100 for selected and highlighted states,
- emerald for "fits the project", amber for "needs more space" and layout warnings,
- generously rounded cards, thin borders, restrained shadows,
- equipment drawn as dark grey solids, clearance zones as translucent blue, selection in amber.

Two deliberate departures from the mockups: the interface copy is English, because every
submission material must be English, and section anchors appear in the header only once the
landing page sections exist.

This is slice S1 because every later surface inherits it. Correcting the palette after the
catalog and the editor exist means restyling pages instead of tokens.

## 4. Slices

| ID | Slice | Timebox |
|---|---|---|
| S0 | Skeleton: routes, navigation, license, README | done |
| S1 | Design tokens and shared components from the mockups | 1 h |
| S2 | Minimal catalog | 4 h |
| S3 | WebMCP theory | 2 h |
| S4 | Read-only WebMCP over the catalog | 3 h |
| S5 | Verification gate in Codex, ChatGPT and Chrome, plus deployment | 2 h |
| S6 | Room domain core | 4 h |
| S7 | Manual room editor | 8 h |
| S8 | WebMCP for the room | 3 h |
| S9 | Catalog depth | 4 h |
| S10 | Equipment in the room | 8 h |
| S11 | WebMCP for placements and suggestions | 5 h |
| S12 | Shared-editing scenario and agent activity feed | 5 h |
| S13 | Landing page and catalog to their specifications | 5 h |
| S14 | Submission | 5 h |

### S1 — Design tokens and shared components

Light theme tokens in `globals.css`, the button and card primitives, and the header, footer,
hero and placeholder pages restyled. No new behavior.

### S2 — Minimal catalog

- The product Zod schema in its **final shape**, including `dimensions` and per-side
  `clearance`. These fields are what S10 validates against, so they are not deferred; only the
  product count, imagery and prose are.
- Eight to twelve products across racks, benches, cardio, weights and accessories.
- `/catalog` as a Server Component grid, `/catalog/[slug]` product pages, and simple filtering.
- Vitest coverage for schema validation and the catalog query helpers.

### S3 — WebMCP theory

Read the OpenAI site-tools documentation, the Chrome WebMCP guide, the imperative API page, the
best-practices page and the security page. Write the working notes and any version-specific
findings into [WebMCP sources](./WEBMCP_SOURCES.md) rather than leaving them in chat.

### S4 — Read-only WebMCP over the catalog

- `src/features/webmcp/` with a client-side registration effect that guards on
  `typeof document.modelContext?.registerTool === "function"` and cleans up through an
  `AbortController`.
- Registration is **scoped per page and reusable**, because tools belong to the open document and
  the creator will register a different, larger set on the same adapter.
- `search_products` and `get_product_details`, both `readOnlyHint`, arguments validated by Zod at
  runtime regardless of the advertised JSON Schema.
- A visible fallback notice in browsers without WebMCP.
- Unit tests per handler for valid and invalid arguments.

### S5 — Verification gate

- Try the ChatGPT desktop browser against `localhost` first; if it refuses, deploy to Vercel and
  retest. Either way the public deployment happens no later than this slice.
- Chrome 149 or newer with `chrome://flags/#enable-webmcp-testing` enabled.
- Confirm discovery after a hard refresh, correct input schemas, useful results, and readable
  errors.

**This is a gate.** If a tool call does not succeed from an agent, work stops here and the cause
gets fixed before S6 begins.

### S6 — Room domain core

Zod schemas and types for room, obstacle, placement and project. Pure geometry for rotated
footprints, room bounds and rectangle intersection. The command pipeline, the Zustand store,
snapshot-based undo/redo. No React, Zustand or Three.js imports in `geometry`. Vitest throughout;
this is the layer the agent's credibility rests on.

### S7 — Manual room editor

Room dimensions, obstacles, door swing zones, the 2D plan, selection, dragging with 10 cm
snapping, 90° rotation, the property panel, and validation messages. No products yet.

Renderer decision to make and record here: React Three Fiber with an orthographic and a
perspective camera is the accepted architecture, but React 19 and Next 16 compatibility must be
verified first. If it costs more than half a day, fall back to an SVG plan and treat 3D as a
later enhancement — the MVP already calls 3D optional, and validation never reads the rendered
geometry.

Every edit here goes through `dispatch(command)`. That is what makes S8 cheap.

### S8 — WebMCP for the room

`get_project_state`, `configure_room`, `add_obstacle`, `update_obstacle`, `remove_obstacle`,
`validate_layout`. Each handler validates arguments, calls the existing command, revalidates the
layout, and returns the outcome with the relevant new state. Agent changes land in the same undo
history as manual ones.

### S9 — Catalog depth

Grow to 30–50 products with complete spatial, commercial and training data, requirements and
constraints. Imagery or simple 3D solids. Filtering by every field the specification lists.

### S10 — Equipment in the room

Placement from the catalog panel, moving and rotating, physical collision and clearance
validation, ceiling height, budget and shopping list, `localStorage` autosave, JSON import and
export, and the demo project preset. The domain layer stays free of `localStorage`.

### S11 — WebMCP for placements and suggestions

`place_product`, `update_placement`, `remove_product`, `apply_layout_changes`, and
`suggest_placements` over the deterministic grid-and-scoring algorithm, so the agent chooses
among candidate positions instead of guessing coordinates.

### S12 — Shared-editing scenario and agent activity feed

Rehearse the judged flow end to end on the public URL: the agent builds the room from a described
photo, places equipment, validation catches a collision, the agent corrects it, the person drags
the rack, the agent reads the new state and adapts the rest. Add an activity feed listing tool
calls and their results — it is what makes the collaboration legible in the video, and the video
is what the judges are guaranteed to see.

### S13 — Landing page and catalog polish

Both surfaces built to their specifications, with real screenshots and the demo project's real
numbers.

### S14 — Submission

Video under three minutes with English narration and visible tool calls. English description
answering all four required WebMCP questions. README with the live URL, screenshots, setup,
tests, WebMCP instructions, tool list and example prompts. Then the pre-submission checklist in
[hackathon requirements](./HACKATHON_REQUIREMENTS.md), with every link checked while logged out
and the flow tested in a fresh session with no local state.

## 5. Day-by-day

| Day | Slices |
|---|---|
| Thu 27 Aug, evening | S1, start S2 |
| Fri 28 Aug | S2, S3, S4, S5 gate, deployment |
| Sat 29 Aug | S6, start S7 |
| Sun 30 Aug | finish S7, S8 |
| Mon 31 Aug | S9, start S10 |
| Tue 1 Sep | finish S10, S11 |
| Wed 2 Sep | S12, S13 |
| Thu 3 Sep | S14, submit before 22:00 CEST |

S1 through S8 are non-negotiable. S12 is what the project is actually judged on. S13 is the first
thing to shrink — one strong hero beats six weak sections.

## 6. Definition of done per slice

- `npm run agent:verify` passes; `npm run build` also passes when routing, Server and Client
  Component boundaries, or Next.js configuration changed.
- Changed behavior has proportionate tests, with no check weakened, skipped or removed.
- No non-test source or configuration file exceeds 500 physical lines.
- The deployment still loads and the demo project still opens.
- Commits are descriptive and dated, since the rules judge work done during the challenge window.

## 7. Risks and fallbacks

| Risk | Signal | Response |
|---|---|---|
| WebMCP does not register in a judge's environment | S5 fails | Stop and fix; adjust headers, origin or policy from evidence, not assumption |
| The minimal catalog expands into the full one | S2 passes four hours | Freeze at the products the demo scenario needs and move on; depth is S9 |
| Room editing gets built as component state | S8 requires touching S7's components | Caught at review; S7 is only done when edits flow through `dispatch` |
| React Three Fiber conflicts with React 19 or Next 16 | Install errors or a blank canvas | Ship the SVG plan, keep 3D optional |
| Placement suggestions feel arbitrary | The agent places equipment in unusable spots | Tune scoring for wall adjacency and a free centre; the agent only picks among deterministic candidates |
| Video and description left to the last hours | Nothing recorded by 2 September evening | Write the narration script on 2 September alongside the landing page |
| Scope creep into non-MVP features | Work starts on accounts, real prices, arbitrary rotation or photo upload | The architecture document's out-of-scope list is binding unless explicitly reopened |

## 8. Boundaries to hold

No accounts, no database, no checkout, no real prices, no in-app OpenAI calls, no server-side
photo analysis, no irregular room outlines, no arbitrary rotation angles, no global layout solver.
Photos reach the project through the agent, which interprets them and calls WebMCP tools with
numeric arguments.

## 9. Related documents

- [Product concept](./PRODUCT_CONCEPT.md)
- [Technical architecture](./TECHNICAL_ARCHITECTURE.md)
- [Hackathon requirements](./HACKATHON_REQUIREMENTS.md)
- [WebMCP sources](./WEBMCP_SOURCES.md)
- [Landing page specification](./LANDING_PAGE.md)
- [Editor mockup specification](./EDITOR_MOCKUP.md)
- [Visual mockups](./mockups)
