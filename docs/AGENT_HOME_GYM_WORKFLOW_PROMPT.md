# Reusable Home Gym Design Workflow Prompt

Use this prompt with Codex while the Home Gym Creator editor is open. Attach at least one photo of
the room and provide at least one reliable reference measurement whenever possible.

```text
Help me design a home gym in the currently open Home Gym Creator editor.

Work in stages. Use the tools exposed by the website and modify the current project directly. Do
not continue to the next stage until I have accepted the result of the current stage.

STAGE 1 — Analyze the room

Analyze the attached room photo. Identify:

- the approximate room shape and dimensions,
- doors and windows,
- fixed furniture and other physical obstacles,
- floor areas that must remain unavailable,
- anything whose position or dimensions cannot be determined reliably.

Treat the photo only as a source of approximate spatial information. Use the following measurements
as references:

- room width: [ENTER A VALUE OR "UNKNOWN"],
- room depth: [ENTER A VALUE OR "UNKNOWN"],
- room height: [ENTER A VALUE OR "UNKNOWN"],
- known reference measurement: [FOR EXAMPLE: DOOR WIDTH 90 CM OR WARDROBE 180 x 60 CM],
- elements that cannot be moved: [ENTER DETAILS].

If an essential measurement is missing, ask me the single most important question needed to create
a useful model. Do not infer exact measurements from photographic perspective alone.

STAGE 2 — Create the room model

Create an approximate model in the editor:

1. Configure the room dimensions.
2. Add visible fixed obstacles.
3. Add doors and windows. Doors are required before equipment is placed, not only when their positions can be estimated reasonably. Without a door, access cannot be evaluated.
4. Add unavailable floor zones where needed.
5. Read the current project state again after making the changes.
6. Validate the resulting layout.

After creating the model, briefly summarize:

- what you added,
- which measurements are reliable,
- which values are estimates,
- what I should verify or adjust manually.

Then stop and wait for my approval.

STAGE 3 — Allow manual corrections

Let me manually move, rotate, add, or remove elements in the editor.

When I say "the room is ready," read the current project state again. Treat the application state as
the source of truth and do not rely on the earlier version of the model. Validate the room and report
any remaining problems before planning the gym.

STAGE 4 — Discuss training needs

Have a short conversation with me to determine:

- my primary training goals,
- the exercises I want to perform,
- my experience level,
- how many times per week I plan to train,
- my maximum budget in PLN,
- equipment I already own,
- preferences concerning free floor space, noise, foldable equipment, and wall or floor anchoring,
- any health or mobility constraints relevant to equipment selection.

Ask questions in small groups rather than presenting a long questionnaire. When an answer is vague,
offer a few sensible options.

Before designing the gym, summarize the requirements and ask me to confirm them. Save the accepted
budget and supported training goals in the project.

STAGE 5 — Design the gym

After I confirm the requirements:

1. Read the current room model.
2. Search the catalog for equipment that fits my goals, exercises, room constraints, and budget.
3. First present a concise equipment proposal with reasons and costs.
4. Wait for my approval before placing the proposed equipment.
5. Add and arrange the approved equipment in the room, accounting for both its physical footprint
   and the use zone required for safe operation.
6. After every meaningful group of changes, validate collisions, use zones, ceiling height,
   unavailable areas, budget, and reachability. A walking path must stay at least 75 cm
   wide, and a path narrower than 100 cm is reported as tight rather than broken, so a
   person does not have to squeeze. Those widths are application conventions, not a
   building code. Reaching the last 50 cm off a path counts as access; reach never
   substitutes for a path.
7. If validation reports errors, try to improve the arrangement. Warnings mean a legitimate
   trade-off, such as a bench standing in a rack's working area, except when they describe
   missing input or unreachable entities. Unreachable doors and equipment are errors, not
   trade-offs. ACCESS_NOT_EVALUATED means add a door before judging the layout. If a
   mutation returns accessImpact.madeUnreachable, resolve those entities before continuing.
   Report remaining warnings, but do not treat them as a broken layout. Read
   validation.valid, validation.errorCount, validation.warningCount, validation.access,
   and accessImpact after each mutation. A successful tool call can still leave errors or
   warnings. Do not declare the layout valid based only on visual judgment or on ok: true.
8. Do not remove or move room elements that I marked as fixed without my permission.

At the end, provide:

- the selected equipment list,
- the total cost,
- coverage of my training goals and exercises,
- compromises caused by space or budget,
- any warnings that remain after validation,
- sensible options for future upgrades.

Collaboration rules:

- Make all changes in the currently open project.
- My manual changes take precedence over earlier assumptions or suggestions.
- After any manual edit, read the current project state before continuing.
- Use centimeters for dimensions and PLN for costs.
- Clearly distinguish confirmed facts, information I provided, and your estimates.
- Do not purchase anything or take actions outside the editor.
```

## Practical note

A single photo is not a trustworthy source of exact measurements. For a useful first model, provide
at least one known dimension, such as the room width, a door width, or the dimensions of a visible
piece of furniture. The resulting room model is an editable geometric approximation, not a CAD
reconstruction of the photograph.
