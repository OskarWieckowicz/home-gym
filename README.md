# Home Gym Creator

Home Gym Creator is a WebMCP-first room planner where a person and an AI agent design the
same home gym in the same interface. Both use the same domain commands, deterministic geometry,
validation, project store, and undo/redo history.

**Live demo:** [home-gym-coral.vercel.app](https://home-gym-coral.vercel.app/)

**Try the prepared project:**
[home-gym-coral.vercel.app/creator?start=demo](https://home-gym-coral.vercel.app/creator?start=demo)

Built for the [WebMCP Challenge](https://webmcp.devpost.com/). All products and brands in the
catalog are fictional.

## The problem

Planning a home gym is a spatial problem, not just a shopping problem. Equipment has to fit around
walls, doors, furniture, exercise clearance, training goals, and a budget. A chat-only assistant can
suggest products, but it cannot reliably inspect or update the user's current layout.

Home Gym Creator exposes the open page and its live room state through WebMCP. The user can edit the
room manually, ask an agent to continue from those changes, inspect the visible result, undo an agent
operation, and keep refining the same project.

## Product captures

| Room model and obstacles                                                                                                       | Equipment arranged in the same room                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ![A real Home Gym Creator capture showing a room, door, window, and obstacles](public/images/landing/room-with-obstacles.webp) | ![A real Home Gym Creator capture showing gym equipment arranged around the existing room obstacles](public/images/landing/equipment-arrangement.webp) |

These are captures of the running prototype, not design mockups. The arranged-room image does not
claim that every visible placement passes validation; the application reports geometry and access
results separately.

## What a person and an agent can do together

1. The person describes the room, goals, budget, and immovable obstacles.
2. The agent reads the current project and searches the fictional equipment catalog.
3. The agent proposes or applies placements through WebMCP.
4. The application deterministically checks collisions, bounds, clearance zones, ceiling height,
   access, goal coverage, and budget.
5. The person moves or locks an item manually.
6. The agent reads that new state and adapts the rest of the layout.
7. Both can inspect the same shopping list and project summary; every changed mutation shares one
   undo/redo history.

The agent interprets goals and validation results. It does not replace the geometry engine or decide
that an invalid layout is acceptable.

## Main features

- editable 3D/2D room
- room dimensions, physical obstacles, unavailable floor zones, doors, and windows
- 24 fictional products with dimensions, prices, exercises, goals, and placement requirements
- manual and agent-driven equipment selection, placement, movement, rotation, and locking
- deterministic collision, bounds, use-zone, reachability, height, and budget validation
- deterministic placement suggestions and atomic multi-change evaluation/application
- shared undo/redo for manual and WebMCP changes
- local save/restore plus canonical JSON import/export
- shopping list, cost, goal coverage, validation results, and a read-only project summary

## WebMCP implementation

Each route registers tools on the client after its required state is ready. Registration uses the
imperative API through `document.modelContext.registerTool(...)`. Tool inputs are validated at
runtime with Zod-compatible JSON Schemas. Mutations call the same project commands used by the UI
and return structured results containing the affected state, revision, compact validation counts,
and readable errors. Detailed validation is available on demand.

The app exposes 23 route-scoped tool registrations with 20 unique names. Shared read tools are
intentionally available on more than one surface.

### Creator — 20 tools

| Tool                      | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| `get_project_summary`     | Read the deterministic summary shown by the application.              |
| `get_project_state`       | Read the live room, settings, items, placements, and history state.   |
| `configure_room`          | Set room width, depth, and height.                                    |
| `update_project_settings` | Update budget and training goals.                                     |
| `add_obstacle`            | Add a physical obstacle or explicit unavailable floor zone.           |
| `update_obstacle`         | Edit or unlock an existing obstacle or unavailable zone.              |
| `remove_obstacle`         | Remove an unlocked obstacle or unavailable zone.                      |
| `add_wall_element`        | Add a door or window to a wall.                                       |
| `update_wall_element`     | Edit an existing door or window.                                      |
| `remove_wall_element`     | Remove a door or window.                                              |
| `validate_layout`         | Read deterministic validation without changing the project.           |
| `search_products`         | Search the catalog with bounded results and truncation metadata.      |
| `get_product_details`     | Read complete spatial, commercial, and training data for one product. |
| `place_product`           | Buy and place a catalog product in one undoable operation.            |
| `add_product_to_project`  | Add a product to the shopping list without placing it.                |
| `place_project_item`      | Place an existing unplaced project item.                              |
| `update_placement`        | Move, rotate, lock, or unlock placed equipment.                       |
| `unplace_product`         | Remove equipment from the room while keeping it on the shopping list. |
| `remove_product`          | Remove a project item and its placement.                              |
| `suggest_placements`      | Generate deterministic placement candidates without mutation.         |

### Catalog — 2 read-only tools

| Tool                  | Purpose                                                               |
| --------------------- | --------------------------------------------------------------------- |
| `search_products`     | Search the same fictional catalog shown in the UI.                    |
| `get_product_details` | Read complete commercial, spatial, and training data for one product. |

### Summary — 1 read-only tool

| Tool                  | Purpose                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `get_project_summary` | Read the same cost, goals, checks, recommendations, and floor figures shown on the page. |

The concrete registration adapter is in
[`src/features/webmcp/register-tool-set.ts`](src/features/webmcp/register-tool-set.ts), with
route tool sets in [`src/features/webmcp`](src/features/webmcp).

## Reproduce the recorded demo

The [demo video](https://youtu.be/K0T5CqgSxZQ) starts from a fresh project and uses this room image
as visual context for the agent:

![Example room used as input for the recorded demo](public/assets/example-room.png)

Open [a new project](https://home-gym-coral.vercel.app/creator?start=new) in a WebMCP-capable browser,
attach the image to the agent, and use the following prompts.

### 1. Recreate the room

> Help me recreate this 4 × 6 m room using the Home Gym Creator WebMCP tools. Do not perform manual
> UI interactions.
>
> Analyze the attached photo and create an approximate room model with the visible furniture, door,
> and windows, including furniture clearance zones (functional zones).
>
> Keep the room items unlocked for now. When the room is ready, stop and wait for me to review it.
> Lock the items only after I approve the layout, and before selecting any gym equipment.

### 2. Propose the equipment

> I approve the room.
>
> Now propose a home gym setup for:
>
> - Training focus: strength
> - Exercises: pull-ups, squats, bench press, and deadlifts
> - Experience level: intermediate
> - Installation: wall drilling is allowed, but floor anchoring is not
> - Budget: $5,000
>
> First, present the proposed equipment list and wait for my approval. After I approve it, place the
> equipment using WebMCP and validate the final layout.

### 3. Place and validate

> I approve the equipment list. Place it in the room and validate the final layout.

## Testing WebMCP

No account or credentials are required. Project data is stored locally in the browser. Judges can
open the prepared demo for a quick test or start a new project to reproduce the complete workflow
described above.

### ChatGPT in-app browser

1. Start a new chat with a WebMCP-capable model.
2. Open either the [prepared demo project](https://home-gym-coral.vercel.app/creator?start=demo) or
   [a new project](https://home-gym-coral.vercel.app/creator?start=new) in ChatGPT's in-app browser.
3. Ask the agent to read the current project and validate the layout. For a new project, attach the
   example room image and follow the recorded demo prompts above.
4. Move an unlocked item manually, then ask the agent to read the updated state and adapt the layout.
5. Confirm that the agent's changes appear in the editor and can be reversed with the manual Undo
   control.

### Google Chrome

1. Install a Chrome version that supports WebMCP.
2. Open `chrome://flags/#enable-webmcp-testing`.
3. Set the WebMCP testing flag to **Enabled** and restart Chrome.
4. Open either the prepared demo or a new project using one of the links above.
5. Repeat the same read, manual edit, agent update, validation, and Undo flow.

## Architecture

```text
Manual UI interactions ──┐
                         ├──→ shared Zustand project store ──→ shared project commands
WebMCP tool handlers ────┘                  │                            │
                                           ├── shared undo/redo         ├── deterministic geometry
                                           ├── local persistence        │   and validation
                                           │   and JSON codec            └── structured WebMCP results
                                           └── derived project summary
```

Important boundaries:

- [`src/features/project`](src/features/project) owns schemas, commands, validation, suggestions,
  serialization, and deterministic project derivations.
- [`src/features/geometry`](src/features/geometry) owns spatial calculations and has no agent or UI
  decision-making.
- [`src/features/creator`](src/features/creator) owns the shared store, persistence, 2D/3D editing,
  and manual interaction adapters.
- [`src/features/webmcp`](src/features/webmcp) validates tool arguments and adapts them to the same
  project commands.
- [`src/features/summary`](src/features/summary) renders the summary UI from the deterministic model
  calculated in [`src/features/project/summary`](src/features/project/summary).

The full design and command flow are documented in
[`docs/TECHNICAL_ARCHITECTURE.md`](docs/TECHNICAL_ARCHITECTURE.md).

## Routes

| Route                 | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `/`                   | Landing page and agent setup guide.             |
| `/catalog`            | Searchable fictional equipment catalog.         |
| `/catalog/[slug]`     | Product details and planning entry.             |
| `/creator`            | Resume the project saved in this browser.       |
| `/creator?start=demo` | Open the prepared room and equipment scenario.  |
| `/creator?start=new`  | Start an empty project.                         |
| `/summary`            | Read-only summary of the locally saved project. |

Explicit demo/new starts ask before replacing an existing saved project. A fresh session starts
directly; refreshing after edits restores those edits instead of resetting the room.

## Local development

### Requirements

- Node.js 20 or newer
- npm

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Validation commands

```bash
npm run test             # Vitest test suite
npm run quality:quick    # lint errors, TypeScript, file-size guard, duplicate detection
npm run agent:verify     # canonical local gate, including all tests
npm run build            # production Next.js build
```

## Persistence and prototype limits

- Projects are stored in one browser-local `localStorage` slot; there is no account, cloud sync,
  backend project database, or shareable project URL.
- JSON import/export is the portable project format.
- Undo/redo is shared within the active editor session; it is not persisted across navigation.
- The room is rectangular and the geometry is intentionally simplified.
- Photo interpretation happens in the external multimodal agent; the app does not perform automatic
  image reconstruction.
- The catalog is fictional, prices are illustrative, and there is no checkout.
- This is not professional CAD, construction guidance, or a safety assessment.

## Assets and licensing

The catalog, names, product data, screenshots, generated geometric models, and project graphics are
part of this repository. The two README images above are real application captures supplied for the
project and distributed with the repository. Their processing and provenance are documented in
[`docs/LANDING_ASSETS.md`](docs/LANDING_ASSETS.md).

The separate landing-page hero is explicitly labeled as an AI-generated concept and is not used in
this README as evidence of application output. Dependency licenses remain governed by their
respective packages.

This project is released under the [MIT License](LICENSE).
