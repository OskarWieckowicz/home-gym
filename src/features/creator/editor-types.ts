import type { Position } from "@/features/project/schemas/geometry";

export type EditorPanel = "room" | "selected";

export type PlacementTool = "obstacle" | "unavailable-zone" | "door" | "window";

export type DragDraft = {
  readonly obstacleId: string;
  readonly position: Position;
};
