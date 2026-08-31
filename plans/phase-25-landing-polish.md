# Phase 25 — Landing visuals

> Order 2 in the [active queue](README.md). New images and recordings were explicitly deferred
> by the user on 31 August 2026. Capture them after creator polish. Current copy, hierarchy,
> responsive layout and guarded entry are documented in the [landing specification](../docs/LANDING_PAGE.md).
> Public-build and real-agent-host acceptance remain in the [submission plan](phase-28-submission.md).

## Scope and boundaries

Refresh the visual evidence without reopening the implemented text/layout/entry work. Keep the
process-first introduction and shared human–agent editing as the main story. Real product captures
prove functionality; optional generated room concepts are illustration only. Do not reopen catalog
photos, GLB production, product geometry, an activity feed or a new landing scene/agent runtime.

## Remaining outcomes

### Current product captures

- Use disposable state based on the current demo after creator polish, never the user's working
  project. Keep the same room and fixed obstacles across the process images.
- Hero: a clear real 3D creator view with enough interface context to identify the product, less
  empty background, and legible room/equipment. Keep truthful warnings; do not imply safety certification.
- How it works: give each capture a distinct purpose. Replace the obsolete budget/goals sidebar
  with the actual current settings modal at a readable size; retain the real empty and furnished states.
- Shared editing: replace the old selected-item capture with the current editor. Preserve a useful
  static image even if a recording is added.
- Update assets under `public/images/landing/` and record source revision, room recipe, crops,
  dimensions and limitations in [landing asset provenance](../docs/LANDING_ASSETS.md).

### Real collaboration recording

- Record manual movement → external-agent instruction → agent adaptation in the same editor →
  visible validation → undo. Show enough external-agent context to make its role clear.
- Do not fabricate chat controls, tool results or an activity feed. The full narrated submission
  video remains a separate deliverable in the submission phase.
- Use a compact recording with a real poster, playback controls, text describing the demonstrated
  steps and captions if it contains speech. Preserve the static fallback and respect reduced motion.
- If an authentic recording would delay submission, explicitly cut this enhancement and retain the
  current capture with the explanatory steps. Never substitute a simulated interaction.

### Optional illustrative before/after pair

- Do this after real product evidence; cut it if it delays verification or submission.
- Create one photorealistic pair: an ordinary small room before gym equipment and the same room
  with a plausible gym concept. Keep camera, proportions, doors, windows and fixed furniture
  consistent; align it with the room shown in product captures.
- Use a compact before/after element around the process introduction, replacing repetitive imagery
  rather than adding another long section. Keep editing/settings and main hero proof as real captures.
- Label it visibly: **AI-generated room concept — illustrative, not an app render.** Do not imply
  built-in photorealistic rendering, photo upload or accurate automatic reconstruction. Photos go
  to the external agent; reference measurements and review remain necessary.
- Record generation tool, date, prompt, references and usage rights in asset provenance, separately
  from screenshots. Generated concepts are not evidence of geometry or validation results.

## Verification and exit gate

1. Capture current product states, replace stale files, and update provenance and the landing spec.
2. Add the real recording where practical, then evaluate the optional before/after pair.
3. Check image legibility, descriptive alt text, dimensions, responsive sizes, loading priority,
   layout stability and media controls at 320px, a wider phone, tablet and desktop.
4. Run relevant asset/component checks and the repository validation ladder for code changes.
   Documentation/media alone do not require invented tests.
5. Hand off final media and corresponding public-build checks to the submission plan. Do not claim
   public/device/agent-host acceptance from local captures or layout inspection.

Complete when captures match the polished creator and optional enhancements are delivered or
explicitly cut. Transfer durable decisions to `docs/LANDING_PAGE.md` and `docs/LANDING_ASSETS.md`,
keep unresolved release checks in the submission plan, then remove this plan and its index row.
Routine verification belongs in the task/PR/CI record, not another phase report.
