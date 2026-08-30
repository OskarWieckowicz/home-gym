# Phase 23A — landing implementation and verification

Verified locally on 30 August 2026. Public release acceptance remains outstanding.
Design authority: [landing specification](LANDING_PAGE.md) and the accepted
[v2 reference](mockups/home-gym-landing-page-v2.png).

## Implemented

- Six process-first sections: hero, room → goals/budget → equipment/layout, agent starter prompt,
  shared editing, WebMCP explanation and closing actions. No dedicated demo statistics section.
- Primary Start planning uses the existing one-shot new-project route; secondary Explore sample
  project uses the existing demo route. Open creator resumes local work. Replacement warnings
  accompany new/sample actions, including the expanded agent guide.
- Real images of the same room, intrinsic dimensions, responsive sizes, eager/high-priority hero
  and lazy below-fold images. [Asset provenance](LANDING_ASSETS.md) records states and crops.
- Selectable single-source starter prompt, user-triggered copying, polite confirmed success,
  denied/missing-API fallback and no-JavaScript instructions.
- Native setup disclosure describes the external agent and actual manual Room controls. Photos
  require reference measurements/review; no built-in upload or chatbot is implied.
- Desktop shared navigation anchors and mobile hero guide links; sticky-header offsets;
  fragment links are not marked as separate current pages. Catalog active-state matching retained.
- Prototype and fictional-product caveats in the shared footer. No dead repository link added.

The landing remains server-rendered; only the copy interaction adds a client component. No creator,
domain, geometry, WebMCP, persistence runtime, package manifest or lockfile changes were required.
Root render contains no editor/canvas; this was checked in source and generated HTML, not measured
as a production performance benchmark. Four WebP assets total approximately 100 KB.

## Automated checks

| Check | Result |
| --- | --- |
| Focused landing/navigation/entry/persistence tests | 8 files, 47 tests passed |
| `npm run quality:quick` | Passed |
| `npm run lint:report` | 0 errors; 37 existing advisory warnings outside landing changes |
| `npm run agent:verify` | Passed: 111 files, 997 tests; TypeScript, lint, duplicate and size gates |
| `npm run build` | Passed; 43 generated pages, `/` statically prerendered |
| `git diff --check` | Passed |

Tests cover section ordering, destinations, mobile links, prompt success/pending/error states,
navigation semantics, honest footer content and actual image formats/dimensions/size limits.
The first full test run exposed an intermittent existing persistence-test race involving async 3D
loading under jsdom. The persistence suite now mocks `next/dynamic` to a static scene, matching the
adjacent entry suite. No assertions were weakened and no production persistence behavior changed.
The final complete gate passed after this isolation fix. Production build required network access
for the existing Google Fonts download; it passed with approved network access.

## Browser evidence

Local Next development server on `http://localhost:3100`, Codex in-app browser. Port 3000 was
already occupied and left untouched. Disposable local project state was used for entry tests.

- Inspected desktop 1280 × 900, tablet 768px, phone 390px and narrow 320px layouts. No horizontal
  overflow observed at 320px; guide prompt remained readable/selectable.
- Clicked How it works from Catalog: navigated to `/#how-it-works`; heading top 128px remained
  below the sticky header bottom 73px. Guide deep-link layout was also inspected on phone.
- Copy prompt produced the success status in the browser. Exact copied string and rejected/missing
  clipboard behavior are covered by unit tests; the browser clipboard readback was inconclusive.
- Start planning opened a fresh empty room with Room dimensions immediately visible. Changed width
  from 400 to 450 cm through the UI, refreshed, returned home, then used Open creator: 450 cm remained.
- Explore sample project opened the 400 × 320 cm fixture with four placed products, locked wardrobe,
  entry door and genuine five warnings. Existing one-shot entry semantics were preserved.
- Local WebMCP room/configuration tools were used to prepare the real captures. This is evidence
  of direct tool use, not a completed natural-language starter-prompt conversation on a deployed site.
- Independent code review completed; guide discoverability, mobile anchors and replacement-warning
  findings were corrected and rechecked. No remaining blocking landing issue reported.

Evidence: [desktop viewport](landing-verification/desktop.png) and
[phone guide viewport](landing-verification/phone-guide.png). These are actual local screenshots,
not generated mockups. The capture service's full-page/clip scaling was unreliable, so viewport
screenshots were retained. Some mobile click attempts timed out in the browser input transport;
mobile destinations/layout were verified, but a complete touch/keyboard assistive-device pass is
not claimed. Responsive emulation is not a physical-device test.

## Source checks and remaining release gates

Setup copy checked against the [official site tools guide](https://learn.chatgpt.com/docs/webmcp)
and [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp) on 30 August 2026.
No fixed model/browser version was encoded in landing copy.

The configured repository `https://github.com/OskarWieckowicz/home-gym` returned HTTP 404 when
checked without authentication. Its public availability is unverified; the footer intentionally
omits Repository until an accessible URL is authorized and confirmed. Repository visibility was
not changed.

No deployment was performed. Remaining release acceptance is tracked in
[Phase 23A](../plans/phase-23a-landing-polish.md): public repository link, deployed new/demo/resume
and guidance checks, fresh external-agent conversation, plus final device/keyboard verification.
Local test/build success does not prove the currently published site includes this implementation.
