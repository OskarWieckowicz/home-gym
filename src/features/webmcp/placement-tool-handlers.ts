import type { ProjectStore } from "@/features/creator/store/project-store";
import type { DispatchResult } from "@/features/project/commands/command-results";
import { findPlacementForItem, findProjectItem } from "@/features/project/project-lookups";

import {
  addProductToProjectInputSchema,
  mapRoomToolInputIssues,
  placeProductInputSchema,
  placeProjectItemInputSchema,
  removeProductInputSchema,
  unplaceProductInputSchema,
  updatePlacementInputSchema,
  type AddProductToProjectInput,
  type PlaceProductInput,
  type PlaceProjectItemInput,
  type RemoveProductInput,
  type UnplaceProductInput,
  type UpdatePlacementInput,
} from "./room-tool-schemas";
import {
  createRoomToolError,
  serializeMutationBase,
  serializePlacement,
  serializeProjectItem,
  serializeValidationSummary,
  type RoomToolName,
} from "./room-tool-results";
import type { WebMcpExecuteOptions } from "./types";

type PlacementToolName = Extract<
  RoomToolName,
  | "place_product"
  | "add_product_to_project"
  | "place_project_item"
  | "update_placement"
  | "unplace_product"
  | "remove_product"
>;

const FAILURE_MESSAGES: Readonly<Record<PlacementToolName, string>> = {
  place_product: "Product placement could not be added.",
  add_product_to_project: "Product could not be added to the project.",
  place_project_item: "Project item could not be placed.",
  update_placement: "Product placement could not be updated.",
  unplace_product: "Product placement could not be removed from the floor.",
  remove_product: "Project item could not be removed.",
};

function parseInput<T>(
  tool: PlacementToolName,
  schema: {
    safeParse(input: unknown):
      | { readonly success: true; readonly data: T }
      | {
          readonly success: false;
          readonly error: Parameters<typeof mapRoomToolInputIssues>[0];
        };
  },
  input: unknown,
  options: WebMcpExecuteOptions | undefined,
) {
  if (options?.signal?.aborted) {
    return createRoomToolError(
      tool,
      "EXECUTION_FAILED",
      "Tool execution was cancelled.",
    );
  }
  const parsed = schema.safeParse(input);
  if (parsed.success) return parsed.data as T;
  return createRoomToolError(
    tool,
    "INVALID_INPUT",
    "Tool input is invalid.",
    mapRoomToolInputIssues(parsed.error),
  );
}

function isToolError(value: unknown): value is ReturnType<typeof createRoomToolError> {
  return typeof value === "object" && value !== null && "ok" in value && !value.ok;
}

function failure(tool: PlacementToolName) {
  return createRoomToolError(tool, "EXECUTION_FAILED", FAILURE_MESSAGES[tool]);
}

function execute(store: ProjectStore, tool: PlacementToolName, command: unknown) {
  const result = store.getState().dispatch(command);
  const state = store.getState();
  if (!result.ok) {
    return {
      error: createRoomToolError(tool, result.error.code, result.error.message),
    } as const;
  }
  return { result, state } as const;
}

function mutationBase(
  tool: PlacementToolName,
  result: Extract<DispatchResult, { ok: true }>,
) {
  return serializeMutationBase(tool, result);
}

export function createPlaceProductHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = parseInput<PlaceProductInput>(
      "place_product",
      placeProductInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = execute(store, "place_product", {
        type: "PRODUCT_PLACED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      const placementId = execution.result.affectedEntityIds[0];
      const placement = execution.state.project.placements.find(
        ({ id }) => id === placementId,
      );
      const item = placement
        ? findProjectItem(execution.state.project, placement.projectItemId)
        : undefined;
      if (!placement || !item) return failure("place_product");
      return {
        ...mutationBase("place_product", execution.result),
        placementId,
        projectItemId: item.id,
        placement: serializePlacement(placement, execution.state.project),
        item: serializeProjectItem(item, execution.state.project),
        validation: serializeValidationSummary(execution.state.validation),
      };
    } catch {
      return failure("place_product");
    }
  };
}

export function createAddProductToProjectHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = parseInput<AddProductToProjectInput>(
      "add_product_to_project",
      addProductToProjectInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = execute(store, "add_product_to_project", {
        type: "PROJECT_ITEM_ADDED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      const projectItemId = execution.result.affectedEntityIds[0];
      const item = findProjectItem(execution.state.project, projectItemId ?? "");
      if (!item) return failure("add_product_to_project");
      return {
        ...mutationBase("add_product_to_project", execution.result),
        projectItemId: item.id,
        item: serializeProjectItem(item, execution.state.project),
        validation: serializeValidationSummary(execution.state.validation),
      };
    } catch {
      return failure("add_product_to_project");
    }
  };
}

export function createPlaceProjectItemHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = parseInput<PlaceProjectItemInput>(
      "place_project_item",
      placeProjectItemInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = execute(store, "place_project_item", {
        type: "PROJECT_ITEM_PLACED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      const placementId = execution.result.affectedEntityIds[0];
      const placement = execution.state.project.placements.find(
        ({ id }) => id === placementId,
      );
      const item = findProjectItem(execution.state.project, parsed.projectItemId);
      if (!placement || !item) return failure("place_project_item");
      return {
        ...mutationBase("place_project_item", execution.result),
        placementId,
        projectItemId: item.id,
        placement: serializePlacement(placement, execution.state.project),
        item: serializeProjectItem(item, execution.state.project),
        validation: serializeValidationSummary(execution.state.validation),
      };
    } catch {
      return failure("place_project_item");
    }
  };
}

export function createUpdatePlacementHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = parseInput<UpdatePlacementInput>(
      "update_placement",
      updatePlacementInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = execute(store, "update_placement", {
        type: "PLACEMENT_UPDATED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      const placement = execution.state.project.placements.find(
        ({ id }) => id === parsed.placementId,
      );
      if (!placement) return failure("update_placement");
      return {
        ...mutationBase("update_placement", execution.result),
        placementId: placement.id,
        placement: serializePlacement(placement, execution.state.project),
        validation: serializeValidationSummary(execution.state.validation),
      };
    } catch {
      return failure("update_placement");
    }
  };
}

export function createUnplaceProductHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = parseInput<UnplaceProductInput>(
      "unplace_product",
      unplaceProductInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const existing = store
        .getState()
        .project.placements.find(({ id }) => id === parsed.placementId);
      const execution = execute(store, "unplace_product", {
        type: "PLACEMENT_REMOVED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      const item = existing
        ? findProjectItem(execution.state.project, existing.projectItemId)
        : undefined;
      if (
        !existing ||
        !item ||
        execution.state.project.placements.some(({ id }) => id === parsed.placementId)
      ) {
        return failure("unplace_product");
      }
      return {
        ...mutationBase("unplace_product", execution.result),
        unplacedPlacementId: existing.id,
        projectItemId: item.id,
        item: serializeProjectItem(item, execution.state.project),
        validation: serializeValidationSummary(execution.state.validation),
      };
    } catch {
      return failure("unplace_product");
    }
  };
}

export function createRemoveProductHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = parseInput<RemoveProductInput>(
      "remove_product",
      removeProductInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const existing = findProjectItem(store.getState().project, parsed.projectItemId);
      const existingPlacement = existing
        ? findPlacementForItem(store.getState().project, existing.id)
        : undefined;
      const execution = execute(store, "remove_product", {
        type: "PROJECT_ITEM_REMOVED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      if (
        !existing ||
        execution.state.project.projectItems.some(({ id }) => id === parsed.projectItemId)
      ) {
        return failure("remove_product");
      }
      return {
        ...mutationBase("remove_product", execution.result),
        removedProjectItemId: existing.id,
        removedProductId: existing.productId,
        removedPlacementId: existingPlacement?.id ?? null,
        cascade: {
          projectItemId: existing.id,
          placementIds: existingPlacement ? [existingPlacement.id] : [],
        },
        validation: serializeValidationSummary(execution.state.validation),
      };
    } catch {
      return failure("remove_product");
    }
  };
}
