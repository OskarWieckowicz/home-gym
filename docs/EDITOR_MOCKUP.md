# Home Gym Creator — editor mockup

## Mockup

![Home Gym Creator editor mockup](./mockups/home-gym-planner-editor.png)

The mockup shows a simple 2.5D editor for planning a home gym. It is not a professional CAD program or a realistic interior simulator. The interface is for conveniently placing simple geometric objects and checking whether equipment and required use zones fit in the room.

## Interface layout

### Top bar

The bar contains the project name, a **2D / 3D** view switch, undo and redo, and project save.

### Element panel

The left panel provides elements that can be added to the project:

- the room and its walls,
- doors and their swing zones,
- windows,
- obstacles such as a wardrobe, radiator, or unavailable area,
- training equipment from the catalog.

Elements can be dragged onto the plan, then moved, rotated, and removed.

### Workspace

The center of the interface is occupied by the room plan. Dimensions, walls, doors, windows, obstacles, and equipment are visible on it.

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

## 2D / 3D switch

The switch changes how the same project is presented. The views do not have separate data — they use a shared geometric model.

### 2D view

The 2D view is the primary editing mode. It shows the room from above and allows precise:

- placement and rotation of equipment,
- changing element dimensions and positions,
- controlling distances,
- comparing the physical footprint with the clearance zone,
- checking collisions with obstacles and door-swing zones.

### 3D view

The 3D view is a supporting spatial preview. The room, obstacles, and equipment are shown as simple solids, without realistic models and materials.

The user can orbit the camera, zoom, and inspect the project from different sides. The view helps check:

- equipment height relative to the ceiling,
- the relationship of equipment to windows and wall elements,
- visual crowding of the room,
- passageway availability,
- overall readability and functionality of the layout.

The main interaction rule: **2D is for precise design, and 3D is for spatial review of the result**.

## Source of truth

Both views are only different representations of the same 2.5D model. Positions, sizes, heights, and use zones are stored as simple geometric data. Layout validation does not depend on 3D graphics and remains deterministic.
