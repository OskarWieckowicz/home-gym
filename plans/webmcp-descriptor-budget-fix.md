# WebMCP descriptor budget fix

## Scope

Keep all 20 creator tools and their runtime validation unchanged. Deduplicate the
batch JSON Schema with Zod's `reused: "ref"` option. The installed browser adapter
defaults to a 65,536-byte total descriptor limit; the previous localhost payload
was 66,631 bytes. This is a host implementation limit, not a WebMCP standard limit.

## Implementation and verification

1. Add a UTF-8 serialized-descriptor regression test with a 60,000-byte project
   budget, leaving room for host metadata. Cover creator and catalog tool sets.
   Confirm the creator test fails before changing schema generation.
2. Generate shared batch definitions using local `$defs`/`$ref`. Check that the
   references resolve within the schema and that existing strict input tests pass.
3. Run focused WebMCP tests, `npm run quality:quick`, `npm run lint:report`, and
   `npm run agent:verify`. Review the changed WebMCP contract.
4. Reload the creator in a fresh browser connection; discover all 20 tools and
   call read-only state/evaluation tools. Exercise the shared batch schema without
   changing the user's room, and check invalid input still fails safely.
5. Record final size, test results, and browser evidence here. If the host rejects
   `$ref`, do not declare success; revise the schema representation without
   weakening runtime validation.

## Status

Completed on 2026-08-30.

- Regression demonstrated before the fix: creator descriptors alone were 64,931
  UTF-8 bytes and failed the 60,000-byte budget; catalog passed.
- After deduplication: creator descriptors alone are 53,695 bytes. Live browser
  discovery measured 55,395 bytes including localhost origin and page URL, with
  all 20 tools present (10,141 bytes below the adapter's default ceiling).
- Reference expansion test verifies local references resolve and expand to the
  same inline input contract. No handlers, runtime validation, or tools removed.
- Focused WebMCP suite: 15 files / 104 tests passed. `quality:quick` and
  `agent:verify` passed; full suite: 91 files / 649 tests. `lint:report`: no errors,
  29 existing warnings outside changed files. Read-only review: no findings.
- Fresh browser connection and creator reload: `get_project_state` succeeded;
  `evaluate_layout_changes` accepted a room command plus a hypothetical nested
  obstacle command; `apply_layout_changes` accepted unchanged room dimensions
  with `changed: false`; invalid nested width returned `INVALID_INPUT` at
  `changes.0.payload.widthCm`. State before/after was identical, revision stayed
  0, and undo remained unavailable. The no-door warning remained unchanged.
- Verified against the local Codex in-app browser, not a public deployment or all
  browser implementations. No build was needed: routing, component boundaries,
  configuration, and deployment behavior were not changed.
