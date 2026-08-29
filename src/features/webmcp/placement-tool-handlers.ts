import type { ProjectStore } from "@/features/creator/store/project-store";
import type { DispatchResult } from "@/features/project/commands/command-results";

import {
  mapRoomToolInputIssues,
  placeProductInputSchema,
  removeProductInputSchema,
  updatePlacementInputSchema,
  type PlaceProductInput,
  type RemoveProductInput,
  type UpdatePlacementInput,
} from "./room-tool-schemas";
import {
  createRoomToolError,
  serializeMutationBase,
  serializePlacement,
  serializeValidation,
  type RoomToolName,
} from "./room-tool-results";
import type { WebMcpExecuteOptions } from "./types";

type PlacementToolName = Extract<
  RoomToolName,
  "place_product" | "update_placement" | "remove_product"
>;

const FAILURE_MESSAGES: Readonly<Record<PlacementToolName, string>> = {
  place_product: "Product placement could not be added.",
  update_placement: "Product placement could not be updated.",
  remove_product: "Product placement could not be removed.",
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
      if (!placement) return failure("place_product");
      return {
        ...mutationBase("place_product", execution.result),
        placementId,
        placement: serializePlacement(placement),
        validation: serializeValidation(execution.state.validation),
      };
    } catch {
      return failure("place_product");
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
        placement: serializePlacement(placement),
        validation: serializeValidation(execution.state.validation),
      };
    } catch {
      return failure("update_placement");
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
      const existing = store
        .getState()
        .project.placements.find(({ id }) => id === parsed.placementId);
      const execution = execute(store, "remove_product", {
        type: "PLACEMENT_REMOVED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      if (
        !existing ||
        execution.state.project.placements.some(({ id }) => id === parsed.placementId)
      ) {
        return failure("remove_product");
      }
      return {
        ...mutationBase("remove_product", execution.result),
        removedPlacementId: existing.id,
        removedProductId: existing.productId,
        validation: serializeValidation(execution.state.validation),
      };
    } catch {
      return failure("remove_product");
    }
  };
}
