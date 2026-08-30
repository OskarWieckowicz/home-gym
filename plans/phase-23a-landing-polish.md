# Phase 23A — landing release acceptance

> Order 1 in the [active queue](README.md). Local implementation completed 30 August 2026.
> Catalog work remains independent in [Phase 23B](phase-23b-catalog-polish.md).

## Implemented baseline

The approved process-first v2 landing is implemented and locally verified: six sections, real room
captures, room → goals/budget → equipment/layout, copyable starter prompt, external-agent setup,
shared editing, navigation and truthful prototype limitations. New/demo/resume runtime is unchanged.

- [Implementation and verification evidence](../docs/PHASE_23A_LANDING_VERIFICATION.md).
- [Specification and approved English copy](../docs/LANDING_PAGE.md).
- [Accepted v2 mockup](../docs/mockups/home-gym-landing-page-v2.png) and
  [reference provenance](../docs/mockups/home-gym-landing-page-v2.md).
- [Real asset provenance](../docs/LANDING_ASSETS.md).

Local gates passed: focused checks, quality:quick, lint:report (0 errors), agent:verify (997 tests),
and production build. This file contains only the remaining release work; it is not an instruction
to reimplement the landing.

## Remaining work

### 1. Confirm the public repository destination

The configured GitHub URL returned logged-out HTTP 404. Do not add a dead footer link or change
repository visibility without authorization. Obtain/confirm the intended publicly accessible URL,
add Repository to the shared footer, and update its test. Preserve prototype limitations.

Checkpoint: logged-out access succeeds, footer link is correct, focused tests and quality:quick pass.

### 2. Verify an authorized deployment

Deployment was not performed as part of this implementation. Use the authorized release workflow,
then verify the actual deployed build in a fresh session:

- Primary Start planning, secondary sample, manual edits, refresh and Open creator resume.
- How it works / Agent guide anchors from landing and catalog; creator returns via its home link.
- Phone including 320px, tablet and desktop; keyboard focus, copy success/fallback, disclosure,
  sticky-header visibility, image stability and no horizontal overflow. Local responsive checks
  passed, but browser input transport prevented a complete mobile click/keyboard pass.
- Starter prompt with a real external agent: missing-input questions, room setup, goals/budget,
  equipment selection/placement and continuation after a manual edit in the same project.
- Record date, environment, deployment revision, evidence and any limitations in the verification doc.

Checkpoint: public-build and external-agent results are evidence-backed, not inferred from local tests.

## Exit gate

For any follow-up code changes, run focused checks then quality:quick, lint:report and agent:verify;
run build for routing/Server-Client/deployment-sensitive changes. No non-test source/config file
may exceed 500 lines. Preserve existing domain/WebMCP boundaries and do not reopen catalog or
Phase 16 asset work here.

Once the public link and release checks pass (or the user explicitly cuts a requirement), remove
this plan and its active-queue row. Keep the specification, approved mockup and verification in docs/.
