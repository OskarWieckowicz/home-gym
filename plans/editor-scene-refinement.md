# Editor scene refinement

User-approved slice of creator polish: room materials, quieter use zones, and camera framing.
Do not change lighting/shadows, product assets, geometry, validation, purchase behavior or history.

## Unfinished outcomes

1. Use a warm neutral viewport, off-white walls and a medium-gray matte floor. Keep room colors
   consistent in the shared 3D summary without changing the 2D palette.
2. Draw floor use zones with a subtle fill and thin dashed perimeter. The default shows zones
   for the selected equipment and equipment with spatial issues; an explicit Show all use zones
   toggle reveals the rest. Keep warnings/errors visible regardless of that toggle, and explain
   colors in a compact legend. Preview zones remain visible and do not imply valid placement.
3. Improve initial/Fit view composition using the projected room bounds rather than an assumed
   visual center. Add an explicit Focus selected action using domain-derived bounds for equipment,
   obstacles/zones and wall elements. No focus for unplaced purchases. Ordinary edits and selection
   changes must not move the camera; view controls must not change the project or history.
4. Cover overlay visibility, focus bounds/camera fitting, and editor wiring with focused tests.
   Check the live editor on desktop and a narrow viewport, including selection, all-zones toggle,
   focus/Fit/Top, 2D/3D and undo. Run quality:quick, lint:report, agent:verify and build if needed
   for client boundary or bundle changes.
5. Transfer the implemented presentation contract into docs/EDITOR_MOCKUP.md and relevant
   architecture notes, then remove this completed slice plan. The wider creator-polish plan remains.
