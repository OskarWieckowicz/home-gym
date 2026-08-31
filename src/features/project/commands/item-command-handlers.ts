import {
  placementSchema,
  projectItemSchema,
  type GymProject,
  type Placement,
  type ProjectItem,
} from "../schemas/project";
import type { ProjectCommand } from "../schemas/project-command";
import type { CommandErrorCode } from "./command-results";
import type { ResolvedProjectCommandDependencies } from "./project-command-dependencies";
import { EQUIPMENT_LOCKED_MESSAGE } from "./placement-command-handlers";
import { findPlacementForItem, findProjectItem } from "../project-lookups";

export type ItemCommand = Extract<
  ProjectCommand,
  {
    type:
      | "PROJECT_ITEM_ADDED"
      | "PROJECT_ITEM_REMOVED"
      | "PROJECT_ITEM_PLACED"
      | "PRODUCT_PLACED";
  }
>;

export type ItemMutation =
  | {
      readonly ok: true;
      readonly project: GymProject;
      readonly affectedEntityIds: readonly string[];
    }
  | {
      readonly ok: false;
      readonly code: CommandErrorCode;
      readonly message?: string;
    };

const SELECTION_ONLY_MESSAGE = "This product cannot be placed on the floor.";
const ALREADY_PLACED_MESSAGE = "This project item is already placed.";

function rejectSelectionOnly(
  dependencies: ResolvedProjectCommandDependencies,
  productId: string,
): ItemMutation | undefined {
  const product = dependencies.resolveProduct(productId);
  if (!product) {
    return { ok: false, code: "ENTITY_NOT_FOUND" };
  }
  if (product.placementMode === "selection-only") {
    return { ok: false, code: "INVALID_COMMAND", message: SELECTION_ONLY_MESSAGE };
  }
  return undefined;
}

function parseItem(id: string, productId: string): ProjectItem | undefined {
  const parsed = projectItemSchema.safeParse({ id, productId });
  return parsed.success ? parsed.data : undefined;
}

function parsePlacement(
  id: string,
  projectItemId: string,
  position: Placement["position"],
  rotation: Placement["rotation"],
): Placement | undefined {
  const parsed = placementSchema.safeParse({ id, projectItemId, position, rotation });
  return parsed.success ? parsed.data : undefined;
}

function addItem(
  project: GymProject,
  item: ProjectItem,
): GymProject {
  return { ...project, projectItems: [...project.projectItems, item] };
}

function addPlacement(
  project: GymProject,
  placement: Placement,
): GymProject {
  return { ...project, placements: [...project.placements, placement] };
}

function applyAddItem(
  project: GymProject,
  productId: string,
  dependencies: ResolvedProjectCommandDependencies,
): ItemMutation {
  const product = dependencies.resolveProduct(productId);
  if (!product) {
    return { ok: false, code: "ENTITY_NOT_FOUND" };
  }
  if (product.retired) {
    return { ok: false, code: "INVALID_COMMAND", message: "This product has been retired from the catalog." };
  }
  const id = dependencies.generateProjectItemId();
  if (project.projectItems.some((item) => item.id === id)) {
    return { ok: false, code: "ID_CONFLICT" };
  }
  const item = parseItem(id, productId);
  if (!item) {
    return { ok: false, code: "EXECUTION_FAILED" };
  }
  return { ok: true, project: addItem(project, item), affectedEntityIds: [id] };
}

function applyPlaceExistingItem(
  project: GymProject,
  payload: Extract<ItemCommand, { type: "PROJECT_ITEM_PLACED" }>["payload"],
  dependencies: ResolvedProjectCommandDependencies,
): ItemMutation {
  const item = findProjectItem(project, payload.projectItemId);
  if (!item) {
    return { ok: false, code: "ENTITY_NOT_FOUND" };
  }
  if (findPlacementForItem(project, item.id)) {
    return { ok: false, code: "INVALID_COMMAND", message: ALREADY_PLACED_MESSAGE };
  }
  const rejected = rejectSelectionOnly(dependencies, item.productId);
  if (rejected) return rejected;

  const id = dependencies.generatePlacementId();
  if (project.placements.some((placement) => placement.id === id)) {
    return { ok: false, code: "ID_CONFLICT" };
  }
  const placement = parsePlacement(id, item.id, payload.position, payload.rotation);
  if (!placement) {
    return { ok: false, code: "EXECUTION_FAILED" };
  }
  return {
    ok: true,
    project: addPlacement(project, placement),
    affectedEntityIds: [id, item.id],
  };
}

function applyPlaceProduct(
  project: GymProject,
  payload: Extract<ItemCommand, { type: "PRODUCT_PLACED" }>["payload"],
  dependencies: ResolvedProjectCommandDependencies,
): ItemMutation {
  if (dependencies.resolveProduct(payload.productId)?.retired) {
    return { ok: false, code: "INVALID_COMMAND", message: "This product has been retired from the catalog." };
  }
  const rejected = rejectSelectionOnly(dependencies, payload.productId);
  if (rejected) return rejected;

  const projectItemId = dependencies.generateProjectItemId();
  const placementId = dependencies.generatePlacementId();
  if (
    project.projectItems.some((item) => item.id === projectItemId) ||
    project.placements.some((placement) => placement.id === placementId)
  ) {
    return { ok: false, code: "ID_CONFLICT" };
  }

  const item = parseItem(projectItemId, payload.productId);
  const placement = parsePlacement(
    placementId,
    projectItemId,
    payload.position,
    payload.rotation,
  );
  if (!item || !placement) {
    return { ok: false, code: "EXECUTION_FAILED" };
  }

  return {
    ok: true,
    project: addPlacement(addItem(project, item), placement),
    affectedEntityIds: [placementId, projectItemId],
  };
}

function applyRemoveItem(
  project: GymProject,
  projectItemId: string,
): ItemMutation {
  const item = findProjectItem(project, projectItemId);
  if (!item) {
    return { ok: false, code: "ENTITY_NOT_FOUND" };
  }
  const placement = findPlacementForItem(project, item.id);
  if (placement?.locked) {
    return { ok: false, code: "ENTITY_LOCKED", message: EQUIPMENT_LOCKED_MESSAGE };
  }
  const affectedEntityIds = placement ? [item.id, placement.id] : [item.id];
  return {
    ok: true,
    project: {
      ...project,
      projectItems: project.projectItems.filter(({ id }) => id !== item.id),
      placements: placement
        ? project.placements.filter(({ id }) => id !== placement.id)
        : project.placements,
    },
    affectedEntityIds,
  };
}

export function applyItemCommand(
  project: GymProject,
  command: ItemCommand,
  dependencies: ResolvedProjectCommandDependencies,
): ItemMutation {
  switch (command.type) {
    case "PROJECT_ITEM_ADDED":
      return applyAddItem(project, command.payload.productId, dependencies);
    case "PROJECT_ITEM_REMOVED":
      return applyRemoveItem(project, command.payload.projectItemId);
    case "PROJECT_ITEM_PLACED":
      return applyPlaceExistingItem(project, command.payload, dependencies);
    case "PRODUCT_PLACED":
      return applyPlaceProduct(project, command.payload, dependencies);
  }
}
