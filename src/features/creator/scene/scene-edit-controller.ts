import type { Position } from "@/features/project/schemas/geometry";
import type { ProjectCommand } from "@/features/project/schemas/project-command";
import type { PlacementTarget } from "../plan/placement-target";
import type { ProjectStore } from "../store/project-store";
import { createSceneCreationCommand, type SceneCreation } from "./scene-creation";
import { advanceSceneEditSession, createSceneEditSession, finishSceneEditSession, type SceneEditSession } from "./scene-edit-session";
import { createSceneMoveCommand } from "./scene-move-command";
import { getScenePlacementTarget } from "./scene-targeting";
import { positionToScene } from "./scene-transform";
import type { SceneProjection } from "./scene-editor-types";

export type SceneControllerOptions = SceneCreation & {
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
  readonly onPlacementComplete: (id: string) => void;
  readonly onPlacementError: (message: string) => void;
  readonly onCancelPlacement: () => void;
};
export type SceneEditSnapshot = {
  readonly command: ProjectCommand | null;
  readonly gestureActive: boolean;
  readonly status: string;
};
export type ScenePointerInput = {
  readonly pointerId: number;
  readonly clientX: number;
  readonly clientY: number;
};

/** Renderer-independent controller. Every mutation rechecks the live shared store. */
export class SceneEditController {
  private options: SceneControllerOptions;
  private session: SceneEditSession | null = null;
  private dragStartPoint: Position | null = null;
  private releaseCapture: (() => void) | null = null;
  private readonly pointers = new Set<number>();
  private readonly listeners = new Set<() => void>();
  private snapshot: SceneEditSnapshot = { command: null, gestureActive: false, status: "" };
  private placementRevision: number;

  constructor(private readonly store: ProjectStore, options: SceneControllerOptions) {
    this.options = options;
    this.placementRevision = store.getState().revision;
  }

  getSnapshot = () => this.snapshot;
  hasActivePointer = () => this.session !== null;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  connect = () => this.store.subscribe((state, previous) => {
    if (state.revision === previous.revision) return;
    const active = this.session || this.snapshot.command || this.isPlacing();
    this.cancel(active ? "Project changed; preview cancelled." : "");
    if (this.isPlacing()) this.options.onCancelPlacement();
    // Keep the old token until configure receives a new placement intent. React may
    // not have cleared the active options yet, so a synchronous commit must stay stale.
  });

  configure(options: SceneControllerOptions) {
    const previous = this.options;
    this.options = options;
    const placementChanged = previous.activeTool !== options.activeTool
      || previous.activeProductId !== options.activeProductId || previous.activeProjectItemId !== options.activeProjectItemId;
    if (previous.selectedId !== options.selectedId || placementChanged) {
      this.cancel(this.snapshot.status);
      if (placementChanged) this.placementRevision = this.store.getState().revision;
    }
  }

  private update(patch: Partial<SceneEditSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }

  private isPlacing() {
    return Boolean(this.options.activeTool || this.options.activeProductId || this.options.activeProjectItemId);
  }

  private target(point: Position): PlacementTarget | null {
    const { room } = this.store.getState().project;
    return getScenePlacementTarget(positionToScene(point, room), room,
      this.options.activeTool === "door" || this.options.activeTool === "window" ? "wall" : "floor");
  }

  private creation(point: Position) {
    const target = this.target(point);
    if (!target) return { ok: false as const, error: "Choose a target inside the room or directly on its wall edge." };
    return createSceneCreationCommand(this.options, target, this.store.getState().project);
  }

  cancel(status = "") {
    this.session = null;
    this.dragStartPoint = null;
    const release = this.releaseCapture;
    this.releaseCapture = null;
    release?.();
    this.update({ command: null, gestureActive: false, status });
  }

  cancelPlacement = () => {
    this.cancel("Edit cancelled.");
    this.options.onCancelPlacement();
    this.options.onPlacementError("");
  };

  dispose = () => { this.cancel(); this.pointers.clear(); };

  pointerDown(input: ScenePointerInput, hit: SceneProjection | null, capture: () => (() => void)) {
    const wasEditing = this.snapshot.gestureActive;
    this.pointers.add(input.pointerId);
    if (this.pointers.size > 1) { this.cancel("Additional pointer; edit cancelled."); return wasEditing || this.isPlacing(); }
    if (!hit) return false;
    const editing = this.isPlacing() || Boolean(hit.entityId && hit.entityId === this.options.selectedId);
    this.dragStartPoint = hit.point;
    this.session = createSceneEditSession({ pointerId: input.pointerId, revision: this.store.getState().revision,
      client: { x: input.clientX, y: input.clientY }, point: hit.point ?? { xCm: 0, zCm: 0 }, entityId: this.isPlacing() ? null : hit.entityId });
    // Navigation keeps only a click candidate. Do not steal OrbitControls' native input.
    if (editing) this.releaseCapture = capture();
    this.update({ gestureActive: editing, status: "" });
    return editing;
  }

  pointerMove(input: ScenePointerInput, hit: SceneProjection | null) {
    if (this.pointers.size > 1) return;
    if (this.session) {
      if (this.session.pointerId !== input.pointerId) return;
      this.session = advanceSceneEditSession(this.session, { ...input, client: { x: input.clientX, y: input.clientY },
        point: hit?.point ?? this.session.point, revision: this.store.getState().revision });
      if (!this.session) { this.cancel("Project changed; edit cancelled."); return; }
      if (!this.snapshot.gestureActive) return;
      if (!hit) { this.update({ command: null }); return; }
      if (!hit.point || !this.dragStartPoint) { this.update({ command: null }); return; }
      if (!this.isPlacing() && this.session.dragging && this.session.entityId) {
        const result = createSceneMoveCommand(this.store.getState().project, this.session.entityId, this.session.startPoint, hit.point);
        this.update({ command: result.ok ? result.command : null });
        return;
      }
    }
    if (!hit) { this.update({ command: null }); return; }
    if (this.isPlacing() && hit.point) {
      const result = this.creation(hit.point);
      this.update({ command: result.ok ? result.command : null });
    } else if (!hit.point) this.update({ command: null });
  }

  pointerUp(input: ScenePointerInput, hit: SceneProjection | null, inside: boolean) {
    this.pointers.delete(input.pointerId);
    const session = this.session;
    if (!session || session.pointerId !== input.pointerId) return;
    // Include the release coordinate even if the browser coalesced the final pointermove.
    this.pointerMove(input, hit);
    const current = this.session;
    const canMove = Boolean(this.dragStartPoint && hit?.point);
    const release = current && finishSceneEditSession(current, { ...input, inside: inside && !!hit,
      revision: this.store.getState().revision });
    const editing = this.snapshot.gestureActive;
    this.cancel();
    if (!release) return;
    if (this.isPlacing()) {
      if (release.kind === "click" && hit?.point) this.placePoint(hit.point);
      else if (release.kind === "click") this.options.onPlacementError("Choose a target inside the room or directly on its wall edge.");
      return;
    }
    if (release.kind === "drag" && editing && release.entityId && canMove) {
      const result = createSceneMoveCommand(this.store.getState().project, release.entityId, session.startPoint, release.point);
      this.options.onSelect(release.entityId);
      if (!result.ok) this.options.onPlacementError(result.error);
      else if (result.command) this.commit(result.command, session.revision, false);
    } else if (release.kind === "click") this.options.onSelect(release.entityId);
  }

  pointerCancel(pointerId: number) {
    this.pointers.delete(pointerId);
    if (this.session?.pointerId === pointerId) this.cancel("Edit cancelled.");
  }

  lostCapture(pointerId: number) {
    this.pointers.delete(pointerId);
    if (this.session?.pointerId === pointerId) this.cancel("Pointer capture lost; edit cancelled.");
  }

  placePoint(point: Position) {
    if (!this.isPlacing()) return;
    const result = this.creation(point);
    if (!result.ok) { this.options.onPlacementError(result.error); return; }
    this.commit(result.command, this.placementRevision, true);
  }

  placeCenter = () => {
    const { room } = this.store.getState().project;
    this.placePoint({ xCm: room.widthCm / 2,
      zCm: this.options.activeTool === "door" || this.options.activeTool === "window" ? 0 : room.depthCm / 2 });
  };

  dropProduct(productId: string, point: Position | null) {
    if (!point) return;
    this.cancel();
    const target = getScenePlacementTarget(positionToScene(point, this.store.getState().project.room), this.store.getState().project.room, "floor");
    if (!target) { this.options.onPlacementError("Drop equipment inside the room boundary."); return; }
    const result = createSceneCreationCommand({ activeTool: null, activeProductId: productId, activeProjectItemId: null }, target, this.store.getState().project);
    if (!result.ok) { this.options.onPlacementError(result.error); return; }
    this.commit(result.command, this.store.getState().revision, true);
  }

  private commit(command: ProjectCommand, revision: number, creation: boolean) {
    const state = this.store.getState();
    if (state.revision !== revision) { this.cancel("Project changed; edit cancelled."); return; }
    const result = state.dispatch(command);
    if (!result.ok) { this.options.onPlacementError(result.error.message); return; }
    this.options.onPlacementError("");
    if (creation && result.affectedEntityIds[0]) this.options.onPlacementComplete(result.affectedEntityIds[0]);
    this.update({ status: result.changed ? "Change saved. Undo is available." : "Position unchanged." });
  }
}
