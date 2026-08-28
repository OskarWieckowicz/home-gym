import type { Position } from "@/features/project/schemas/geometry";

export type EditorPanel = "room" | "settings" | "add" | "selected";

export type DragDraft = {
  readonly obstacleId: string;
  readonly position: Position;
};
