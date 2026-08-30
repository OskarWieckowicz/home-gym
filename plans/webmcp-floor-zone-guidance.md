# Clarify WebMCP floor-zone guidance

## Scope

Update creator tool descriptions only. Preserve schemas, commands, geometry,
stored projects, and the existing descriptor byte budget.

## Implementation

1. Explain that the application computes door-based reachability and catalog
   equipment use zones; do not draw generic circulation paths as unavailable zones.
2. Define unavailable zones as explicit additional floor restrictions that block
   equipment footprints and use zones but remain walkable. Require a concrete
   reason grounded in the room or the user's request, not an invented buffer.
3. Clarify door/window limitations: no swing model or window access target; do not
   infer a floor reserve just because an opening exists. Keep justified extra
   restrictions possible, without implying that furniture opening space is checked.
4. Cover single obstacle tools and batch tools so guidance is visible regardless
   of the mutation entry point.

## Verification

- Run tool registration, descriptor-budget, and access-validation tests.
- Run `npm run quality:quick`, `npm run lint:report`, and `npm run agent:verify`.
- Review wording against current domain semantics. Browser agent behavior remains
  a follow-up observation; passing tests cannot guarantee model compliance.

## Result

Completed on 2026-08-30. Updated shared access guidance, obstacle add/update,
door/window add/update, and both batch descriptions. No runtime or schema changes.

- Focused verification: 3 files / 21 tests passed, including the unchanged
  60,000-byte descriptor budget.
- `quality:quick` and `agent:verify` passed; full suite: 91 files / 649 tests.
- `lint:report`: 0 errors, 29 existing warnings outside the changed file.
- Read-only contract review: no findings. No browser agent replay or deployment.
