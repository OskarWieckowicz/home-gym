import type { GymProject, Placement, ProjectItem } from "./schemas/project";

export function findProjectItem(
  project: Pick<GymProject, "projectItems">,
  projectItemId: string,
): ProjectItem | undefined {
  return project.projectItems.find((item) => item.id === projectItemId);
}

export function findPlacementForItem(
  project: Pick<GymProject, "placements">,
  projectItemId: string,
): Placement | undefined {
  return project.placements.find((placement) => placement.projectItemId === projectItemId);
}

export function productIdForPlacement(
  project: Pick<GymProject, "projectItems">,
  placement: Pick<Placement, "projectItemId">,
): string | undefined {
  return findProjectItem(project, placement.projectItemId)?.productId;
}
