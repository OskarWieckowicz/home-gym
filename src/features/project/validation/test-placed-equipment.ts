import type { Placement, ProjectItem } from "../schemas/project";
import { projectItemIdFromPlacementId } from "../serialization/project-item-ids";

export type TestPlacementInput = {
  readonly id: string;
  readonly productId: string;
  readonly position: Placement["position"];
  readonly rotation: Placement["rotation"];
};

export function toProjectItemsAndPlacements(inputs: readonly TestPlacementInput[]): {
  readonly projectItems: ProjectItem[];
  readonly placements: Placement[];
} {
  return {
    projectItems: inputs.map((input) => ({
      id: projectItemIdFromPlacementId(input.id),
      productId: input.productId,
    })),
    placements: inputs.map((input) => ({
      id: input.id,
      locked: false,
      projectItemId: projectItemIdFromPlacementId(input.id),
      position: input.position,
      rotation: input.rotation,
    })),
  };
}
