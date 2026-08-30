# Phase 24 — Submission

> Order 3 in the [active queue](README.md). Depends on Phase 23B for final submission;
> shared-editing verification and script preparation can start as soon as Phase 26 is deployed.
> Hard deadline: 3 September 2026, 22:00 CEST. Start the video no later than 2 September.

## Problem

Hosting is already done: <https://home-gym-coral.vercel.app/> is live and the MIT `LICENSE` is in
place, so this phase is documentation, verification and media rather than infrastructure. What is
missing is the judge-facing documentation. The root `README.md` has a stale
status table that still calls the creator a placeholder, links only to `localhost:3000`, and carries
none of the four things the exit gate names: the demo URL, the tool list, sample prompts and the
architecture. The WebMCP testing section is written conditionally, as if the tools might not exist
yet. Sample prompts exist only in `docs/AGENT_HOME_GYM_WORKFLOW_PROMPT.md`.

## Scope

In scope: verifying the deployed build and shared-editing loop, preparing the demo script,
rewriting the root README, writing the Devpost description, recording the video, and completing
the submission form. This includes the remaining Phase 23A landing release acceptance below and
adding the verified public Repository footer link with its regression test. No in-editor activity
feed is planned.

Out of scope: behaviour changes other than the Repository footer link above. If verification finds
a real defect, track its fix in a separate scoped plan and note it here; do not fold unrelated
product changes into the submission commit.

## Decisions

**D1 — verify the deployment before writing about it.** Every claim in the README and the description
must have been observed on the live URL in a fresh session, not inferred from the local test suite.
Tool registration in particular depends on the deployed client bundle.

**D2 — the README is the judged artifact, `docs/` is the depth.** Put the demo URL, the tool list,
the prompts, the testing instructions and a short architecture summary in the README itself. Link
`docs/TECHNICAL_ARCHITECTURE.md` for detail rather than deferring the summary to it.

**D3 — prepare and verify the shot list in this phase.** Write `docs/DEMO_SCRIPT.md` from the
existing shared-editing flow, starting at `/creator?start=demo`, with exact prompts and expected
observable results. Run it on the deployed build before recording. Show actual tool calls in the
agent host alongside their visible effects in the editor; do not build a duplicate activity feed.

**D4 — record early, polish once.** A finished sub-three-minute video with plain narration submitted
on 2 September is worth more than a better one that misses the deadline. Reserve the last day for the
form, not for editing.

## Implementation tasks

1. **Verify the live build.** In a private window with no prior storage, on the deployed URL:
   the landing page and every CTA; `/creator?start=demo` and `?start=new`, each consumed to
   `/creator`; edit and reload to confirm persistence, then reopen the explicit link to confirm reset;
   the catalog with filters and a product detail page; 2D and 3D; export, import, reset, undo, redo.
   Complete the landing release checklist below on the actual submitted build.

2. **Prepare the script and verify WebMCP on the deployed build.** Write `docs/DEMO_SCRIPT.md`
   in the primary 3D editor, with a manual change, the agent reading the updated state, an agent change, deterministic
   validation, correction of a conflict, and shared undo. The conflict can come from the manual
   edit; the agent does not need to introduce an error deliberately. In a fresh session, in both target environments — Chrome
   with the WebMCP flag and the ChatGPT in-app browser — confirm the creator registers its full tool
   set and the catalog registers its two, confirm the schemas are discoverable, and run
   `docs/DEMO_SCRIPT.md` to completion. Record the browser versions and the exact flag used; the
   README instructions must match what was actually observed.

3. **Rewrite the root README.** Sections, in this order: what the product is and the problem it
   solves; the live demo URL near the top; a screenshot or short GIF; how the human and the agent
   share one model; the complete tool list grouped by surface, with a one-line purpose each; sample
   prompts a judge can paste; WebMCP testing instructions for both environments including the flag
   and a fresh-session checklist; local development and `npm run test`; an architecture summary with
   the module boundaries and the deterministic-geometry invariant; documentation links; license, the
   fictional-brand note and asset provenance. Delete the stale status table rather than updating it —
   the phase table belonged to a half-built repository.

4. **Write the Devpost description in English.** Answer the four questions the challenge asks
   directly: why WebMCP fits this product, how it improves the experience over a conventional UI,
   what the human and the agent can each do, and how it is implemented. Add the problem, the demo
   scenario, the feature list, the agent's scope, which logic stays deterministic and why, and the
   honest limitations. State plainly that geometry, collision, clearance and reachability are
   deterministic and that the agent interprets results rather than computing them — that is the
   strongest claim in the submission and it should not be buried.

5. **Record the video.** Under three minutes, public on YouTube, with narration and no unlicensed
   music. Show a real browser against the live URL. Structure: the problem in fifteen seconds, the
   demo project loading, a manual change, the agent reading current state and resolving a conflict,
   validation of the result, and shared undo, followed by a closing line about the deterministic
   core. Show the actual tool calls in the agent host and keep the editor visible whenever the
   agent acts, so the shared surface is obvious rather than asserted.

6. **Submit.** Complete the Devpost form with the live URL, the public repository, the video link and
   the description, then verify the repository is public, the license shows in the GitHub About panel
   and every submitted link opens in a private window.

## Landing release acceptance

Carried forward from Phase 23A; local implementation is complete, but these release gates remain:

- Confirm the intended public repository URL with logged-out access. The configured URL previously
  returned HTTP 404; do not add a dead link or change repository visibility without authorization.
  Once an accessible URL is authorized and confirmed, add Repository to the shared footer and update
  `src/components/site-footer.test.tsx`. Preserve the prototype limitations.
- Use the authorized release workflow to ensure the deployed revision contains the landing changes.
  In a fresh session, verify Start planning, Explore sample project, manual edits, refresh and
  Open creator resume. Check How it works / Agent guide anchors from landing and catalog, and the
  creator's home link.
- Check phone widths including 320px, tablet and desktop: touch interaction, keyboard focus,
  prompt-copy success and fallback, setup disclosure, sticky-header target visibility, image
  stability and no horizontal overflow. Local responsive inspection did not complete the mobile
  click/keyboard pass and does not replace published-build verification.
- Run the landing starter prompt with a real external agent from an empty Start planning project:
  missing-input questions, room setup, goals/budget, equipment selection/placement and continuation
  after a manual edit in the same project. The demo-based script in task 2 is a separate check.
- Record the date, environment, deployed revision, evidence and any limitations in
  [landing verification](../docs/PHASE_23A_LANDING_VERIFICATION.md). Local tests/builds are not
  evidence of public-build or external-agent acceptance.

## Acceptance criteria

- The live URL works logged out, in a private window, with no prior local storage.
- The landing release checklist above passes with recorded evidence, including the public footer
  link and empty-project starter-prompt flow, unless a requirement is explicitly cut by the user.
- Tool registration and the full demo loop are confirmed on the deployed build in a fresh session in
  both target environments.
- The README carries the demo URL, the complete tool list, sample prompts, WebMCP testing
  instructions and an architecture summary, and contains no stale claim about unimplemented features.
- Every sample prompt in the README was actually run against the live build and produced the
  described result.
- The video is under three minutes, public, narrated, and shows the complete loop.
- The description answers all four WebMCP questions in English.
- The repository is public with a visible license, and the source contains the real `registerTool`
  implementation a judge can find.
- The submission is filed before 3 September 2026, 22:00 CEST.

## Tests

Update the shared-footer regression test when adding the Repository link. For that code change,
run focused tests, `npm run quality:quick`, `npm run lint:report` and `npm run agent:verify`;
run `npm run build` for routing, Server/Client or deployment-sensitive changes. No other new
automated tests are planned for the documentation and media tasks.

Run `npm run agent:verify` and `npm run build` on the exact commit that is
deployed and submitted, and confirm the deployed commit matches the repository default branch.

## Manual checks

The pre-submission checklist in [the hackathon requirements](../docs/HACKATHON_REQUIREMENTS.md), run
once in a private window on the final commit, with each link opened rather than assumed.

Also review the outstanding device, GPU-failure and deployed shared-editing checks recorded in
[Phase 27 verification](../docs/PHASE_27_3D_EDITOR_VERIFICATION.md#remaining-acceptance-checks--limitations).
Phase 27 was closed by user acceptance on 30 August 2026; closure is not evidence that these
checks passed. Record their results or retain explicit limitations in submission claims.

## Risks

The two schedule risks are recording the video too late and discovering a WebMCP registration
difference on the deployed build that does not reproduce locally. Task 2 exists to surface the second
one early; do it as soon as Phase 26 is deployed rather than waiting for Phase 23B.

## Exit gate

The submission is filed and every acceptance criterion holds. Delete this file and its index row, and
delete `plans/README.md` itself once the queue is empty.
