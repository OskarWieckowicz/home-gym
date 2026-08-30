import type { GymProject } from "@/features/project/schemas/project";
import type { Position } from "@/features/project/schemas/geometry";
import type { PlacementTool } from "../editor-types";
import type { PlanIssueRef } from "../plan/entity-issue-state";
import type { ProjectStore } from "../store/project-store";

export type SceneEditorProps = {
  readonly project: GymProject;
  readonly selectedId: string | null;
  readonly issues: readonly PlanIssueRef[];
  readonly store: ProjectStore;
  readonly activeTool: PlacementTool | null;
  readonly activeProductId: string | null;
  readonly activeProjectItemId: string | null;
  readonly placementError: string;
  readonly onSelect: (id: string | null) => void;
  readonly onPlacementComplete: (id: string) => void;
  readonly onPlacementError: (message: string) => void;
  readonly onCancelPlacement: () => void;
  readonly onFallback: () => void;
};

export type ScenePointer = { readonly clientX: number; readonly clientY: number };
export type SceneProjection = {
  readonly point: Position | null;
  readonly entityId: string | null;
};
export type SceneProjectPointer = (pointer: ScenePointer) => SceneProjection | null;
