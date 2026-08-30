# Project documentation

Keep current contracts, constraints, source references and asset provenance here. Unfinished work
belongs in the [active plans](../plans/README.md); completed execution history belongs in Git and
task/PR/CI records, not a new report for each phase.

## Product and implementation

- [Product concept](PRODUCT_CONCEPT.md): scope and shared human/agent workflow.
- [Technical architecture](TECHNICAL_ARCHITECTURE.md): source map, geometry, commands, WebMCP,
  summary and persistence contracts.
- [Landing specification](LANDING_PAGE.md) and [editor specification](EDITOR_MOCKUP.md): current
  UI behavior; linked mockups are design references, not acceptance evidence.
- [Reusable agent prompt](AGENT_HOME_GYM_WORKFLOW_PROMPT.md): starting input for workflow testing.

## External constraints

- [Hackathon requirements](HACKATHON_REQUIREMENTS.md): submission constraints and source links.
- [WebMCP sources](WEBMCP_SOURCES.md): dated research, local adapter decisions and runtime caveats.
  Recheck external availability/version claims when using them for release.

## Asset production and provenance

- [Visual strategy](PRODUCT_VISUALS_STRATEGY.md): production workflow, conventions and exceptions.
- [Landing captures](LANDING_ASSETS.md): source, license and reproducible room/crop information.
- Model records: [Compact Dual-Pulley](COMPACT_DUAL_PULLEY_MODEL.md),
  [Loop Cable Trainer](LOOP_CABLE_TRAINER_MODEL.md), [Flex Dumbbells](FLEX_STUDIO_DUMBBELLS_MODEL.md),
  [Dip Bars](FREESTANDING_DIP_BARS_MODEL.md), [Exercise Mat](GROUNDWORK_EXERCISE_MAT_MODEL.md),
  [Punching Bag](WALL_MOUNTED_PUNCHING_BAG_MODEL.md).
- [Image provenance metadata](../scripts/catalog-image-provenance/): original prompts and sources.

Asset browser review remains paused in the asset plan. Public-build, agent-host and device
acceptance are tracked in the submission plan; this index does not claim they have passed.
