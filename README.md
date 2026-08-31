# Home Gym Creator

Home Gym Creator is a WebMCP-first application for planning a home gym together with an AI
agent. A person and an agent edit the same room model through the same domain operations: room
dimensions, obstacles, equipment placement, clearance zones, collisions, and budget.

Built for the [WebMCP Challenge](https://webmcp.devpost.com/). All products and brands in the
catalog are fictional.

## Status

Implemented locally: editable 3D/2D planning, a shared manual/WebMCP command path, local
save/restore and JSON import/export, deterministic validation, and a read-only project summary.
Public-build and target-agent acceptance remain in the [submission plan](plans/phase-28-submission.md).
The [active queue](plans/README.md) tracks the remaining catalog, asset and submission work.

| Route | Purpose |
| --- | --- |
| `/` | Landing and agent setup guide |
| `/catalog` | Equipment catalog with filters |
| `/catalog/[slug]` | Product details |
| `/creator` | Resume the locally saved project |
| `/creator?start=demo` | Open the sample layout; confirm before replacing a saved project |
| `/creator?start=new` | Start an empty room; confirm before replacing a saved project |
| `/summary` | Read-only summary of the locally saved project |

When a saved project exists, Keep my project or Escape resumes its latest saved state without
replacing it. A fresh session starts directly. Confirmed starts are consumed once, so refreshing
after edits restores those edits rather than resetting the room.

## Requirements

- Node.js 20 or newer
- npm

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev              # development server
npm run build            # production build
npm run start            # serve the production build
npm run test             # Vitest
npm run quality:quick    # lint errors, types, file-size guard, duplicate detection
npm run agent:verify     # the full local gate, including tests
```

## Testing WebMCP

Tools register after their route is ready: 21 in the creator, two in the catalog and three
read-only tools in the summary. UI actions and tool mutations share domain commands and undo/redo.
Manual planning remains available when WebMCP is unavailable.

Use the [dated source/setup guide](docs/WEBMCP_SOURCES.md) for browser and agent prerequisites.
Exact supported versions, flags and end-to-end behavior must be checked on the submitted build
in fresh Chrome and ChatGPT/Codex sessions; local tests do not establish that acceptance.

## Documentation

Product concept, technical architecture, challenge requirements, and UI mockups live in the
[`docs`](./docs) directory. The active implementation queue and detailed phase plans live in
[`plans`](./plans).

## License

[MIT](./LICENSE)
