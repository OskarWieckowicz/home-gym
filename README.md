# Home Gym Creator

Home Gym Creator is a WebMCP-first application for planning a home gym together with an AI
agent. A person and an agent edit the same room model through the same domain operations: room
dimensions, obstacles, equipment placement, clearance zones, collisions, and budget.

Built for the [WebMCP Challenge](https://webmcp.devpost.com/). All products and brands in the
catalog are fictional.

## Status

Early development. The routes and navigation exist; the planner, the catalog, and the WebMCP
tools are being built. The current plan is in
[`plans/README.md`](./plans/README.md).

| Route | Purpose | State |
| --- | --- | --- |
| `/` | Landing page | Hero shell |
| `/catalog` | Equipment catalog | Placeholder |
| `/creator?start=demo` | Creator with the sample project | Placeholder |
| `/creator?start=new` | Creator with an empty project | Placeholder |

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

Once the tools are registered on `/creator`, they can be exercised in either environment:

- **ChatGPT**: open the app in the ChatGPT desktop app's built-in browser with a model that has
  site tools enabled, then let the agent discover the page's tools.
- **Chrome**: use Chrome 149 or newer, enable `chrome://flags/#enable-webmcp-testing`, restart
  the browser, and open `/creator`.

## Documentation

Product concept, technical architecture, challenge requirements, and UI mockups live in the
[`docs`](./docs) directory. The active implementation queue and detailed phase plans live in
[`plans`](./plans).

## License

[MIT](./LICENSE)
