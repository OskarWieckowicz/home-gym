# Phase 28 — Submission

> Order 4 in the [active queue](README.md). The WebMCP activity inspector is implemented; the
> premium-look pass is optional and should be cut rather than delaying this phase.
> Catalog sidebar polish is cut; do not reopen it.
> Recorded deadline: 3 September 2026, 22:00 CEST. Start recording no later than 2 September.
> Recheck official requirements and supported browser setup before submitting.

## Scope and boundaries

Run final manual tests on the submitted build at <https://home-gym-coral.vercel.app/>, finalize
the judge-facing README with observed live-host details, prepare the English description and video,
and complete the submission.
The MIT license exists; public repository access and the deployed revision still require
confirmation.

Creator, landing, catalog and WebMCP activity implementation are complete product work. This plan
owns final manual testing plus landing, demo, 3D editor, workspace and summary release acceptance
on the live URL. Past local checks do not certify the submitted build. The only planned behavior
change here is adding the verified public Repository footer link and its regression test. If
acceptance finds a real defect, create a separate scoped fix plan rather than folding unrelated
changes into submission. Do not introduce PDF/print export, shareable summary
URL or other cut scope.

Do not change repository visibility without authorization. Use the authorized deployment workflow;
cleanup itself neither deploys nor authorizes a visibility change. Per-model asset recognizability,
kettlebell silhouette refinement and complete-room runtime metrics are cut from remaining
production work; do not claim they passed unless observed on the submitted build.

## Work sequence

1. **Final manual tests on the live revision.** Complete the required public-build, landing and
   agent checklists below before making claims in submission material. Use fresh sessions and
   disposable project state, not the user's working room. Cover landing, catalog, creator and
   summary as a judge would, including the shared-editing loop.
2. **Prepare and rehearse `docs/DEMO_SCRIPT.md`.** Start at `/creator?start=demo` in primary 3D.
   Include a manual edit, agent read of that new state, an agent change, deterministic validation,
   correction of a conflict and shared undo. A manual edit may introduce the conflict; the agent
   need not create one deliberately. End with View summary and matching `get_project_summary`
   results. Show actual tool calls in the creator's WebMCP activity inspector alongside visible
   editor changes; the external agent host may remain visible when the recording layout permits it.
3. **Finalize the root README after live acceptance.** The judge-facing product/problem, live demo,
   real product captures, human/agent shared-state explanation, complete route-scoped tool list,
   sample prompts, fresh-session steps, development commands, architecture summary, limitations,
   license and asset provenance are present. Run every advertised prompt on the live build, then
   record the observed WebMCP host/browser versions and setup without claiming unverified support.
4. **Write the English Devpost description.** Answer why WebMCP fits, how it improves the experience,
   what humans and agents can each do, and how it is implemented. Cover the problem, scenario,
   feature list, agent scope and honest limitations. Explain that geometry, collision, clearance
   and reachability remain deterministic while the agent interprets the results.
5. **Record the video early.** Under three minutes, narrated, public on YouTube, no unlicensed
   music. Show the live URL: problem, demo loading, manual change, agent read/correction,
   validation, shared undo and summary. Keep the shared editor visible as the agent acts. Reserve
   the final day for submission rather than another round of video polish.
6. **Submit and inspect the result.** Provide live URL, public repository, video and description.
   Verify public access, visible license and every submitted link in a logged-out/private window.
   Follow the [hackathon requirements](../docs/HACKATHON_REQUIREMENTS.md), rechecking external facts.

## Required public-build acceptance

- Record the deployed revision and verify it contains the final landing, catalog, creator and
  summary changes. Start in a private window without prior local storage; the live URL works
  logged out.
- Check landing CTAs and `/creator?start=demo` / `?start=new`. With saved data, both explicit
  starts require confirmation before any replacement or editor/tool mounting. Keep/Escape resume
  the latest saved state without writing; also save from a second tab while the dialog is open
  and confirm cancellation uses that newer state. A fresh session starts directly. After the
  decision, only `start` is consumed; edit/reload resumes those edits, while reopening an explicit
  start asks again. Ordinary Creator/Open creator links preserve the saved project. Unreadable
  storage must show recovery feedback without a startup overwrite.
- Check catalog filters, empty state, cards, a detail page and creator return; switch 2D/3D,
  manually edit, validate, undo and redo. Exercise native export/import/reset and removal flows
  in disposable state, rather than relying only on automated coverage.
- Check the summary from the creator and on a cold direct visit: shopping list, budget, goals,
  checks and floor figures; UI/tool agreement; 2D/3D; canonical JSON export; return to editing;
  reload after a saved edit. Summary tools are read-only and must not alter project/history.
- Match demo figures to the current [fixture](../src/features/project/fixtures/demo-project.json)
  and shared summary. Retired-item resolution is covered by the v3 fixture and catalog-retirement
  tests, not the bundled demo. Do not describe existing warnings as a perfect layout or make
  building/safety-regulation claims.
- Respect the single-localStorage-slot limitation: navigation after a failed save may restore the
  last durable project rather than unsaved in-memory edits. Preserve/disclose the visible warning;
  do not promise cross-route history, server persistence or a shareable summary.

## Landing release acceptance

- Verify the intended repository URL with logged-out access. The configured URL was previously
  unavailable anonymously; do not publish a dead link or change visibility without authorization.
  Once an accessible URL is authorized and confirmed, add Repository to the shared footer and
  update [its regression test](../src/components/site-footer.test.tsx), retaining prototype caveats.
- Check Start planning, Explore sample project, manual edits, refresh and Open creator resume.
  Verify initial focus on Keep my project, keyboard containment, Escape cancellation and reload
  while replacement confirmation is open. Include direct URLs and hero/guide/footer entry paths.
  Check How it works / Agent guide anchors from landing and catalog, and creator-to-home navigation.
- At 320px phone width, wider phones, tablet and desktop, check touch controls, keyboard focus,
  prompt-copy success and fallback, setup disclosure, sticky-header offsets, image stability and
  horizontal overflow. Responsive layout inspection alone is not a physical-device test.
- Run the landing starter prompt with a real external agent from an empty Start planning project:
  missing-input questions, room setup, goals/budget, equipment selection/placement and continuation
  after a manual edit. This is separate from the demo-based recording script.

## Agent-host acceptance

In fresh sessions on the deployed build, test both required environments: Chrome with the supported
WebMCP flag and the ChatGPT in-app browser. Record actual browser/host versions, flag and setup;
do not infer hosted support from local registration or an iframe. Identify any Codex host used as
additional evidence without silently substituting it for a required target.

- Discover schemas and the complete surface-specific tool sets: currently 20 creator tools,
  two catalog tools and one summary tool. Reconcile the README list with actual registration.
- Run the rehearsed shared-editing script to completion in both targets. Confirm the agent reads
  manual changes, its mutations appear in the same editor, validation explains the conflict and
  the correction, and shared undo/redo works.
- On `/summary`, discover exactly `get_project_summary`.
  Confirm summary-tool payloads match displayed shopping list, budget, goals and check results.
  Include this surface in README and the recording's closing shot.

## Device and failure review

The following still lack complete real-device/public-build evidence. Review them before submission;
record observed results or preserve explicit limitations in claims. Automated tests and prior local
acceptance do not establish that these checks passed. A material defect needs a scoped fix.

- Physical touch and trackpad, two-finger navigation, browser zoom, keyboard and screen readers
  across creator/workspace/summary. Narrow desktop viewport or iframe checks are insufficient.
- Real GPU context loss, unavailable WebGL and failed GLB loading: confirm 2D recovery or per-item
  fallback, retained state/history and usable focus. A local simulated summary context-loss pass
  does not certify every GPU or the creator failure paths.
- Live drag interrupted mid-press by an agent; contextual edit/orbit arbitration; cancellation on
  tab/camera change; real OS catalog drag-and-drop. Controller tests alone are not device evidence.
- Workspace scroll/reachability, camera fit, retained filters/selection, Properties and Project
  actions on narrow screens. Native import/export/reset and destructive removal are also included
  in the required disposable-project public-build checklist above.

Do not claim per-model recognizability, catalog-envelope fit in the live viewport or
complete-room runtime metrics from general editor verification. If those claims appear in
submission material, measure them on the submitted build using the furnished-room recipe in
[the visual strategy](../docs/PRODUCT_VISUALS_STRATEGY.md).

## Evidence, tests and final gate

Keep necessary release evidence with the submission material, tied to date, deployed revision,
environment and observed result/limitation. Do not create another report per completed phase.
README instructions and claims must reflect what was actually observed on the live URL.

For the Repository footer change, run its focused tests, `npm run quality:quick`,
`npm run lint:report` and `npm run agent:verify`; run `npm run build` for routing, Server/Client
or deployment-sensitive changes. Documentation and media alone need no new automated tests.

Before submission, run `npm run agent:verify` and `npm run build` on the exact commit being deployed
and submitted. Confirm the deployed commit matches the repository default branch. Run the
requirements' pre-submission checklist in a private window, opening every link.

The exit gate requires all required public-build, landing and agent-host checks to pass unless the
user explicitly cuts a requirement; device/failure limitations remain disclosed where unresolved.
The README must contain demo URL, tools, tested prompts/setup and architecture; description must
answer all four WebMCP questions in English; the public narrated video must be under three minutes;
the public repository must expose its license and discoverable `registerTool` implementation.
File the submission before the confirmed deadline, then remove this plan and its index row.
Delete the index itself only when no active plans remain.
