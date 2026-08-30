const PLACEMENT_ID_PREFIX = "placement_";

export function projectItemIdFromPlacementId(placementId: string): string {
  if (!placementId.startsWith(PLACEMENT_ID_PREFIX) || placementId.length === PLACEMENT_ID_PREFIX.length) {
    throw new Error("Cannot derive a project item ID from a non-canonical placement ID.");
  }

  return `project-item_${placementId.slice(PLACEMENT_ID_PREFIX.length)}`;
}
