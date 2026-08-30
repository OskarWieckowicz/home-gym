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

The planner is not intended to be a professional CAD program or a realistic interior simulator. Its source of truth will be a simple 2.5D geometric model:

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

The interface may present a 2D plan and a simple 3D view, but spatial calculations should rely on the simplest practical deterministic geometry.

## Creating a room from a photo

The user can send the agent a photo of the room. The agent interprets visible objects and uses WebMCP to create an approximate model of the room and its obstacles.

A photo is not treated as a trustworthy source of exact measurements. The user should provide at least one reference measurement, such as the width of a wall, door, or specific piece of furniture. A model created from a photo should be clearly marked as an estimate that can be manually corrected.

Example collaboration:

> This is a 4 × 3.2 m room. On the left is a 180 × 60 cm wardrobe that I cannot move. Map this room and mark the remaining visible obstacles.

The agent creates the model, and the user reviews and corrects the result before gym planning begins.

## Product catalog

For the hackathon, the app will have its own catalog of fictional products. Users can browse, filter, and use products in the planner as usual.

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

Products in a design, whether placed on the floor or added only to the shopping list, affect the current budget use. Selection-only accessories such as wrist wraps cannot occupy floor space.

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

The editor follows a **palette → plan → inspector** interaction: the left panel chooses what to add, the plan determines where it is created, and the right panel edits an existing selection. The inspector is not a second creation step.

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

## Initial WebMCP tool set

- `get_project_state` — read the room, obstacles, settings, budget, and equipment,
- `configure_room` — set room dimensions and parameters,
- `add_obstacle` — add furniture, an obstacle, or an unavailable zone,
- `update_obstacle` — change an obstacle’s dimensions or position,
- `remove_obstacle` — remove an obstacle,
- `add_wall_element` — add a minimal door or window to a wall,
- `update_wall_element` — change a door or window’s name, wall, offset, or width,
- `remove_wall_element` — remove a door or window,
- `search_products` — search products by price, size, and use case,
- `get_product_details` — retrieve complete product data,
- `place_product` — add a catalog product and place it on the floor in one step,
- `add_product_to_project` — add a catalog product to the shopping list without placing it,
- `place_project_item` — place an existing unplaced project item,
- `update_placement` — move or rotate equipment,
- `unplace_product` — remove equipment from the floor while keeping it in the project,
- `remove_product` — remove a project item and any floor placement,
- `apply_layout_changes` — apply multiple layout changes in one call,
- `validate_layout` — check collisions, clearance zones, height, and budget,
- `get_project_summary` — retrieve the shopping list, cost, and training-goal coverage.

The tool set should be precise enough for the agent to perform multi-step work, but should not contain many overlapping operations.

## Example demo

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

- a fictional catalog of several dozen products,
- a rectangular room with editable dimensions,
- simple obstacles and unavailable zones,
- simple wall-bound doors and windows without automatic clearance or swing zones,
- a 2D plan and an optional simple 3D preview,
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
