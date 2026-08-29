# Home Gym Creator — editor mockup

## Mockup

![Home Gym Creator editor mockup](./mockups/home-gym-planner-editor.png)

The mockup shows a simple 2.5D editor for planning a home gym. It is not a professional CAD program or a realistic interior simulator. The interface is for conveniently placing simple geometric objects and checking whether equipment and required use zones fit in the room.

## Interface layout

### Top bar

The bar contains the project name, a **2D / 3D** view switch, undo and redo, and project save.

### Element panel

The left panel is a placement palette. Its room-structure section exposes four explicit tools:

- **Physical obstacle**,
- **Unavailable zone**,
- **Door**,
- **Window**.

Selecting a tool enters a temporary placement mode. The next valid plan interaction creates the element directly: obstacles and unavailable zones are placed on the floor, while doors and windows are placed on a wall. The created element becomes the current selection and the placement tool exits. The flow is **palette → plan → inspector**; the user does not confirm creation in a second panel. Training equipment remains available from the catalog as that part of the MVP is introduced.

### Workspace

The center of the interface is occupied by the room plan. Dimensions, walls, doors, windows, obstacles, unavailable zones, and equipment are visible on it.

A physical obstacle is a rectangular volume with width, depth, and height. An unavailable zone is a 2D floor constraint with width and depth only. Doors and windows are intentionally minimal wall elements described by a name, wall, offset along the wall, and width.

In this MVP phase, doors and windows have no hinge side, opening direction, swing arc, sill height, or opening height. Adding either one does not automatically add an unavailable zone, and wall elements do not block floor collision checks. If a real doorway needs free floor space, the user or agent adds an independent unavailable zone explicitly.

Each piece of equipment can present two areas:

- **physical footprint** — the space actually occupied by the device,
- **clearance zone** — the extra space needed for exercise, access, or safe operation.

A selected element receives edit handles and dimensions. Collisions and insufficient spacing are signaled with warnings.

### Properties panel

The right panel shows parameters of the selected element:

- position,
- width,
- depth,
- height,
- use-zone dimensions,
- collision and constraint messages.

Changes made in the form immediately update both views.

The panel is an inspector for an existing selection, not a creation wizard. The displayed fields depend on the selected kind: physical obstacles include height, unavailable zones do not, and doors/windows expose only their minimal wall properties.

## 2D / 3D switch

The switch changes how the same project is presented. The views do not have separate data — they use a shared geometric model.

### 2D view

The 2D view is the primary editing mode. It shows the room from above and allows precise:

- placement and rotation of equipment,
- changing element dimensions and positions,
- controlling distances,
- comparing the physical footprint with the clearance zone,
- checking collisions with physical obstacles and explicit unavailable zones.

### 3D view

The 3D view is a supporting spatial preview. The room and obstacles use simple solids; equipment
uses simplified generated GLB families with geometric fallbacks. The preview is not a
photorealistic interior or a source of placement geometry.

The user can orbit the camera, zoom, and inspect the project from different sides. The view helps check:

- equipment height relative to the ceiling,
- the relationship of equipment to windows and wall elements,
- visual crowding of the room,
- passageway availability,
- overall readability and functionality of the layout.

The main interaction rule: **2D is for precise design, and 3D is for spatial review of the result**.

## Source of truth

Both views are only different representations of the same 2.5D model. Positions, sizes, heights, and use zones are stored as simple geometric data. Layout validation does not depend on 3D graphics and remains deterministic.
