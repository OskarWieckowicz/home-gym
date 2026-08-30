# Home Gym Creator — product concept

## Vision

Home Gym Creator is a fictional fitness-equipment store combined with a simple, geometric room planner. Users can browse and filter products, map their available space, and then design a home gym—on their own or together with an AI agent—that fits their budget, training goals, and room constraints.

The project’s most important element is human–agent collaboration on the same room model. A user can edit the design manually, while the agent reads its current state and continues its work through WebMCP tools.

## Main scenario

1. The user specifies the room dimensions or asks the agent to create an approximate model from a photo and provided reference measurements.
2. The user or agent adds physical obstacles, explicit unavailable floor zones, and simple doors or windows where relevant.
3. The user provides training goals, preferences, and a maximum budget.
4. The agent reads the room model and searches the product catalog.
5. The agent selects equipment and places simplified models of it in the room.
6. The geometry engine checks collisions, clearance zones, room height, and budget.
7. The agent improves the design or explains the necessary trade-offs.
8. The user can manually move, rotate, add, and remove elements, then ask the agent to adapt the rest of the layout.
9. The completed design includes a list of selected equipment, its cost, and a summary of space use and training-goal coverage.

## Room model

The planner is not intended to be a professional CAD program or a realistic interior simulator. Its source of truth is a simple 2.5D geometric model:

- the floor outline,
- room height,
- simple wall-bound doors and windows,
- physical obstacles represented by rectangles or cuboids,
- unavailable floor zones represented as 2D rectangles,
- equipment described by a footprint, height, and additional space required for use.

For example, a wardrobe can be stored as a cuboid with a position, width, depth, and height. It does not need a realistic graphical model.

A physical obstacle and an unavailable zone are related editor tools but remain different domain concepts. A physical obstacle has height and participates as a volume in the spatial model. An unavailable zone is only a 2D floor constraint. Doors and windows are minimal wall elements with a name, wall, offset along that wall, and width. In the MVP they do not model hinges, opening direction, swing arcs, sill or opening height, and they do not create an unavailable zone automatically. They also do not participate in floor collision checks.

Gym equipment should have at least two areas:

- **physical area** — the space actually occupied by the equipment,
- **clearance zone** — the additional space needed for exercise, access, or safe operation.

The interface opens in the editable 3D view, with a precise 2D alternative and recovery path. Both use the same deterministic geometry; rendered meshes never define placement or validation.

## Creating a room from a photo

The user can send the agent a photo of the room. The agent interprets visible objects and uses WebMCP to create an approximate model of the room and its obstacles.

A photo is not treated as a trustworthy source of exact measurements. The user should provide at least one reference measurement, such as the width of a wall, door, or specific piece of furniture. A model created from a photo should be clearly marked as an estimate that can be manually corrected.

Example collaboration:

> This is a 4 × 3.2 m room. On the left is a 180 × 60 cm wardrobe that I cannot move. Map this room and mark the remaining visible obstacles.

The agent creates the model, and the user reviews and corrects the result before gym planning begins.

## Product catalog

The app has its own catalog of fictional products. Users can browse, filter, and use products in the planner as usual.

Each product should include commercial, spatial, and training data:

- identifier and name,
- category,
- price,
- width, depth, and height,
- clearance zones on individual sides,
- weight and maximum load when relevant,
- supported exercises,
- training goals and muscle groups,
- assembly, anchoring, flooring, or ceiling-height requirements,
- optional constraints and safety recommendations.

Products in a design, whether placed on the floor or added only to the shopping list, affect the current budget use. Selection-only accessories such as Signal Resistance Bands and Groundwork Foam Roller cannot occupy floor space.

## Project editor

The user should be able to:

- change room dimensions,
- select one of four placement tools: physical obstacle, unavailable zone, door, or window,
- place the selected element directly on a valid floor or wall target,
- edit the newly created or selected element in the properties inspector,
- drag products from the catalog into the room, or add them to the project without placing them,
- move, rotate, and unplace equipment without removing it from the shopping list,
- remove equipment from the design,
- display physical footprints and clearance zones,
- switch between a 2D plan and a simple 3D view,
- review warnings and current cost,
- undo and redo changes.

Manual user operations and operations performed through WebMCP should use the same domain logic. This keeps the project consistent regardless of who made a change.

The editor follows a **palette → room → inspector** interaction in either view: the left panel chooses what to add, a floor or wall-edge target determines where it is created, and the right panel edits an existing selection. The inspector is not a second creation step.

3D is the default working view, with one contextual interaction mode: click an entity to select it,
then drag the selected entity to move it. Dragging elsewhere (including an unselected entity)
orbits the camera without changing selection; clicking empty space clears selection. Placement
tools temporarily own primary input. Drafts and camera changes do not enter history; a completed
changed drag creates one command. An agent edit cancels a stale manual draft. Camera-facing walls
are cut away for visibility, while openings, mounted equipment and all wall targets remain
available. Native lists, exact inspector fields and centre placement provide keyboard alternatives.
If graphics fail, the same project can continue in 2D without resetting history or WebMCP.

## Agent role

The agent is responsible for:

- interpreting the user’s goals and preferences,
- creating an initial room model from a description or photo,
- selecting equipment from the catalog,
- proposing equipment placement,
- responding to manual user changes,
- finding trade-offs among cost, space, and functionality,
- explaining design decisions and constraints.

The agent should not decide for itself whether the geometry is valid. A deterministic application engine should detect collisions and rule violations. The agent uses validation results to improve the design iteratively.

## WebMCP capabilities

The creator exposes current state and summary reads, catalog search, room/settings changes,
obstacle/opening operations, shopping-item and placement commands, layout validation,
deterministic placement suggestions, batch evaluation and atomic application. Each changed
mutation uses the same domain commands and history as manual editing.

The [architecture tool contract](TECHNICAL_ARCHITECTURE.md#route-scoped-tool-sets) records the
exact route split: 21 tools in the creator, two catalog reads and three summary reads. Keep tools
precise and avoid overlapping operations or a separate backend-only planning path.

## Project summary

The creator's **View summary** action opens a read-only destination for the current locally saved
project. It brings together every selected item and its placement status, total cost against budget,
training goals, layout checks and recommendations. The finished layout has a default 2D plan and an
optional 3D view. **Back to editing** resumes the locally saved layout; **Export project** downloads
the existing JSON format. A project without equipment gets an empty state instead of empty metrics.

The page and `get_project_summary` share one deterministic derivation. Free floor measures the room
minus the union of floor-occupying and reserved footprints, not the space available for every
exercise. Use-zone and access checks remain separate. The summary is local to this browser, not a
shareable cloud link or a checkout. It registers only three read-only tools: summary, state and
validation. See the [summary contract](TECHNICAL_ARCHITECTURE.md#project-summary).

## Example agent conversation

The user sends a photo and says:

> This is a 4 × 3.2 m room. There is a 180 × 60 cm wardrobe on the left that I cannot move. I have PLN 10,000 and want to train squats, bench press, and pull-ups.

The agent:

1. creates the room geometry,
2. adds the wardrobe, door, and remaining obstacles,
3. searches for a rack, bench, barbell, and weights,
4. places the equipment,
5. runs validation,
6. corrects detected collisions,
7. shows the cost and unused space.

The user manually moves the rack and then says:

> The rack stays here. Add something for cardio, but stay within budget and keep room for deadlifts.

The agent reads the current state, chooses suitable equipment, and adjusts the rest of the design.

## Hackathon MVP scope

The MVP should focus on one complete, reliable flow:

- the curated fictional catalog, including placeable equipment and shopping-list-only accessories,
- a rectangular room with editable dimensions,
- simple obstacles and unavailable zones,
- simple wall-bound doors and windows without automatic clearance or swing zones,
- a primary editable 3D view and a precise 2D alternative/fallback,
- manual equipment placement and rotation,
- budget and training goals,
- deterministic collision detection,
- basic clearance zones,
- a shopping list and project summary,
- a complete agent–WebMCP–editor flow,
- the ability for the agent to continue after a manual user change.

The following are outside the core scope:

- professional CAD,
- accurate 3D reconstruction from photos,
- LiDAR and AR scanning,
- realistic physics,
- photorealistic rendering,
- live prices from real stores,
- real checkout,
- a complete workout-plan generator.

## Key differentiator

Home Gym Creator should not be presented as an ordinary store, 3D editor, or shopping chatbot. Its differentiator is shared, agent-assisted space planning under multiple simultaneous constraints:

- physical room dimensions,
- existing obstacles,
- space required for exercise,
- budget,
- training goals,
- installation and spatial requirements.

The key product promise:

> Describe your space and goals, then design a gym with an agent that will actually fit in your home.
