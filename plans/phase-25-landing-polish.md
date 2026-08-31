# Phase 25 — Landing polish

> Order 2 in the [active queue](README.md). Start after creator polish so new captures reflect the
> finished editor. Submission still owns live-URL acceptance of the deployed landing.

## Scope and boundaries

Refresh the landing with new images and tighter copy. Keep the accepted process-first structure in
[the landing specification](../docs/LANDING_PAGE.md): problem, from-scratch process, shared
editing, WebMCP explanation. This is not a sales page, catalog showcase or demo walkthrough.

Use captures from the polished creator. Images must be real product states, with truthful
warnings, dimensions, responsive sizing, descriptive alt text and provenance. Do not ship the
approved mockup as the page or hero image. Do not reopen product GLB/photo production for catalog
SKUs; landing imagery is editorial capture, not a new asset queue.

## Remaining outcome

- Hero, How it works and shared-editing images are current captures of the polished creator.
- Copy is reviewed and tightened in English without changing the page goal or inventing
  capabilities (no in-app chatbot, no automatic photo reconstruction, no safety certification).
- The specification and implementation stay in agreement after copy or image changes.

## Work sequence

1. Capture new landing images from the polished creator: hero result preview; the three How it
   works states of the same room; a shared-editing capture with a selected item.
2. Replace the current landing images and keep provenance with the existing visual-strategy
   rules for production images.
3. Review and refine landing copy (headline, supporting lines, process steps, agent guide,
   shared-editing and WebMCP sections). Update `docs/LANDING_PAGE.md` when copy changes.
4. Check the landing at phone, tablet and desktop widths: image stability, overflow, sticky-header
   anchors, CTAs and prompt-copy behavior.

## Exit gate

Landing images and copy are ready for judges. Public-build, device and agent-host verification
remain in the [submission plan](phase-28-submission.md). Transfer durable copy and image decisions
into `docs/LANDING_PAGE.md`, then remove this plan and its index row.
