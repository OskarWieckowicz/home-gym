"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import type { Obstacle } from "@/features/project/schemas/project";

import type { DragDraft } from "../editor-types";
import {
  createDragSession,
  dragPositionChanged,
  getDragPosition,
  type DragSession,
} from "../plan/drag-session";
import { createPlanTransform, obstacleToPlanRectangle } from "../plan/plan-transform";
import { useProjectStore } from "../store/project-store-context";

const VIEWPORT = { width: 760, height: 560 } as const;

type RoomPlanProps = {
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
};

function svgPoint(event: PointerEvent<SVGElement>) {
  const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
    ?? event.currentTarget.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * (VIEWPORT.width / bounds.width),
    y: (event.clientY - bounds.top) * (VIEWPORT.height / bounds.height),
  };
}

function hasIssue(id: string, issues: readonly { readonly entityIds: readonly string[] }[]) {
  return issues.some((issue) => issue.entityIds.includes(id));
}

export function RoomPlan({ selectedId, onSelect }: RoomPlanProps) {
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

  return (
    <section className="creator-plan-shell" aria-labelledby="plan-title">
      <div className="creator-plan-heading">
        <div><h2 id="plan-title">2D room plan</h2><p>Drag unlocked areas. Positions snap to 10 cm.</p></div>
        <span>{project.room.widthCm} × {project.room.depthCm} cm</span>
      </div>
      <svg
        aria-label="Top-down editable room plan"
        aria-describedby="plan-help"
        className="creator-plan"
        onPointerDown={() => onSelect(null)}
        preserveAspectRatio="xMidYMid meet"
        role="group"
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
        {project.obstacles.map((obstacle) => {
          const shown = draft?.obstacleId === obstacle.id ? { ...obstacle, position: draft.position } : obstacle;
          const rectangle = obstacleToPlanRectangle(shown, transform);
          const selected = selectedId === obstacle.id;
          const invalid = hasIssue(obstacle.id, issues);
          return (
            <g
              aria-label={`${obstacle.name}, ${obstacle.kind === "obstacle" ? "physical obstacle" : "unavailable zone"}${obstacle.locked ? ", locked" : ""}${invalid ? ", has layout issue" : ""}`}
              aria-pressed={selected}
              className={["creator-plan-entity", `creator-plan-${obstacle.kind}`, selected && "is-selected", invalid && "is-invalid", obstacle.locked && "is-locked"].filter(Boolean).join(" ")}
              key={obstacle.id}
              onKeyDown={(event) => selectWithKeyboard(event, obstacle.id)}
              onLostPointerCapture={cancelDrag}
              onPointerCancel={cancelDrag}
              onPointerDown={(event) => beginDrag(event, obstacle)}
              onPointerMove={moveDrag}
              onPointerUp={finishDrag}
              role="button"
              tabIndex={0}
            >
              <rect height={rectangle.height} width={rectangle.width} x={rectangle.x} y={rectangle.y} />
              <text x={rectangle.x + 8} y={rectangle.y + 18}>{obstacle.name}</text>
              {obstacle.locked ? <text aria-hidden="true" className="creator-entity-mark" x={rectangle.x + rectangle.width - 18} y={rectangle.y + 18}>L</text> : null}
              {invalid ? <text aria-hidden="true" className="creator-entity-mark" x={rectangle.x + rectangle.width - 18} y={rectangle.y + rectangle.height - 8}>!</text> : null}
            </g>
          );
        })}
      </svg>
      <p className="visually-hidden" id="plan-help">Select an area with Tab and Enter. Use the position fields or move buttons for keyboard editing.</p>
    </section>
  );
}
