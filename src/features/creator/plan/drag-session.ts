import type { Position } from "@/features/project/schemas/geometry";

import { planDeltaToCentimeters, type PlanTransform } from "./plan-transform";

export type DragSession = {
  readonly obstacleId: string;
  readonly pointerId: number;
  readonly startPointer: { readonly x: number; readonly y: number };
  readonly startPosition: Position;
};

export function createDragSession(
  obstacleId: string,
  pointerId: number,
  pointer: { readonly x: number; readonly y: number },
  position: Position,
): DragSession {
  return { obstacleId, pointerId, startPointer: pointer, startPosition: position };
}

export function getDragPosition(
  session: DragSession,
  pointer: { readonly x: number; readonly y: number },
  transform: Pick<PlanTransform, "scale">,
  snapIncrement = 10,
): Position {
  const delta = planDeltaToCentimeters(
    {
      x: pointer.x - session.startPointer.x,
      y: pointer.y - session.startPointer.y,
    },
    transform,
    snapIncrement,
  );
  return {
    xCm: Math.max(0, session.startPosition.xCm + delta.xCm),
    zCm: Math.max(0, session.startPosition.zCm + delta.zCm),
  };
}

export function dragPositionChanged(session: DragSession, position: Position): boolean {
  return (
    session.startPosition.xCm !== position.xCm ||
    session.startPosition.zCm !== position.zCm
  );
}
