# Signal Resistance Bands — shopping-list-only

User clarified that Signal bands are not placeable and need no model.

- Set existing product placementMode to selection-only, preserving identity, price and photo.
- Zero floor use-zone margins and clarify that exercise space is not validated.
- Existing saved/imported band placements must become unplaced shopping items, preserving item
  IDs, price totals and all unrelated room data. Do not reject or reset the whole saved project.
- Restrict compatibility conversion to this explicitly retired product; no blanket removal of
  unknown or invalid placements. A creator-side helper covers store initialization, JSON import
  via replaceProject, and localStorage restoration before catalog validation. The domain codec
  remains catalog-independent. Show a conversion notice; do not write storage on initialization.
- Test command rejection, shopping/budget behavior, old-file conversion and preservation.
- Run focused checks and validation ladder; read-only review of persistence compatibility.

Status: complete. Signal bands are selection-only with the existing photo and price; no GLB needed.

## Verification and compatibility

- Shared creator reconciliation at initialization, replacement/import and local restoration
  removes only obsolete Signal placements when the resolver declares selection-only. Existing
  item IDs and multiplicity, cost, settings and all unrelated data remain intact.
- Import and restore show a specific notice. Initial restore writes nothing; next ordinary
  edit saves the reconciled state. Import is undoable; repeated import is a no-op.
- 12 focused catalog tests and 35 store/persistence/import checks passed; restore test also
  verifies the first normal edit saves both retained bands and newly added items.
- quality:quick passed; lint:report has zero errors and 36 existing warnings.
- agent:verify passed: 1007 tests / 113 files. Build and diff check passed.
- Primary agent reviewed helper/ingress/history changes. Separate reviewer dispatch was
  unavailable because the collaboration tool reached its agent-thread limit.
- Browser review remains paused; no deployment. Modern-web-guidance search/list supplied no
  matching migration-specific pattern; existing store, validation and notice mechanisms reused.
