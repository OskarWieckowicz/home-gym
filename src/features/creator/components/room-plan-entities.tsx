"use client";

import { Lock } from "lucide-react";
import type { KeyboardEvent, PointerEvent } from "react";

import type { Obstacle, WallElement } from "@/features/project/schemas/project";

import {
  obstacleToPlanRectangle,
  type PlanLine,
  type PlanTransform,
  wallElementToPlanLine,
} from "../plan/plan-transform";

const LABEL_INSET = 8;
const LABEL_HEIGHT = 26;
const LOCK_SIZE = 14;
const LOCK_GAP = 8;
const WALL_LABEL_GAP = 14;

type WallLabelLayout = {
  readonly transform?: string;
  readonly x: number;
  readonly y: number;
};

function wallLabelLayout(element: WallElement, line: PlanLine): WallLabelLayout {
  const wallCenterX = (line.x1 + line.x2) / 2;
  const wallCenterY = (line.y1 + line.y2) / 2;
  const centerX = wallCenterX + (element.wall === "right"
    ? WALL_LABEL_GAP
    : element.wall === "left" ? -WALL_LABEL_GAP : 0);
  const centerY = wallCenterY + (element.wall === "bottom"
    ? WALL_LABEL_GAP
    : element.wall === "top" ? -WALL_LABEL_GAP : 0);
  const rotation = element.wall === "right" ? 90 : element.wall === "left" ? -90 : 0;

  return {
    transform: rotation === 0 ? undefined : `rotate(${rotation} ${centerX} ${centerY})`,
    x: centerX,
    y: centerY,
  };
}

type EntityLayerProps = {
  readonly interactive: boolean;
  readonly selectedId: string | null;
  readonly issues: readonly { readonly entityIds: readonly string[] }[];
  readonly transform: PlanTransform;
};

function hasIssue(
  id: string,
  issues: readonly { readonly entityIds: readonly string[] }[],
) {
  return issues.some((issue) => issue.entityIds.includes(id));
}

export function ObstacleEntity({
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
  const lockSpace = obstacle.locked ? LOCK_SIZE + LOCK_GAP : 0;
  const labelWidth = Math.max(0, rectangle.width - LABEL_INSET * 2 - lockSpace);

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
      <rect className="creator-entity-shape" height={rectangle.height} width={rectangle.width} x={rectangle.x} y={rectangle.y} />
      <foreignObject
        className="creator-entity-label-container"
        height={Math.min(LABEL_HEIGHT, rectangle.height)}
        width={labelWidth}
        x={rectangle.x + LABEL_INSET}
        y={rectangle.y}
      >
        <div className="creator-entity-label" title={obstacle.name}>{obstacle.name}</div>
      </foreignObject>
      {obstacle.locked ? (
        <Lock
          aria-hidden="true"
          className="creator-entity-lock"
          focusable="false"
          height={LOCK_SIZE}
          width={LOCK_SIZE}
          x={rectangle.x + rectangle.width - LABEL_INSET - LOCK_SIZE}
          y={rectangle.y + 6}
        />
      ) : null}
      {invalid ? <text aria-hidden="true" className="creator-entity-mark" x={rectangle.x + rectangle.width - 18} y={rectangle.y + rectangle.height - 8}>!</text> : null}
    </g>
  );
}

export function WallElementEntity({
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
  const label = wallLabelLayout(element, line);
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
      <title>{element.name}</title>
      <line className="creator-plan-wall-hit" x1={line.x1} x2={line.x2} y1={line.y1} y2={line.y2} />
      <line className="creator-plan-wall-visible" x1={line.x1} x2={line.x2} y1={line.y1} y2={line.y2} />
      <text
        aria-hidden="true"
        className="creator-wall-element-label"
        transform={label.transform}
        x={label.x}
        y={label.y}
      >
        {element.name}
      </text>
    </g>
  );
}
