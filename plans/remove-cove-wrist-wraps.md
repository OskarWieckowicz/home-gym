# Remove Cove Wrist Wraps from the active catalog

- Move the unchanged product specification to retired accessories, preserving saved projects.
- Update active catalog counts to 23 products (21 placeable, two shopping-list-only).
- Keep retired-product query, command and route coverage; use active accessories in new-addition tests and mock missing images for fallback tests.
- Verify legacy wraps still load and can be removed/undone without losing price or identity.
- Run focused tests, quality:quick, lint:report, agent:verify and build.

Status: complete; full repository verification reports unrelated failures.

## Verification

- Focused tests: 91 passed across nine files, including retired route rejection, active
  query/command rejection and saved wraps serialization, price, removal and undo.
- `quality:quick` passed. `lint:report`: zero errors, 37 advisory warnings.
- `build` passed: 23 product routes, no Cove Wrist Wraps route.
- Local HTTP request to `/catalog/cove-wrist-wraps` returned 404.
- `agent:verify`: 1055 passed, two failed outside this change. The unchanged demo-project
  test looks up already-retired Ironvale in the active catalog. Concurrent untracked
  `describe-validation-issue.ts` imports a catalog formatter across a domain boundary.
  These unrelated files were left untouched.
- `git diff --check` passed. No deployment or saved-project deletion.
