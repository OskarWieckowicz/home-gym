"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import type { ProjectCommand } from "@/features/project/schemas/project-command";
import type { GymProject, Obstacle, WallElement } from "@/features/project/schemas/project";

import type { DragDraft, PlacementTool } from "../editor-types";
import {
  createDragSession,
  dragPositionChanged,
  getDragPosition,
  type DragSession,
} from "../plan/drag-session";
import {
  centerFloorRectangle,
  centerWallElement,
  getPlacementTarget,
  type PlacementTarget,
} from "../plan/placement-target";
import {
  clientPointToPlanPoint,
  createPlanTransform,
  obstacleToPlanRectangle,
  type PlanTransform,
  wallElementToPlanLine,
} from "../plan/plan-transform";
import { useProjectStore } from "../store/project-store-context";

const VIEWPORT = { width: 760, height: 560 } as const;
const FLOOR_DEFAULTS = {
  obstacle: { name: "Physical obstacle", dimensions: { widthCm: 100, depthCm: 50, heightCm: 200 } },
  "unavailable-zone": { name: "Unavailable zone", dimensions: { widthCm: 100, depthCm: 100 } },
} as const;
const WALL_DEFAULTS = {
  door: { name: "Door", widthCm: 90 },
  window: { name: "Window", widthCm: 120 },
} as const;

type RoomPlanProps = {
  readonly activeTool: PlacementTool | null;
  readonly selectedId: string | null;
  readonly placementError: string;
  readonly onSelect: (id: string | null) => void;
  readonly onPlacementComplete: (id: string) => void;
  readonly onPlacementError: (message: string) => void;
  readonly onCancelPlacement: () => void;
};

function svgPoint(event: PointerEvent<SVGElement>) {
  const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
    ?? event.currentTarget.getBoundingClientRect();
  return clientPointToPlanPoint(event, VIEWPORT, bounds);
}

function hasIssue(id: string, issues: readonly { readonly entityIds: readonly string[] }[]) {
  return issues.some((issue) => issue.entityIds.includes(id));
}

function placementInstruction(tool: PlacementTool | null): string {
  if (tool === "door" || tool === "window") return "Click a room wall to place it. Press Escape to cancel.";
  if (tool) return "Click inside the room to place it. Press Escape to cancel.";
  return "Drag unlocked areas. Positions snap to 10 cm.";
}

type PlacementCommandResult =
  | { readonly ok: true; readonly command: ProjectCommand }
  | { readonly ok: false; readonly error: string };

function createPlacementCommand(
  tool: PlacementTool,
  target: PlacementTarget,
  project: GymProject,
): PlacementCommandResult {
  if (tool === "obstacle" || tool === "unavailable-zone") {
    if (target.kind !== "floor") return { ok: false, error: "Place this area inside the room." };
    const defaults = FLOOR_DEFAULTS[tool];
    const position = centerFloorRectangle(target.position, defaults.dimensions, project.room);
    if (!position) return { ok: false, error: "The default area does not fit in this room." };
    if (tool === "obstacle") {
      return {
        ok: true,
        command: {
          type: "OBSTACLE_ADDED",
          payload: {
            kind: tool,
            name: defaults.name,
            position,
            dimensions: FLOOR_DEFAULTS.obstacle.dimensions,
            rotation: 0,
            locked: false,
          },
        },
      };
    }
    return {
      ok: true,
      command: {
        type: "OBSTACLE_ADDED",
        payload: {
          kind: tool,
          name: defaults.name,
          position,
          dimensions: FLOOR_DEFAULTS["unavailable-zone"].dimensions,
          rotation: 0,
          locked: false,
        },
      },
    };
  }

  if (target.kind !== "wall") {
    return { ok: false, error: "Place doors and windows on a room wall." };
  }
  const defaults = WALL_DEFAULTS[tool];
  const wallLength = target.wall === "top" || target.wall === "bottom"
    ? project.room.widthCm
    : project.room.depthCm;
  const offsetCm = centerWallElement(target.offsetCm, defaults.widthCm, wallLength);
  if (offsetCm === null) {
    return { ok: false, error: "The default wall element does not fit on this wall." };
  }
  return {
    ok: true,
    command: {
      type: "WALL_ELEMENT_ADDED",
      payload: {
        kind: tool,
        name: defaults.name,
        wall: target.wall,
        offsetCm,
        widthCm: defaults.widthCm,
      },
    },
  };
}

type EntityLayerProps = {
  readonly interactive: boolean;
  readonly selectedId: string | null;
  readonly issues: readonly { readonly entityIds: readonly string[] }[];
  readonly transform: PlanTransform;
};

function ObstacleEntity({
  obstacle,
  interactive,
  position,
  selectedId,
  issues,
  transform,
  onBeginDrag,
  onMoveDrag,
  onFinishDrag,
  onCancelDrag,
  onKeySelect,
}: EntityLayerProps & {
  readonly obstacle: Obstacle;
  readonly position: Obstacle["position"];
  readonly onBeginDrag: (event: PointerEvent<SVGGElement>, obstacle: Obstacle) => void;
  readonly onMoveDrag: (event: PointerEvent<SVGGElement>) => void;
  readonly onFinishDrag: (event: PointerEvent<SVGGElement>) => void;
  readonly onCancelDrag: () => void;
  readonly onKeySelect: (event: KeyboardEvent<SVGGElement>, id: string) => void;
}) {
  const rectangle = obstacleToPlanRectangle({ ...obstacle, position }, transform);
  const selected = selectedId === obstacle.id;
  const invalid = hasIssue(obstacle.id, issues);
  return (
    <g
      aria-label={`${obstacle.name}, ${obstacle.kind === "obstacle" ? "physical obstacle" : "unavailable zone"}${obstacle.locked ? ", locked" : ""}${invalid ? ", has layout issue" : ""}`}
      aria-pressed={selected}
      className={["creator-plan-entity", `creator-plan-${obstacle.kind}`, selected && "is-selected", invalid && "is-invalid", obstacle.locked && "is-locked", !interactive && "is-placement-disabled"].filter(Boolean).join(" ")}
      onKeyDown={(event) => onKeySelect(event, obstacle.id)}
      onLostPointerCapture={onCancelDrag}
      onPointerCancel={onCancelDrag}
      onPointerDown={(event) => onBeginDrag(event, obstacle)}
      onPointerMove={onMoveDrag}
      onPointerUp={onFinishDrag}
      role="button"
      tabIndex={interactive ? 0 : -1}
    >
      <rect height={rectangle.height} width={rectangle.width} x={rectangle.x} y={rectangle.y} />
      <text x={rectangle.x + 8} y={rectangle.y + 18}>{obstacle.name}</text>
      {obstacle.locked ? <text aria-hidden="true" className="creator-entity-mark" x={rectangle.x + rectangle.width - 18} y={rectangle.y + 18}>L</text> : null}
      {invalid ? <text aria-hidden="true" className="creator-entity-mark" x={rectangle.x + rectangle.width - 18} y={rectangle.y + rectangle.height - 8}>!</text> : null}
    </g>
  );
}

function WallElementEntity({
  element,
  interactive,
  selectedId,
  issues,
  transform,
  onSelect,
  onKeySelect,
}: EntityLayerProps & {
  readonly element: WallElement;
  readonly onSelect: (event: PointerEvent<SVGGElement>, element: WallElement) => void;
  readonly onKeySelect: (event: KeyboardEvent<SVGGElement>, id: string) => void;
}) {
  const line = wallElementToPlanLine(element, transform);
  const selected = selectedId === element.id;
  const invalid = hasIssue(element.id, issues);
  return (
    <g
      aria-label={`${element.name}, ${element.kind}, ${element.wall} wall${invalid ? ", has layout issue" : ""}`}
      aria-pressed={selected}
      className={["creator-plan-wall-element", `creator-plan-${element.kind}`, selected && "is-selected", invalid && "is-invalid", !interactive && "is-placement-disabled"].filter(Boolean).join(" ")}
      onKeyDown={(event) => onKeySelect(event, element.id)}
      onPointerDown={(event) => onSelect(event, element)}
      role="button"
      tabIndex={interactive ? 0 : -1}
    >
      <line className="creator-plan-wall-hit" x1={line.x1} x2={line.x2} y1={line.y1} y2={line.y2} />
      <line className="creator-plan-wall-visible" x1={line.x1} x2={line.x2} y1={line.y1} y2={line.y2} />
      <text x={line.labelX} y={line.labelY}>{element.name}</text>
    </g>
  );
}

export function RoomPlan({
  activeTool,
  selectedId,
  placementError,
  onSelect,
  onPlacementComplete,
  onPlacementError,
  onCancelPlacement,
}: RoomPlanProps) {
  const project = useProjectStore((state) => state.project);
  const issues = useProjectStore((state) => state.validation);
  const dispatch = useProjectStore((state) => state.dispatch);
  const transform = useMemo(() => createPlanTransform(project.room, VIEWPORT, 48), [project.room]);
  const gridId = useId();
  const [session, setSession] = useState<DragSession | null>(null);
  const [draft, setDraft] = useState<DragDraft | null>(null);
  const draftRef = useRef<DragDraft | null>(null);

  function setDragDraft(value: DragDraft | null) {
    draftRef.current = value;
    setDraft(value);
  }

  function beginDrag(event: PointerEvent<SVGGElement>, obstacle: Obstacle) {
    event.stopPropagation();
    onSelect(obstacle.id);
    if (obstacle.locked || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSession(createDragSession(obstacle.id, event.pointerId, svgPoint(event), obstacle.position));
    setDragDraft({ obstacleId: obstacle.id, position: obstacle.position });
  }

  function moveDrag(event: PointerEvent<SVGGElement>) {
    if (!session || session.pointerId !== event.pointerId) return;
    setDragDraft({ obstacleId: session.obstacleId, position: getDragPosition(session, svgPoint(event), transform) });
  }

  function finishDrag(event: PointerEvent<SVGGElement>) {
    if (!session || session.pointerId !== event.pointerId) return;
    const finalDraft = draftRef.current;
    if (finalDraft && dragPositionChanged(session, finalDraft.position)) {
      dispatch({
        type: "OBSTACLE_UPDATED",
        payload: { obstacleId: session.obstacleId, patch: { position: finalDraft.position } },
      });
    }
    setSession(null);
    setDragDraft(null);
  }

  function cancelDrag() {
    setSession(null);
    setDragDraft(null);
  }

  function selectWithKeyboard(event: KeyboardEvent<SVGGElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(id);
    }
  }

  function finishCommand(result: ReturnType<typeof dispatch>) {
    if (!result.ok) {
      onPlacementError(result.error.message);
      return;
    }
    const id = result.affectedEntityIds[0];
    if (id) onPlacementComplete(id);
  }

  function place(target: PlacementTarget) {
    if (!activeTool) return;
    const result = createPlacementCommand(activeTool, target, project);
    if (!result.ok) {
      onPlacementError(result.error);
      return;
    }
    finishCommand(dispatch(result.command));
  }

  function handlePlanPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!activeTool) {
      onSelect(null);
      return;
    }
    if (event.button !== 0) return;
    const kind = activeTool === "door" || activeTool === "window" ? "wall" : "floor";
    const target = getPlacementTarget(svgPoint(event), transform, kind);
    if (!target) {
      onPlacementError(kind === "wall"
        ? "Click directly on one of the room walls."
        : "Click inside the room boundary.");
      return;
    }
    place(target);
  }

  function handlePlanKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (!activeTool) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onCancelPlacement();
      onPlacementError("");
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (activeTool === "door" || activeTool === "window") {
      place({ kind: "wall", wall: "top", offsetCm: project.room.widthCm / 2 });
    } else {
      place({
        kind: "floor",
        position: { xCm: project.room.widthCm / 2, zCm: project.room.depthCm / 2 },
      });
    }
  }

  function selectWallElement(event: PointerEvent<SVGGElement>, element: WallElement) {
    event.stopPropagation();
    onSelect(element.id);
  }

  return (
    <section className="creator-plan-shell" aria-labelledby="plan-title">
      <div className="creator-plan-heading">
        <div>
          <h2 id="plan-title">2D room plan</h2>
          <p className={activeTool ? "creator-placement-help" : undefined}>{placementInstruction(activeTool)}</p>
        </div>
        <span>{project.room.widthCm} × {project.room.depthCm} cm</span>
      </div>
      {placementError ? <p className="creator-placement-error" role="alert">{placementError}</p> : null}
      <svg
        aria-label="Top-down editable room plan"
        aria-describedby="plan-help"
        className={`creator-plan${activeTool ? " is-placing" : ""}`}
        onKeyDown={handlePlanKeyDown}
        onPointerDown={handlePlanPointerDown}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        tabIndex={0}
        viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
      >
        <defs>
          <pattern id={gridId} height={50 * transform.scale} patternUnits="userSpaceOnUse" width={50 * transform.scale} x={transform.offsetX} y={transform.offsetY}>
            <rect className="creator-grid-background" height="100%" width="100%" />
            <path className="creator-grid-line" d={`M ${50 * transform.scale} 0 L 0 0 0 ${50 * transform.scale}`} fill="none" />
          </pattern>
        </defs>
        <rect className="creator-room-shadow" height={transform.roomHeight} width={transform.roomWidth} x={transform.offsetX} y={transform.offsetY} />
        <rect className="creator-room" fill={`url(#${gridId})`} height={transform.roomHeight} width={transform.roomWidth} x={transform.offsetX} y={transform.offsetY} />
        {project.obstacles.map((obstacle) => (
          <ObstacleEntity
            interactive={!activeTool}
            issues={issues}
            key={obstacle.id}
            obstacle={obstacle}
            onBeginDrag={beginDrag}
            onCancelDrag={cancelDrag}
            onFinishDrag={finishDrag}
            onKeySelect={selectWithKeyboard}
            onMoveDrag={moveDrag}
            position={draft?.obstacleId === obstacle.id ? draft.position : obstacle.position}
            selectedId={selectedId}
            transform={transform}
          />
        ))}
        {project.wallElements.map((element) => (
          <WallElementEntity
            element={element}
            interactive={!activeTool}
            issues={issues}
            key={element.id}
            onKeySelect={selectWithKeyboard}
            onSelect={selectWallElement}
            selectedId={selectedId}
            transform={transform}
          />
        ))}
      </svg>
      <p className="visually-hidden" id="plan-help">
        Select an element with Tab and Enter. When a placement tool is active, press Enter on the plan to place a default element or Escape to cancel.
      </p>
    </section>
  );
}
