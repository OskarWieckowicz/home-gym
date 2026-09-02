# Home Gym Creator — editor mockup

## Original concept mockup

![Home Gym Creator editor mockup](./mockups/home-gym-planner-editor.png)

The mockup shows a simple 2.5D editor for planning a home gym. It is not a professional CAD program or a realistic interior simulator. The interface is for conveniently placing simple geometric objects and checking whether equipment and required use zones fit in the room.

## Interface layout

### Top bar

The compact project header contains a home/brand link, the project title and actual local-save
status. **Project** reveals New project, Settings, Export, Import and Reset; a help disclosure
explains editing. **New project** uses the guarded explicit-start flow, replaces the durable project
and starts with empty history. **Reset** is undoable and restores the default room, budget and
training goals together. **WebMCP activity** reports Checking, Ready or Unavailable and counts new
tool calls. It opens the creator's session-only activity inspector without navigating away or
blocking the room editor.
The creator omits the marketing header/footer. All editor labels are English.

### WebMCP activity inspector

The inspector is a non-modal panel over the right side of the desktop creator, leaving the room
visible while an external agent works. On narrow screens it uses the full viewport width. The
toolbar trigger remains available in supported and unsupported browsers; the existing manual-editing
fallback remains visible when registration is unavailable.

The panel lists up to 50 most recent calls made through the creator's actually registered WebMCP
tool descriptors. Each entry identifies the tool, read-only or state-changing intent, start time,
duration and one of Running, Returned, Tool error or Exception. Selecting an entry shows the
application-side input payload and returned result as copyable JSON. A fulfilled `{ ok: false }`
result is a Tool error, distinct from a thrown or rejected callback. Registration itself and manual
UI commands do not create entries.

Activity is diagnostic UI, not project data: it is never persisted, autosaved, exported, added to
undo/redo or exposed as another tool. Clear removes the session log. Snapshots redact common secret
keys and explicitly mark data truncated at the display limit. The panel does not claim to expose
the host's internal transport, caller identity or failures occurring outside the page callback.
Its trigger uses `aria-expanded` and `aria-controls`; Escape and Close return focus to that trigger,
and scrollable JSON blocks remain keyboard focusable.

The **2D / 3D** switch, undo/redo and room dimensions live in a separate toolbar directly above
the viewport. **Fit view** frames the room; **Focus selected** frames a selected placed object,
and is disabled for no selection or an unplaced purchase. **Top view** is secondary under Camera
views. **Show all use zones** reveals the full zone layer. **Presentation view** hides all use
zones, unavailable zones, selection outlines and diagnostic colors. It makes the scene camera-only
while panel checks and inspector editing stay available. It preserves selection and the prior
use-zone layer choice. Starting placement or switching to 2D exits presentation view.
These controls stay mounted while the
3D scene loads or fails, and change only presentation state, never project history.

### Element panel

The left panel has keyboard-accessible **Equipment / Room / Project items** tabs. Equipment
provides catalog search, category filtering and one main action per product: **Place / Cancel**
for room equipment (including wall-mounted products), or **Add to list** for accessories with
**No floor placement needed**. Search/filter state survives tab changes. Project items lists
equipment, floor areas and openings. Switching tabs cancels only
an unfinished placement, preserving selection and history.

Catalog cards show quantities, pending placement counts and **Places an item already on your list**
when applicable. Every catalog placement path reuses the first unplaced copy in project order;
otherwise it buys a new copy only on successful placement. Cancellation leaves purchases and cost
unchanged. Project items keeps a separate priced row per copy with **Placed**, **Not placed** or
**No placement needed**. The tab badge and the count/cost notice above the list count only unplaced
equipment that requires room placement; the notice explains that its cost is already included.

**Remove from project** remains directly available and confirms deletion of placed equipment.
**Remove from room, keep on list** is also directly visible in both the list and Properties,
with **Total cost stays the same** beneath it; there is no More actions disclosure.
Removing the placement returns focus to the retained list row or Properties, as appropriate.

The Room tab exposes room dimensions and four explicit placement tools (project settings are not room geometry):

- **Physical obstacle**,
- **Unavailable zone**,
- **Door**,
- **Window**.

Selecting a tool enters a temporary placement mode. The next valid plan interaction creates the element directly: obstacles and unavailable zones are placed on the floor, while doors and windows are placed on a wall. The created element becomes the current selection and the placement tool exits. The flow is **palette → plan → inspector**; the user does not confirm creation in a second panel. Training equipment is available from the catalog tab.

### Workspace

The center of the interface is occupied by the room plan. Dimensions, walls, doors, windows, obstacles, unavailable zones, and equipment are visible on it.

Desktop uses a viewport-height three-column workspace with independently scrolling sidebars.
Narrow layouts put the inspector below the scene; phone layouts stack all three regions with
normal page scrolling and a bounded catalog. A compact use-zone legend and a short gesture hint
sit beneath the 3D scene.

A physical obstacle is a rectangular volume with width, depth, height and optional measured effect
through four required functional-clearance values. The inspector groups them under **Space needed
to use this furniture** and explains that front/back/left/right rotate with the obstacle; zero means
not specified. An unavailable zone is a 2D floor constraint with width and depth only and has no
functional-clearance controls. Doors and windows are intentionally minimal wall elements described
by a name, wall, offset along the wall, and width.

In this MVP phase, doors and windows have no hinge side, opening direction, swing arc, sill height, or opening height. Adding either one does not automatically add an unavailable zone, and wall elements do not block floor collision checks. If a real doorway needs free floor space, the user or agent adds an independent unavailable zone explicitly.

Each piece of equipment can present two areas:

- **physical footprint** — the space actually occupied by the device,
- **clearance zone** — the extra space needed for exercise, access, or safe operation.

A selected element receives edit handles and dimensions. Collisions and insufficient spacing are signaled with warnings.

### Properties panel

The right panel starts with **Project cost**: total, budget and the remaining or over-budget amount.
It remains visible across selection and tab changes, sticky during desktop panel scrolling and
static at the start of Properties below the scene on narrow layouts. **Edit budget** opens the
Project settings dialog with Budget focused. All purchases count, including unplaced equipment and accessories; previews do
not. Amount updates use a polite status region without moving focus. Zero budgets are valid and
incomplete prices are explicitly identified rather than presented as free products.

A compact **Training goals** summary sits beneath the cost, with **Edit** or **Set training goals**.
It opens the same dialog with the first goal checkbox focused. **Project → Settings** is the third
entry point, available without switching tabs. Goals stay outside the monetary live status.

The native modal keeps the current selection, inspector and 2D/3D view in place and cancels any
unfinished placement without making a purchase. **Apply settings** validates and saves budget and
goals through one shared command, closes only on success, and creates one undo step only if values
changed. **Cancel**, the close button and Escape discard the draft. Focus returns to the opener
(the Project button for the menu entry), while native modal behavior contains keyboard focus.
External settings changes require **Reload current settings** before saving; unrelated project
edits do not erase the draft or move focus. The dialog fits narrow screens and scrolls at small heights.

Below the cost section, the panel shows parameters of the selected element:

- position,
- width,
- depth,
- height,
- use-zone dimensions,
- collision and constraint messages.

Changes made in the form immediately update both views.

The inspector has a quiet Properties label, a contextual form and a selected-product
thumbnail with the equipment name as its main heading. Clearing selection returns to room properties.
Layout checks start expanded. Their badges and short issue lists use the same spatial issue set:
budget overrun appears only in Project cost, and missing access input is separate from conflicts.
The single **Add a door to check access.** message and error/warning badges remain visible when collapsed.
Missing access information is not presented as a completed or successful access check.
Domain validation and WebMCP results still include all issues, including budget and missing doors.

Selected placed equipment shows **Distances to surroundings**: signed gaps to the four room
walls (named as in 2D) and the nearest physical obstacle. Measurements use rotated physical
footprints in centimeters, not GLBs. Obstacle distance is the shortest planar edge distance,
with touching and overlapping footprints identified explicitly. Unavailable zones, equipment
use zones and height are excluded. These measurements are not access or safety clearance claims.

**Lock position** persists a placement lock shared by manual and agent edits. Locked equipment
remains selectable and focusable, but cannot move, rotate, unplace or be removed from the project.
The inspector and project list disable those actions and explain how to unlock. 2D also marks
locked equipment. Lock/unlock uses the same domain command and undo/redo history as other edits.

The panel is an inspector for an existing selection, not a creation wizard. The displayed fields depend on the selected kind: physical obstacles include height, unavailable zones do not, and doors/windows expose only their minimal wall properties.

## 2D / 3D switch

The switch changes how the same project is presented. The views do not have separate data — they use a shared geometric model.

The editor chrome follows the application-wide warm neutral system: off-white/stone surfaces,
near-black text and controls, fine neutral dividers and signal red for focus, selection and primary
action accents. Green success, amber warnings and deeper red errors remain semantic rather than
decorative. The 2D plan uses neutral equipment footprints and use zones so those states do not
compete with selection or validation colors.

### 2D view

The 2D view is the precise alternative and graphics-failure fallback. It shows the room from above and allows:

- placement and rotation of equipment,
- changing element dimensions and positions,
- controlling distances,
- comparing the physical footprint with the clearance zone,
- checking collisions with physical obstacles and explicit unavailable zones.

### 3D view

The 3D view is the default project editor. The room and obstacles use simple solids; equipment
uses simplified generated GLB families with permanent geometric fallbacks. Neither GLBs nor their
fallbacks define placement geometry. Domain-sized envelopes provide stable selection even while
a model is loading or unavailable.

Room presentation uses a warm neutral background, off-white walls and a medium-gray matte floor.
These materials are shared with the summary's 3D view; the 2D palette and domain geometry remain
unchanged. Equipment use zones and furniture functional zones have a light fill and a thin dashed
perimeter. The editor shows zones for selected and flagged entities by default in both 2D and 3D;
**Show all use zones** reveals other zones.
Warnings/errors stay visible when the all-zones layer is off. The legend names use zones, warnings
and errors, and states which layer is visible. Placement previews remain distinct purple outlines,
not a claim that a draft has passed validation. The read-only summary retains all use and furniture
functional zones. These zones are user/agent-provided planning constraints, not regulations.
Outside presentation view, unavailable zones are flat areas with a neutral gray fill, clipped diagonal
hatching and a solid perimeter, distinct from dashed equipment use zones. Selection emphasizes
their perimeter; issue colors remain available. Their legend entry explains the pattern. This
presentation does not change their footprint or blocked-area checks.

The user can orbit the camera, zoom, and inspect the project from different sides. The view helps check:

- equipment height relative to the ceiling,
- the relationship of equipment to windows and wall elements,
- visual crowding of the room,
- passageway availability,
- overall readability and functionality of the layout.

The main interaction rule: **both views edit one room, through one command path and undo history**.

- There is no Edit/Navigate toggle. A short click/tap selects an entity; an empty-space click
  clears selection. Dragging an already-selected entity moves it. Dragging elsewhere, including
  an unselected entity, orbits without changing selection. Ownership is fixed at pointer-down.
  Scroll zoom remains available outside active edits; placement tools temporarily own primary input.
- Click/tap the floor for floor-bound elements or a highlighted visible wall surface for doors/windows
  to create once; Escape/Cancel discards the preview.
  Enter on the scene or Place at centre offers the keyboard creation path.
- Drag equipment/areas on the floor. Doors/windows and mounted equipment retain their wall and
  move along it. A changed release commits once; cancellation, camera movement and previews do not.
- Near-side wall surfaces disappear as the camera moves. A floor-perimeter slab remains on a
  cut-away wall and is omitted while that wall is shown, so the two never share a volume.
  Presentation walls sit outside the room interior so wall-mounted plates stay visible. Wall
  markers and wall-surface placement targets stay independent of that cutaway; floor-perimeter slabs
  are presentation details, not placement targets. Fit view, Top view
  and Focus selected are explicit camera actions and never edit the room. Initial/Fit framing
  centers all eight projected room corners with 6% edge margins, at a near-frontal 12° azimuth and
  29° elevation. Focus selected uses domain-derived physical bounds, including mounting height,
  retains the current orbit direction and leaves more surrounding context. Ordinary edits and
  selection changes do not move the camera; returning from 2D starts with the room fit.
- Exact inspector edits, supported rotations/locks, secondary remove-from-room, removal, lists, validation and file
  actions remain available. An agent revision cancels in-progress manual gestures immediately.
- The toolbar's 2D switch remains available during loading. Whole-scene errors and context loss
  expose Continue in 2D without remounting the project store or WebMCP bridge.

Local automated coverage does not establish physical-device, assistive-technology or public-build
acceptance; verify those environments directly before release.

## Source of truth

Both views are only different representations of the same 2.5D model. Positions, sizes, heights, and use zones are stored as simple geometric data. Layout validation does not depend on 3D graphics and remains deterministic.
