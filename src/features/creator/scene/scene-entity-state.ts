import { entityIssueState, type PlanIssueRef } from "../plan/entity-issue-state";

// Mirrors --select, --caution and the error stroke in the 2D plan.
export const SCENE_ENTITY_COLORS = {
  selected: "#f59e0b",
  error: "#dc2626",
  warning: "#d97706",
  fallback: "#64748b",
  useZone: "#3b82f6",
  noEmission: "#000000",
} as const;

export function sceneEntityAppearance(
  id: string,
  selectedId: string | null,
  issues: readonly PlanIssueRef[],
) {
  const issue = entityIssueState(id, issues);
  const color = issue ? SCENE_ENTITY_COLORS[issue] : SCENE_ENTITY_COLORS.fallback;
  return {
    issue,
    color,
    emissive: issue ? color : SCENE_ENTITY_COLORS.noEmission,
    opacity: issue ? 0.38 : 0.22,
    overlayColor: issue ? color : SCENE_ENTITY_COLORS.useZone,
    outline: id === selectedId ? SCENE_ENTITY_COLORS.selected : null,
  };
}

export type SceneEntityAppearance = ReturnType<typeof sceneEntityAppearance>;
