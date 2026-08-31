"use client";

import { useId, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";

import { getEffectiveMounting } from "@/features/catalog/queries/catalog";
import { constrainMountedDrag } from "@/features/geometry/wall-mounting";
import type { Obstacle, Placement, WallElement } from "@/features/project/schemas/project";

import { productForPlacement } from "../placement-product";

import type { DragDraft, PlacementTool } from "../editor-types";
import {
  createDragSession,
  dragPositionChanged,
  getDragPosition,
  type DragSession,
} from "../plan/drag-session";
import { getPlacementTarget, type PlacementTarget } from "../plan/placement-target";
import { createRoomElementCommand } from "../plan/create-room-element-command";
import { createPlaceProductCommand, createPlaceProjectItemCommand } from "../plan/place-equipment";
import {
  clientPointToPlanPoint,
  createPlanTransform,
} from "../plan/plan-transform";
import { useProjectStore, useProjectStoreApi } from "../store/project-store-context";
import { EQUIPMENT_DRAG_TYPE } from "./equipment-catalog-panel";
import { EquipmentEntity } from "./equipment-entity";
import { ObstacleEntity, WallElementEntity } from "./room-plan-entities";

const VIEWPORT = { width: 760, height: 560 } as const;

type RoomPlanProps = {
  readonly activeTool: PlacementTool | null;
  readonly activeProductId: string | null;
  readonly activeProjectItemId: string | null;
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

function placementInstruction(
  tool: PlacementTool | null,
  productId: string | null,
  projectItemId: string | null,
): string {
  if (tool === "door" || tool === "window") return "Click a room wall to place it. Press Escape to cancel.";
  if (tool) return "Click inside the room to place it. Press Escape to cancel.";
  if (productId || projectItemId) return "Click inside the room to place the selected equipment. Press Escape to cancel.";
  return "Drag areas and equipment. Positions snap to 10 cm.";
}

export function RoomPlan({
  activeTool,
  activeProductId,
  activeProjectItemId,
  selectedId,
  placementError,
  onSelect,
  onPlacementComplete,
  onPlacementError,
  onCancelPlacement,
}: RoomPlanProps) {
  const store = useProjectStoreApi();
  const project = useProjectStore((state) => state.project);
  const issues = useProjectStore((state) => state.validation.issues);
  const dispatch = useProjectStore((state) => state.dispatch);
  const transform = useMemo(() => createPlanTransform(project.room, VIEWPORT, 48), [project.room]);
  const gridId = useId();
  const [session, setSession] = useState<DragSession | null>(null);
  const [dragEntityKind, setDragEntityKind] = useState<"obstacle" | "placement" | null>(null);
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
    setDragEntityKind("obstacle");
    setSession(createDragSession(obstacle.id, event.pointerId, svgPoint(event), obstacle.position));
    setDragDraft({ obstacleId: obstacle.id, position: obstacle.position });
  }

  function beginPlacementDrag(
    event: PointerEvent<SVGGElement>,
    placement: Placement,
  ) {
    event.stopPropagation();
    onSelect(placement.id);
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragEntityKind("placement");
    setSession(createDragSession(
      placement.id,
      event.pointerId,
      svgPoint(event),
      placement.position,
    ));
    setDragDraft({ obstacleId: placement.id, position: placement.position });
  }

  function mountedPlacementForDrag(placementId: string) {
    const placement = project.placements.find((item) => item.id === placementId);
    if (!placement) return null;
    const product = productForPlacement(project, placement);
    if (!product || getEffectiveMounting(product).kind !== "wall") return null;
    return { placement, product };
  }

  function moveDrag(event: PointerEvent<SVGGElement>) {
    if (!session || session.pointerId !== event.pointerId) return;
    const next = getDragPosition(session, svgPoint(event), transform);
    if (dragEntityKind === "placement") {
      const mounted = mountedPlacementForDrag(session.obstacleId);
      if (mounted) {
        const constrained = constrainMountedDrag(
          next,
          mounted.placement.rotation,
          mounted.product.dimensions,
          project.room,
        );
        if (!constrained) return;
        setDragDraft({ obstacleId: session.obstacleId, position: constrained });
        return;
      }
    }
    setDragDraft({ obstacleId: session.obstacleId, position: next });
  }

  function finishDrag(event: PointerEvent<SVGGElement>) {
    if (!session || session.pointerId !== event.pointerId) return;
    const finalDraft = draftRef.current;
    if (finalDraft && dragPositionChanged(session, finalDraft.position)) {
      const mounted = dragEntityKind === "placement"
        ? mountedPlacementForDrag(session.obstacleId)
        : null;
      if (mounted && !constrainMountedDrag(
        finalDraft.position,
        mounted.placement.rotation,
        mounted.product.dimensions,
        project.room,
      )) {
        onPlacementError("Keep wall-mounted equipment flush to its wall.");
      } else {
        dispatch(dragEntityKind === "placement"
          ? {
              type: "PLACEMENT_UPDATED",
              payload: { placementId: session.obstacleId, patch: { position: finalDraft.position } },
            }
          : {
              type: "OBSTACLE_UPDATED",
              payload: { obstacleId: session.obstacleId, patch: { position: finalDraft.position } },
            });
      }
    }
    setSession(null);
    setDragEntityKind(null);
    setDragDraft(null);
  }

  function cancelDrag() {
    setSession(null);
    setDragEntityKind(null);
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
    const result = createRoomElementCommand(activeTool, target, store.getState().project);
    if (!result.ok) {
      onPlacementError(result.error);
      return;
    }
    finishCommand(dispatch(result.command));
  }

  function placeEquipment(target: PlacementTarget) {
    const currentProject = store.getState().project;
    if (activeProjectItemId) {
      const item = currentProject.projectItems.find((candidate) => candidate.id === activeProjectItemId);
      if (!item) {
        onPlacementError("This project item is unavailable.");
        return;
      }
      const result = createPlaceProjectItemCommand(item.id, item.productId, target, currentProject);
      if (!result.ok) {
        onPlacementError(result.error);
        return;
      }
      finishCommand(dispatch(result.command));
      return;
    }
    if (!activeProductId) return;
    const result = createPlaceProductCommand(activeProductId, target, currentProject);
    if (!result.ok) {
      onPlacementError(result.error);
      return;
    }
    finishCommand(dispatch(result.command));
  }

  function isPlacing() {
    return Boolean(activeTool || activeProductId || activeProjectItemId);
  }

  function handlePlanPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!isPlacing()) {
      onSelect(null);
      return;
    }
    if (event.button !== 0) return;
    const kind = activeTool === "door" || activeTool === "window" ? "wall" : "floor";
    const currentTransform = createPlanTransform(store.getState().project.room, VIEWPORT, 48);
    const target = getPlacementTarget(svgPoint(event), currentTransform, kind);
    if (!target) {
      onPlacementError(kind === "wall"
        ? "Click directly on one of the room walls."
        : "Click inside the room boundary.");
      return;
    }
    if (activeProductId || activeProjectItemId) placeEquipment(target);
    else place(target);
  }

  function handlePlanKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (!isPlacing()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onCancelPlacement();
      onPlacementError("");
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    const { room } = store.getState().project;
    if (activeProductId || activeProjectItemId) {
      placeEquipment({
        kind: "floor",
        position: { xCm: room.widthCm / 2, zCm: room.depthCm / 2 },
      });
    } else if (activeTool === "door" || activeTool === "window") {
      place({ kind: "wall", wall: "top", offsetCm: room.widthCm / 2 });
    } else {
      place({
        kind: "floor",
        position: { xCm: room.widthCm / 2, zCm: room.depthCm / 2 },
      });
    }
  }

  function handleDragOver(event: DragEvent<SVGSVGElement>) {
    if (!event.dataTransfer.types.includes(EQUIPMENT_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(event: DragEvent<SVGSVGElement>) {
    const productId = event.dataTransfer.getData(EQUIPMENT_DRAG_TYPE);
    if (!productId) return;
    event.preventDefault();
    const currentProject = store.getState().project;
    const target = getPlacementTarget(
      clientPointToPlanPoint(
        event,
        VIEWPORT,
        event.currentTarget.getBoundingClientRect(),
      ),
      createPlanTransform(currentProject.room, VIEWPORT, 48),
      "floor",
    );
    if (!target) {
      onPlacementError("Drop equipment inside the room boundary.");
      return;
    }
    const result = createPlaceProductCommand(productId, target, currentProject);
    if (!result.ok) {
      onPlacementError(result.error);
      return;
    }
    finishCommand(dispatch(result.command));
  }

  function selectWallElement(event: PointerEvent<SVGGElement>, element: WallElement) {
    event.stopPropagation();
    onSelect(element.id);
  }

  return (
    <section className="creator-plan-shell" aria-labelledby="plan-title">
      <div className="creator-plan-heading">
        <div>
          <h2 id="plan-title" className="visually-hidden">2D room plan</h2>
          <p className={isPlacing() ? "creator-placement-help" : undefined}>
            {placementInstruction(activeTool, activeProductId, activeProjectItemId)}
          </p>
        </div>
      </div>
      {placementError ? <p className="creator-placement-error" role="alert">{placementError}</p> : null}
      <svg
        aria-label="Top-down editable room plan"
        aria-describedby="plan-help"
        className={`creator-plan${isPlacing() ? " is-placing" : ""}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
        {project.placements.map((placement) => {
          const product = productForPlacement(project, placement);
          if (!product) return null;
          return (
            <EquipmentEntity
              interactive={!isPlacing()}
              issues={issues}
              key={placement.id}
              onBeginDrag={beginPlacementDrag}
              onCancelDrag={cancelDrag}
              onFinishDrag={finishDrag}
              onKeySelect={selectWithKeyboard}
              onMoveDrag={moveDrag}
              placement={placement}
              position={draft?.obstacleId === placement.id ? draft.position : placement.position}
              product={product}
              selectedId={selectedId}
              transform={transform}
            />
          );
        })}
        {project.obstacles.map((obstacle) => (
          <ObstacleEntity
            interactive={!isPlacing()}
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
            interactive={!isPlacing()}
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
        Select an element with Tab and Enter. When a placement tool or product is active, press Enter on the plan to place it or Escape to cancel. Equipment can also be dragged from the catalog onto the plan.
      </p>
    </section>
  );
}
