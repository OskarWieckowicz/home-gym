# Phase 23A — Process-first landing page

> Order 1 in the [active queue](README.md). Blocks Phase 24 final submission.
> Accepted direction and visual reference: 30 August 2026. Implementation has not started.
> Catalog polish remains independent in [Phase 23B](phase-23b-catalog-polish.md).

## Sources of truth

- [Landing specification and approved English copy](../docs/LANDING_PAGE.md).
- [Accepted v2 mockup](../docs/mockups/home-gym-landing-page-v2.png).
- [Mockup provenance and generation brief](../docs/mockups/home-gym-landing-page-v2.md).
- [Product concept](../docs/PRODUCT_CONCEPT.md) and [architecture](../docs/TECHNICAL_ARCHITECTURE.md).

The written specification wins over generated UI details. The mockup is not a real product capture.
This plan replaces the previous demo-first six-section implementation proposal.

## Objective and baseline

Explain choosing equipment and placing it within room constraints, training goals and budget.
Lead with the process from scratch; offer the bundled demo only as a secondary shortcut.

`src/app/page.tsx` renders only a hero and `HeroPlanSketch`. `src/lib/navigation.ts` already supports
one-shot `new` and `demo` modes, but uses old demo-first labels and a How it works link to `/`.
The sticky shared header hides navigation below `md`. `SiteHeaderNav` normalizes query strings but
not fragments, so section links need deliberate active-state handling. The shared footer already
identifies the prototype and fictional products.

## Scope and decisions

In scope: landing composition/copy, real imagery, starter-prompt copying, concise inline agent setup
instructions, shared navigation labels/anchors, footer links and proportionate tests.

Out of scope: catalog redesign, new products, creator/domain/WebMCP/persistence changes, built-in
chat, image upload, automatic photo reconstruction, new onboarding routes/dependencies, activity
feeds, live embedded editor, pricing, testimonials and video production.

1. **Process first:** room → goals/exercises/budget → equipment selection and placement.
   No sample statistics strip or dedicated demo scenario section.
2. **Two entry choices:** Start planning → `new` (primary); Explore sample project → `demo`
   (secondary). Open creator continues to resume the saved project.
3. **Agent guides, app validates:** prompt requests missing inputs first; tools operate on the open
   creator state; application performs deterministic geometry/budget checks.
4. **Manual work remains first class:** users can build/edit without an agent and continue with one.
   Photo-derived rooms require reference measurements and review.
5. **Reference is not evidence:** preserve layout/style, not imaginary controls, dollar currency,
   or claims that tool changes require a separate user apply step.
6. **Small client boundary:** server-render page/sections; client code only for copying. Reuse
   Tailwind tokens, shared primitives and existing header/footer.

## Sequenced implementation

### 1. Preflight and entry-path audit

- Read applicable frontend skills and installed Next.js docs for images, links and Server/Client
  Components before coding. At planning time `node_modules/next/dist/docs/` is absent in this
  worktree; restore declared dependencies before attempting implementation checks.
- Inspect actual new-project setup, demo loading and resume behavior and their tests. Confirm how
  an external agent proceeds while the configuration panel is present. Explain required user setup
  honestly; any necessary creator behavior fix needs separate scope, not a hidden change here.
- Check all `siteLinks` consumers before changing labels; retain route helpers and update affected
  consumers/tests together. Resolve repository URL from project metadata and verify public access.
- Verify current environment setup against official WebMCP sources before writing instructions;
  do not publish stale browser/model-version claims.

Checkpoint: truthful entry instructions and destinations known; any creator blocker identified.

### 2. Prepare real visual assets

- Store production captures in `public/images/landing/` and record provenance in `docs/`.
- Use one controlled room/obstacle configuration across empty room, goals/budget configuration,
  furnished 3D result and shared-editing selection view. Reuse crops where legible.
- Phase 26 can supply the furnished scene but does not dictate the narrative or require sample
  dimensions/cost as landing copy. Use the precise 2D view if clearer for shared editing.
- Show genuine warnings. Use captures of real controls, with clearly editorial labels if needed.
  A description cue can replace the mockup's photo inset; any photo requires a permitted source.
- Record source state/revision, capture date/view, crops/annotations, dimensions and rights.
  Keep old references; never ship the full-page mockup as a UI asset.
- Use responsive `next/image` with intrinsic dimensions, meaningful alt text and a hero loading
  choice based on installed Next.js docs. Do not copy deprecated props from earlier plans.
- Apply the modern-web-guidance image-priority guide: identify the actual LCP image, give that
  image high fetch priority without lazy loading, and lazy-load ordinary below-fold illustrations
  at their normal fetch priority. Adapt the API spelling to installed Next.js guidance.
- Do not reopen paused Phase 16 acceptance or generation work. Use accepted available assets;
  identify specific visible defects blocking truthful captures rather than a blanket dependency.

Checkpoint: all states visibly describe the same room and actual application. If real captures are
blocked, mark imagery incomplete; a temporary sketch does not satisfy final acceptance.

### 3. Implement static composition and navigation

Keep `src/app/page.tsx` as a small composition root. Suggested landing component files:

| File under `src/components/landing/` | Responsibility |
| --- | --- |
| `landing-hero.tsx` | Approved headline, two entry CTAs, real preview |
| `planning-steps.tsx` | Same-room sequence; `how-it-works` target |
| `agent-guide.tsx` | Prompt, external-agent instructions, native setup disclosure |
| `shared-editing-section.tsx` | Manual edit → agent continuation → review/undo |
| `webmcp-explainer.tsx` | Current-state tools and deterministic checks |
| `landing-closing.tsx` | Primary start and secondary sample action |

- Implement the specification's copy/order; no separate generic feature grid or demo stats.
- Add `/#how-it-works` and `/#agent-guide` to shared navigation in `src/lib/navigation.ts`.
- Adjust `site-header-nav.tsx` so fragments are not treated as independent current pages.
  No scroll-spy is needed; preserve Catalog/current-page behavior.
- Offset anchors for the sticky header. Keep guide links reachable on small screens without
  introducing a new mobile-navigation system.
- Reuse `site-footer.tsx`; add verified repository link and prototype limits, not a second footer.
- Leave project state, parsing, one-shot start consumption and tool registration unchanged.

Checkpoint: focused rendering/navigation tests and `npm run quality:quick` pass.

### 4. Starter-prompt interaction and setup guidance

- Store the approved prompt once in a landing-specific content module for rendering, copying and
  tests. It asks the agent to guide from scratch, not operate on an already configured room.
- Add `copy-prompt-button.tsx` as the small client boundary. Copy only on user action; no clipboard
  reads, automatic copying, navigation or project mutation.
- Announce success through a polite status region only after success. Catch rejection and handle
  missing Clipboard API; retain selectable text with manual-copy instructions, including without JS.
- Use a native inline disclosure for verified environment steps and official source links.
  Explain the external chat and same open `/creator` session; never imply landing-page tools.
- Keep native button semantics, visible focus and clear feedback; avoid unnecessary animations.

Checkpoint: exact text, success, rejection and missing-API tests plus `quality:quick` pass.

### 5. Responsive polish and verification

- Match v2 hierarchy and tokens on desktop; stack hero, steps and guide in reading order on phones.
  Ensure no horizontal overflow at 320px and readable/selectable prompt text.
- Verify reserved image space, correct hero loading and no editor/WebGL dependency in landing bundle.
- Run the validation ladder below; inspect rendered page and all entry/anchor links.
- On a fresh deployed session, exercise manual new-project entry and the external-agent starter
  prompt: missing-input questions, equipment planning and continuation after manual edits.
  Record environment/date/results; local tests are not evidence of public-build/agent behavior.
- Record evidence under `docs/`. Deployment is not authorized by this documentation task;
  public-build checks follow the authorized release workflow.

## Tests

- `src/app/page.test.tsx`: replace obsolete sketch assertion with rendered section order/headings,
  CTA labels/destinations, prompt text and anchor IDs. Assert no separate sample-statistics/scenario
  section or old demo-first instructions. Use existing Vitest/Testing Library conventions.
- `src/lib/navigation.test.ts`: new labels/anchors; unchanged new/demo/resume destinations and
  invalid-mode/product-route coverage.
- Shared header tests: section-link semantics and correct Catalog active state. Shared footer:
  valid repository destination and prototype copy.
- Copy-button tests: exact prompt, successful announcement, rejection, absent API, manual fallback
  and no navigation/project side effects. No redundant per-section tests for static text.
- Preserve creator start/resume and shared-editing/WebMCP regression suites; no new test framework.

## Acceptance criteria

- Six sections match the spec/v2 hierarchy on desktop and mobile; problem/process precede technology.
- First step is an empty room; goals/budget precede equipment selection and placement.
- Start planning is primary, sample secondary, Open creator resumes; no runtime semantics changed.
- Prompt guides from scratch, stays selectable, copies exactly and handles failure honestly.
- Setup instructions are actionable/freshly sourced and distinguish external chat from the website.
  Photo wording requires reference measurements/review, not built-in accurate reconstruction.
- Shared editing describes direct visible tool edits and shared undo, not a separate apply path.
- Anchors work from `/`, `/catalog` and `/creator` where rendered, with visible headings below the
  sticky header and accessible paths to guidance on phones.
- Real images have provenance, permitted use, dimensions and alt text; hero is not lazy-loaded.
  No sample-statistics strip, imaginary product controls or safety guarantees ship.
- Prototype limits and verified repository destination exist; no placeholder/dead links.
- Public-build and external-agent evidence is recorded or explicitly marked outstanding.

## Validation ladder and exit gate

Focused tests first; `npm run quality:quick` after coherent slices; `npm run lint:report` during
cleanup; `npm run agent:verify` and `npm run build` before completion (composition and Server/Client
boundaries change). Keep all non-test source/config files under 500 lines.

Manual checks: phone (including 320px), tablet, desktop; keyboard/focus, copy failure, cross-page
anchors, new/demo/resume and refresh; image layout stability; fresh deployed/external-agent flow.
Do not claim local checks prove deployed behavior. Complete only once acceptance and gates pass.
Remove this plan/index row then; keep the reference, spec and verification evidence in `docs/`.
