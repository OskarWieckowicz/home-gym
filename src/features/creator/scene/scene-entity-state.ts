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
  { showAllUseZones = false, presentationView = false }: {
    readonly showAllUseZones?: boolean; readonly presentationView?: boolean;
  } = {},
) {
  const issue = presentationView ? null : entityIssueState(id, issues);
  const color = issue ? SCENE_ENTITY_COLORS[issue] : SCENE_ENTITY_COLORS.fallback;
  return {
    issue,
    color,
    emissive: issue ? color : SCENE_ENTITY_COLORS.noEmission,
    opacity: issue ? 0.1 : 0.06,
    useZoneVisible: !presentationView && (showAllUseZones || id === selectedId || issue !== null),
    overlayColor: issue ? color : SCENE_ENTITY_COLORS.useZone,
    outline: !presentationView && id === selectedId ? SCENE_ENTITY_COLORS.selected : null,
  };
}

export type SceneEntityAppearance = ReturnType<typeof sceneEntityAppearance>;
