# WebMCP — sources and technical documentation

> Information status: 28 August 2026. WebMCP is an experimental and evolving standard. Before deployment and recording the video, re-check the specification, implementation status, and behavior of supported browsers.

## Five main sources

### 1. OpenAI WebMCP Showcase

**Link:** [developers.openai.com/showcase?view=webmcp-apps](https://developers.openai.com/showcase?view=webmcp-apps)

The showcase contains sample applications designed for human–agent collaboration. It is a source of product and UX inspiration, not a formal API specification.

It is worth analyzing in the examples:

- how manual operations are separated from those performed by the agent,
- whether the human and the agent work on the same state,
- which operations read state and which change it,
- how the application visualizes a tool's action,
- how the agent receives enough data to verify the result,
- how narrow the main demo scenario is.

The most useful examples for Home Gym Creator:

#### Codex Modeling Studio

**Link:** [Codex Modeling Studio](https://developers.openai.com/showcase/codex-modeling-studio)

A browser-based 3D studio where the agent can read the scene and modify geometry and materials. This is the closest example of collaboration on a spatial canvas.

Things to check:

- how the scene is represented as agent-understandable state,
- tools that create and edit objects,
- visible viewport updates,
- iterative agent–validation–fix work.

#### Verdant Market

**Link:** [Verdant Market](https://developers.openai.com/showcase/verdant-market)

A fictional grocery store where the agent can search the catalog, read products, and manage a shared cart.

Things to check:

- catalog tool structure,
- product search and filtering,
- reading product details,
- shared catalog and cart state,
- visible confirmation of changes made by the agent.

#### Webroom

**Link:** [Webroom](https://developers.openai.com/showcase/webroom)

A photo editor where the user and the agent work on the same image. It shows a shared-editor pattern with many read/write operations.

Things to check:

- editor tool granularity,
- the split between reading and mutating tools,
- the agent continuing work after a manual user change.

#### Sunday Table

**Link:** [Sunday Table](https://developers.openai.com/showcase/sunday-table)

A meal, recipe, and shopping planner. It may be useful as a pattern for combining user preferences, constraints, item selection, and a final shopping list.

### 2. Official WebMCP specification

**Link:** [webmachinelearning.github.io/webmcp](https://webmachinelearning.github.io/webmcp/)

**Test suite:** [wpt.fyi/results/webmcp](https://wpt.fyi/results/webmcp)

This is the canonical API contract: a Draft Community Group Report dated 26 August 2026, published by the Web Machine Learning Community Group. It is not a W3C standard and is not on the W3C standardization track.

Editors: Brandon Walderman (Microsoft), Khushal Sagar (Google), Dominic Farolino (Google).

The specification defines that a WebMCP page acts like an MCP server whose tools execute in client-side script, not on a backend. This enables the user and the agent to work together in the same interface.

API surface (`document.modelContext`):

- `registerTool(tool, options?)` — register a tool,
- `getTools(options?)` — read tools from the document and its descendants (for in-page JavaScript agents),
- `executeTool(tool, inputObject?, options?)` — call a tool; the result is serialized to a JSON string,
- `ontoolchange` — event when the tool set changes.

Tool definition (`ModelContextTool`):

- `name` — 1–128 characters; ASCII alphanumeric plus `_`, `-`, `.` only,
- `title` — UI label (localizable),
- `description` — natural-language description for the agent,
- `inputSchema` — a JSON Schema object,
- `execute(inputObject, { signal })` — callback; `signal` is an `AbortSignal` for cancelling execution,
- `annotations.readOnlyHint` — the tool only reads state,
- `annotations.untrustedContentHint` — the result contains untrusted content.

Registration options: `exposedTo` (origins to which the tool is visible) and `signal` (`AbortSignal` unregisters the tool after abort).

Important specification constraints:

- The API requires a secure context and an origin-keyed agent cluster (except `file:`); otherwise `SecurityError`.
- Access is gated by Permissions Policy `"tools"` with a default allowlist of `'self'`.
- The tool name must be unique in a given `ModelContext`; re-registering the same name rejects the promise (`InvalidStateError`).
- The Declarative API in the specification is still TODO — for now the [Declarative API explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md) applies.
- The browser agent does not use `getTools()`; it discovers tools through its own page-observation mechanism.

Check the specification when answers are needed about the exact API contract, errors, cancellation, origin isolation, iframes, and events.

### 3. WebMCP repository

**Repository:** [github.com/webmachinelearning/webmcp](https://github.com/webmachinelearning/webmcp)

The repository complements the rendered specification with explainers, implementation status, security issues, and active discussions.

The most important documents:

- [README / main explainer](https://github.com/webmachinelearning/webmcp/blob/main/README.md)
- [Implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)
- [Declarative API explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md)
- [Security and privacy questionnaire](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md)
- [Open issues](https://github.com/webmachinelearning/webmcp/issues)
- [TypeScript types — `webmcp-types`](https://www.npmjs.com/package/webmcp-types)

Check the repository when answers are needed about:

- browser implementation status,
- planned but not-yet-available capabilities,
- discussion of multimodal arguments and security,
- practical examples and TypeScript types.

### 4. Chrome WebMCP documentation

**Polish version:** [developer.chrome.com/docs/ai/webmcp?hl=pl](https://developer.chrome.com/docs/ai/webmcp?hl=pl)

**English version:** [developer.chrome.com/docs/ai/webmcp](https://developer.chrome.com/docs/ai/webmcp)

Chrome's documentation describes the practical WebMCP implementation in the browser, local setup, available APIs, limitations, and security requirements.

Related documents:

- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api)
- [Best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Evals](https://developer.chrome.com/docs/ai/webmcp/evals)
- [Origin trial](https://developer.chrome.com/origintrials/#/view_trial/4365061253447380993)

Check the Chrome documentation during:

- local browser setup,
- implementing tools,
- debugging registration,
- testing input schemas,
- verifying limitations of the current Chrome version,
- preparing the application for an origin trial or public hosting.

[Evals for WebMCP](https://developer.chrome.com/docs/ai/webmcp/evals) describes how to test tools against a generative model. Deterministic tests check tool logic; evals check whether the agent chooses the right tool, arguments, and call order.

Before exposing tools, confirm that the agent:

- understands the tool's purpose from the description and schema,
- selects the right tool with correct parameters,
- uses one tool's result for the next call,
- can complete the user's scenario with the available tool set.

Typical failure modes:

- the agent skips a tool or calls the wrong one,
- the agent calls tools in the wrong order,
- arguments do not map the user's intent onto `inputSchema`,
- the tool result is too sparse, too verbose, or unusable for the next step,
- a JavaScript error does not return to the agent in a readable form.

The documentation recommends first testing tools in isolation (`expectedCall` against the full tool set in a given state), then end-to-end scenarios with `ordered` / `unordered` chains, and failures in the middle of a chain. The CLI tool is in [webmcp-evals](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/webmcp-evals).

### 5. Google Chrome Labs tools and demos

**Repository:** [github.com/GoogleChromeLabs/webmcp-tools](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main)

**Awesome list:** [AWESOME_WEBMCP.md](https://github.com/GoogleChromeLabs/webmcp-tools/blob/main/AWESOME_WEBMCP.md)

A set of developer tools and official Google Chrome Labs demos for adopting WebMCP. This is a source of practical implementation and debugging patterns, not an API specification.

Developer tools:

- [Model Context Tool Inspector](https://github.com/beaufortfrancois/model-context-tool-inspector) — a Chrome extension for inspecting registered tools, input schemas, and connection issues,
- [WebMCP Evals](https://developer.chrome.com/docs/ai/webmcp/evals) — Chrome documentation and a [CLI](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/webmcp-evals) for checking whether the agent calls tools according to test cases,
- [WebMCP Studio](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/webmcp-studio) — an environment for working with WebMCP tools,
- polyfill — lets tools and related CSS pseudo-classes run in browsers without the native API.

The most useful demos for Home Gym Creator:

- [The Morning Ritual](https://googlechromelabs.github.io/webmcp-tools/demos/coffee-shop/) — catalog, product specifications, and navigation (imperative),
- [Luxe Leather](https://googlechromelabs.github.io/webmcp-tools/demos/leather-bag/) and [WebMCP Sports](https://googlechromelabs.github.io/webmcp-tools/demos/sport-shop-angular/) — store: search, policies, cart,
- [UrbanEstates](https://googlechromelabs.github.io/webmcp-tools/demos/real-estate-map/) — filters and a map view (imperative),
- [WebMCP Smart Home](https://googlechromelabs.github.io/webmcp-tools/demos/smart-home/) — a dashboard where the agent reconfigures spatial elements,
- [Explainer mini-site](https://googlechromelabs.github.io/webmcp-tools/demos/explainer/) — a comparison of page scraping with WebMCP tools.

Check the repository during:

- reviewing how other applications register imperative and declarative tools,
- debugging tool exposure in Chrome,
- evaluating the polyfill if the native API is unavailable,
- looking for ready-made catalog, cart, and filter patterns.

## What WebMCP is

WebMCP lets a web application expose its functionality as tools described by a name, a natural-language description, and a structured input schema. A tool can be:

- a JavaScript function registered through the Imperative API,
- an HTML form exposed through the Declarative API.

An agent can discover the open page's tools, call them, and receive a structured result. Tool code runs in the page context and can reuse existing application logic and update the same interface the user sees.

WebMCP is designed for local in-browser work with a human in the loop. It is not a replacement for backend MCP or an ordinary server API.

## Imperative API

The Imperative API lets tools be registered in JavaScript, roughly in the following form:

```ts
await document.modelContext.registerTool({
  name: "get_project_state",
  description: "Read the current room, obstacles, placed equipment and budget.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  annotations: {
    readOnlyHint: true
  },
  execute: async () => {
    return getProjectState();
  }
});
```

This will likely be the main API for Home Gym Creator, because the application exposes custom operations on state, the catalog, and a geometric scene.

Example uses:

- reading the entire project,
- searching products,
- adding obstacles,
- placing and moving equipment,
- running layout validation,
- fetching the shopping list.

## Declarative API

The Declarative API lets a standard HTML form be marked as a tool. The browser can then create a tool definition without separately registering a full JavaScript function.

It may be useful for simple forms, for example:

- setting a budget,
- providing basic preferences,
- a contact form,
- simple catalog filtering.

It will likely not be sufficient for canvas and geometry operations. Use the Imperative API in those areas.

## Important limitations

### The page must be open

Tools execute JavaScript in the page context, so an open tab or webview is required. The agent will not discover tools of a page it has not visited.

### WebMCP does not replace a backend

WebMCP exposes UI capabilities and client-side logic to the agent. It does not replace a database, catalog API, authentication, or backend MCP that runs independently of the open page.

### A complex interface needs a shared state model

In a canvas application, do not implement separate logic for user clicks and for WebMCP. Both paths should call the same domain commands and update the same store.

### The standard is still changing

Not all discussed capabilities are stable or implemented. Regularly check `implementation-status.md`, issues, and the documentation for the specific browser version.

### Multimodal arguments are an open topic

Support for binary and multimodal tool inputs and outputs is still under discussion in the specification.

For Home Gym Creator, a safe flow looks like this:

1. the user sends a room photo to the agent,
2. the agent analyzes the photo and collects reference measurements,
3. the agent calls ordinary WebMCP tools with structured geometry,
4. the application creates the room and obstacles,
5. the user manually approves or corrects the result.

Do not make the MVP depend on passing an image directly as a WebMCP argument.

## Security and permissions

WebMCP crosses the traditional trust boundary between the page and the agent. The project should:

- use `readOnlyHint` for operations that do not change state,
- mark external data as untrusted if the API allows it,
- apply the application's existing authentication and authorization,
- validate all tool arguments on the application side,
- not trust JSON Schema alone to replace execution validation,
- return enough data for the agent and the user to inspect the result,
- limit tools to the smallest required scope,
- clearly separate reads from mutations,
- avoid performing irreversible operations without confirmation.

WebMCP is constrained by origin isolation and Permissions Policy. In particular, a `document.domain` configuration may disable the API, and a cross-origin iframe requires an appropriate `tools` policy.

## Local Chrome setup

According to current documentation, local testing looks like this:

1. install a Chrome version that supports WebMCP,
2. open `chrome://flags/#enable-webmcp-testing`,
3. set the flag to `Enabled`,
4. restart Chrome,
5. open the application directly,
6. check registered tools, their schemas, responses, and errors.

Before public deployment, check the current origin-trial and HTTP-header requirements.

## Source usage order

### When designing the product

1. OpenAI WebMCP Showcase — UX patterns and human–agent scenarios.
2. Home Gym Creator product concept — the project's own problem and scope.
3. Chrome best practices — tool strategy and granularity.

### When designing tool contracts

1. the official WebMCP specification,
2. Chrome Imperative API documentation,
3. security documentation,
4. implementation status and issues in the repository.

### During development and debugging

1. Chrome documentation for the currently used version,
2. Tool Inspector and demos from `webmcp-tools`,
3. `implementation-status.md`,
4. open WebMCP issues,
5. sample applications and their public implementations, if available.

### Before submission

1. the official challenge rules,
2. current OpenAI Docs on site tools,
3. Chrome documentation and origin-trial requirements,
4. isolated tool evals and an end-to-end scenario,
5. a test in a fresh ChatGPT/Codex session,
6. a test in a fresh Chrome session.

## Related project documents

- [Product concept](./PRODUCT_CONCEPT.md)
- [Hackathon requirements](./HACKATHON_REQUIREMENTS.md)

## Phase 4 implementation contract

The following decisions were checked on 28 August 2026 against the current
[WebMCP specification](https://webmachinelearning.github.io/webmcp/),
[Chrome Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api), and
[Chrome tool-security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools).
The table separates facts from current sources from local Home Gym Creator decisions.

| Area | Fact verified in a primary source | Project decision |
|---|---|---|
| Entry point | The Imperative API is available as `document.modelContext`; `navigator.modelContext` is not the current contract. | Detect `document.modelContext?.registerTool` only after hydration. |
| Registration | `registerTool(tool, options)` returns a `Promise` and may reject registration, including for a duplicate name, missing permissions, or unmet security requirements. | Register and await both tools; any rejection means the entire catalog contract is unavailable. |
| Cleanup | `options.signal` unregisters the tool after the signal is aborted. | One `AbortController` per mounted bridge; the same signal for both tools; `abort()` on leaving the route segment, Strict Mode remount, and partial failure. |
| Execute callback | The current draft defines `execute(inputObject, { signal })`, but the local Codex In-app Browser runtime checked on 28 August 2026 does not pass `signal` in the callback options. | The handler validates `unknown` with Zod and handles an optional execution signal when the runtime provides it; do not confuse it with the registration lifecycle signal. |
| Input schema | `inputSchema` is a JSON Schema object; the schema advertised to the agent does not replace application validation. | Generate simple, strict object schemas via `z.toJSONSchema()`, with `additionalProperties: false`, without constructs unsupported by JSON Schema. |
| Result | A fulfilled callback value is serialized to JSON; a callback error or a non-serializable value causes an execution error. | Return only plain, stable application data envelopes; do not use backend MCP `{ content: ... }`. |
| Annotations | The current contract exposes a boolean `readOnlyHint`, among others; it means no state modification. | Both catalog tools have `annotations: { readOnlyHint: true }`. The local, validated catalog does not require `untrustedContentHint`. |
| Typing | The normative contract is described by Web IDL; found external TypeScript packages are not an official source and may lag the draft. | Keep narrow types only at the WebMCP adapter, without globally extending `Document`. |
| Security | The API requires a secure context, an origin-keyed agent cluster, and the `tools` permission policy; the default allowlist is `'self'`. | Phase 4 does not add cross-origin exposure or special headers. Rejected registration yields a non-blocking UI fallback. |
| Phase scope | The standard contract does not prove availability in a specific judge environment or a correctly configured public origin. | Phase 4 tests logic locally; phase 5 is a hard gate for public hosting, discovery, and a real agent call. |

### Verification matrix and bounded unknowns

| Owner | Experiment | Pass criterion | Safe fallback |
|---|---|---|---|
| Phase 4 | Tests of schemas, handlers, serialization, atomic registration, cleanup, and the React bridge | Strict inputs and all planned envelopes are deterministic and serializable; an unsupported browser keeps the manual catalog | A tools-unavailable message with no effect on the catalog |
| Phase 4 | Local Chrome with the current WebMCP flag: fresh load, direct detail route, navigation, remount, and calls | Exactly two tools, no duplicates, cleanup on exit, and correct results | Do not close the phase without recording a missing runtime attempt |
| Phase 5 | Public secure origin and current origin-trial/header requirements | Tools register without `SecurityError`/`NotAllowedError` in the target environment | Correct hosting configuration; do not create backend MCP as a workaround |
| Phase 5 | Fresh session of supported Codex/ChatGPT: discovery, search, and details | The agent discovers tools and correctly joins `productId` from a search result to details | Stop further WebMCP phases and adapt the contract to the verified runtime |
| Phase 5 | Compare `execute` callback signatures and helper `executeTool()` in the specification, Chrome, and the agent environment | Calls work both in a runtime that passes `{ signal }` and in the locally observed runtime without a second argument | Keep an optional signal adapter and do not use `executeTool()` in product code; the helper is only for in-page diagnostics |
| Phases 8–12 | Empty/invalid project states, the read → search → mutate → validate → fix sequence, and evals | The full shared scenario passes in the agent environment | Do not extend read-only catalog tools with premature mutations |

Implementation status, Chrome version, available models, origin trial, and the judge
environment must be refreshed again immediately before recording the video and submitting.
These are time-sensitive claims, not durable architecture assumptions.
