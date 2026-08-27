# Phase 3 — WebMCP theory and implementation contract

Umbrella: [implementation plan index](./README.md).  
Status: ready to execute.  
Depends on: no catalog implementation dependency; scheduled after Phase 2 to limit work in
progress.  
Primary output: [WebMCP sources](../docs/WEBMCP_SOURCES.md).

## Goal

Turn the existing WebMCP source map into a current, source-backed implementation contract for
Phase 4. The phase ends with concrete answers about registration, schemas, execution results,
cleanup, typing, security, and the supported verification environment. It does not add WebMCP code
to the application.

## Why this is a separate phase

WebMCP is time-sensitive and the repository currently records several implementation assumptions.
Phase 4 must not encode those assumptions until they have been checked against current primary
sources. Research is done when it removes implementation ambiguity, not when more links have been
collected.

## Scope

1. Recheck the official OpenAI site-tools documentation relevant to discovery and supported agent
   environments.
2. Recheck the current Chrome WebMCP overview, Imperative API, best practices, tool security, and
   testing/availability guidance.
3. Recheck the WebMCP specification/repository, implementation status, and current TypeScript type
   package guidance.
4. Audit every implementation claim already present in `WEBMCP_SOURCES.md`.
5. Add a dated implementation contract, evidence table, open-questions section, and Phase 4 handoff
   to that document.

## Out of scope

- Registering tools, adding browser globals, installing a WebMCP package, or changing application
  runtime behavior.
- Deploying the application or proving tool discovery in an agent environment; Phase 5 owns the
  real-environment gate.
- Designing mutable room tools or project command contracts.
- Rewriting general product or architecture documents unless a verified incompatibility requires a
  narrowly scoped correction.
- Treating examples, blog posts, search snippets, or model memory as normative API sources.

## Source priority

Use current primary sources in this order for implementation decisions:

1. The API schema and behavior exposed by the supported runtime.
2. Current Chrome WebMCP documentation for implemented browser behavior.
3. The WebMCP specification and implementation-status material for the standard contract and known
   gaps.
4. Official OpenAI documentation for Codex/ChatGPT site-tool discovery and supported environments.
5. Official examples only as non-normative design evidence.

When sources disagree, record the disagreement, the date checked, and the conservative decision
Phase 4 should implement. Do not silently merge incompatible versions.

## Questions that must be resolved for Phase 4

### Registration and lifecycle

- What is the exact current `document.modelContext.registerTool` signature?
- Is registration synchronous or asynchronous?
- What is the normative cleanup mechanism: `AbortSignal`, a returned handle, an explicit
  unregister call, or another current contract?
- What happens on duplicate names, remount, navigation, and hard refresh?
- Are tools scoped to the top-level document, and what iframe or page-lifecycle restrictions apply?

### Tool definition

- Which fields are required for name, description, input schema, annotations, and execution?
- Which JSON Schema draft or subset is accepted by the supported runtime?
- Is `additionalProperties: false` recommended or required for object inputs?
- What is the exact current spelling and placement of `readOnlyHint`?
- Which naming and description constraints affect tool discovery and agent selection?

### Execution and results

- What arguments and execution context does the handler receive?
- What result shape is accepted and most useful to an agent: plain structured data, MCP-style
  content, or a runtime-specific wrapper?
- How should invalid arguments and execution errors be surfaced so the agent receives actionable
  information without leaking internals?
- Can handlers safely return Zod issues directly, or should Phase 4 map them to a stable
  application error contract?

### TypeScript and feature detection

- Which current package, built-in declarations, or local global augmentation should type
  `document.modelContext`?
- What feature-detection guard works without crashing in browsers that do not implement WebMCP?
- Can Zod's current JSON Schema output be passed directly, or does the runtime require a compatible
  projection?

### Security and availability

- Which origin, top-level document, iframe, Permissions Policy, `document.domain`, secure-context,
  or origin-trial constraints currently apply?
- Which Chrome version or channel and flag or trial are required today?
- Which Codex/ChatGPT environments and models currently discover site tools?
- Does localhost work in the target agent environment, or must first verification use a public URL?
- Which claims must be tested again immediately before recording and submission?

## Implementation sequence

### 1. Audit the existing source map

- Mark each implementation-sensitive statement in `WEBMCP_SOURCES.md` as current, stale,
  unverified, or explanatory only.
- Separate stable concepts from version-sensitive availability claims.
- Identify assertions that currently lack a nearby primary-source link.

Acceptance:

- Every statement that would change Phase 4 code is either backed by a current primary source or
  listed as an explicit open question.

### 2. Capture current evidence

- Read primary sources in focused batches around the question groups above.
- Record source title, direct URL, date checked, relevant contract, and confidence/status in one
  compact evidence table.
- Paraphrase rather than copying long passages; quote only when exact API wording is necessary.
- Distinguish documented behavior from an inference and from behavior that still needs an empirical
  test.

Acceptance:

- Another implementer can trace each contract decision to the exact primary page or specification
  section that supports it.

### 3. Write the Phase 4 implementation contract

Add a concise section to `WEBMCP_SOURCES.md` that fixes, as of the checked date:

- the feature-detection expression,
- registration and cleanup lifecycle,
- tool-definition shape,
- input-schema constraints and Zod conversion approach,
- read-only annotation shape,
- handler result and error envelopes,
- page scoping and fallback behavior,
- TypeScript declaration or package strategy,
- minimum local and public verification environments.

Use pseudocode only where it clarifies the contract. Do not create production modules in this
phase.

Acceptance:

- Phase 4 can be planned and implemented without reopening a basic API-shape question.
- Decisions are conservative where the standard and implementations differ.

### 4. Record the verification matrix and unknowns

- Define what Phase 4 can unit test without the real browser API.
- Define what Phase 5 must verify manually in Chrome and in the supported Codex/ChatGPT
  environment.
- List unresolved items with an owner phase, a concrete experiment, and a fallback. Do not use a
  free-floating `TODO` list.
- Mark availability claims that must be refreshed before video recording and submission.

Acceptance:

- Every unresolved question has a bounded next experiment and does not masquerade as a fact.
- Phase 5's hard gate has a concrete environment matrix and observable pass criteria.

### 5. Close the phase

- Re-read the implementation contract against Phase 4's intended tools: `search_products` and
  `get_product_details`.
- Confirm that the plan does not require mutable project state or a backend-only tool path.
- Check links, Markdown consistency, and the diff for accidental changes outside research docs.

## Verification

Documentation checks:

```bash
git diff --check
rg -n "TODO|TBD|unverified|open question" docs/WEBMCP_SOURCES.md plans/phase-03-webmcp-theory.md
```

The second command is an audit, not a requirement for zero matches: any remaining uncertainty must
appear in the bounded open-questions table with a next experiment and owner phase.

Manual review:

- Every current API or availability claim has a direct primary-source link and checked date.
- Normative requirements, implementation-specific behavior, and project decisions are visibly
  distinguished.
- Registration, cleanup, input validation, annotations, result/error shapes, typing, fallback, and
  security each have an explicit Phase 4 decision.
- The verification matrix distinguishes unit tests, local browser checks, public deployment checks,
  and agent-environment checks.
- No application code or dependency changed in this research-only phase.

## Exit gate

Phase 3 is complete when `WEBMCP_SOURCES.md` contains the dated evidence and implementation
contract, and every question that could block Phase 4 is either resolved or assigned a concrete
Phase 4/5 experiment with a safe fallback. Then remove Phase 3 from the active implementation
index, delete this file, and create the detailed Phase 4 plan from the verified contract rather
than from old roadmap prose.

## Risks and controls

| Risk | Control |
|---|---|
| Documentation describes a newer standard than Chrome implements | Record spec and runtime behavior separately; target verified runtime behavior. |
| Availability claims age before submission | Date them and flag them for Phase 5 and pre-submission recheck. |
| Research expands without converging | Stop when every Phase 4-blocking question has a decision or bounded experiment. |
| Examples are mistaken for normative contracts | Use examples only after primary API/spec sources and label inferences. |
| Phase 3 quietly turns into implementation | Limit changes to research and planning documents. |
