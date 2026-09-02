import type { ProjectStore } from "@/features/creator/store/project-store";
import type { DispatchResult } from "@/features/project/commands/command-results";
import type { ProjectAnalysis } from "@/features/project/validation/analyze-project";

import {
  addObstacleInputSchema,
  addWallElementInputSchema,
  configureRoomInputSchema,
  getProjectStateInputSchema,
  getProjectSummaryInputSchema,
  mapRoomToolInputIssues,
  removeObstacleInputSchema,
  removeWallElementInputSchema,
  updateObstacleInputSchema,
  updateWallElementInputSchema,
  updateProjectSettingsInputSchema,
  validateLayoutInputSchema,
  type AddObstacleInput,
  type AddWallElementInput,
  type ConfigureRoomInput,
  type RemoveObstacleInput,
  type RemoveWallElementInput,
  type UpdateObstacleInput,
  type UpdateWallElementInput,
  type UpdateProjectSettingsInput,
} from "./room-tool-schemas";
import {
  createRoomToolError,
  serializeObstacle,
  serializeProject,
  serializeProjectSummary,
  serializeRoom,
  serializeSettings,
  serializeMutationBase,
  serializeValidation,
  serializeValidationSummary,
  serializeWallElement,
  type RoomToolName,
} from "./room-tool-results";
import type { WebMcpExecuteOptions } from "./types";

type ToolSchema = {
  safeParse(input: unknown):
    | { readonly success: true; readonly data: unknown }
    | { readonly success: false; readonly error: Parameters<typeof mapRoomToolInputIssues>[0] };
};

const FAILURE_MESSAGES: Readonly<Record<RoomToolName, string>> = {
  get_project_state: "Project state could not be retrieved.",
  get_project_summary: "Project summary could not be retrieved.",
  validate_layout: "Layout validation could not be retrieved.",
  configure_room: "Room configuration could not be applied.",
  update_project_settings: "Project settings could not be updated.",
  add_obstacle: "Obstacle could not be added.",
  update_obstacle: "Obstacle could not be updated.",
  remove_obstacle: "Obstacle could not be removed.",
  add_wall_element: "Wall element could not be added.",
  update_wall_element: "Wall element could not be updated.",
  remove_wall_element: "Wall element could not be removed.",
  place_product: "Product placement could not be added.",
  add_product_to_project: "Product could not be added to the project.",
  place_project_item: "Project item could not be placed.",
  update_placement: "Product placement could not be updated.",
  unplace_product: "Product placement could not be removed from the floor.",
  remove_product: "Project item could not be removed.",
  suggest_placements: "Placement suggestions could not be generated.",
};

function cancelled(tool: RoomToolName) {
  return createRoomToolError(tool, "EXECUTION_FAILED", "Tool execution was cancelled.");
}

function invalidInput(tool: RoomToolName, schema: ToolSchema, input: unknown) {
  const parsed = schema.safeParse(input);
  if (parsed.success) return parsed.data;
  return createRoomToolError(
    tool,
    "INVALID_INPUT",
    "Tool input is invalid.",
    mapRoomToolInputIssues(parsed.error),
  );
}

function unexpected(tool: RoomToolName) {
  return createRoomToolError(tool, "EXECUTION_FAILED", FAILURE_MESSAGES[tool]);
}

function domainFailure(tool: RoomToolName, result: Extract<DispatchResult, { ok: false }>) {
  return createRoomToolError(tool, result.error.code, result.error.message);
}

function mutationBase(
  tool: RoomToolName,
  result: Extract<DispatchResult, { ok: true }>,
  analysis: ProjectAnalysis,
) {
  return {
    ...serializeMutationBase(tool, result),
    validation: serializeValidationSummary(analysis, result.affectedEntityIds),
  };
}

function readInput<T>(
  tool: RoomToolName,
  schema: ToolSchema,
  input: unknown,
  options: WebMcpExecuteOptions | undefined,
): T | ReturnType<typeof createRoomToolError> {
  if (options?.signal?.aborted) return cancelled(tool);
  return invalidInput(tool, schema, input) as T | ReturnType<typeof createRoomToolError>;
}

function isToolError(value: unknown): value is ReturnType<typeof createRoomToolError> {
  return typeof value === "object" && value !== null && "ok" in value && !value.ok;
}

export function createGetProjectStateHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = readInput<Record<string, never>>(
      "get_project_state",
      getProjectStateInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const state = store.getState();
      return {
        ok: true as const,
        tool: "get_project_state" as const,
        revision: state.revision,
        canUndo: state.canUndo,
        canRedo: state.canRedo,
        project: serializeProject(state.project),
      };
    } catch {
      return unexpected("get_project_state");
    }
  };
}

export function createGetProjectSummaryHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = readInput<Record<string, never>>(
      "get_project_summary", getProjectSummaryInputSchema, input, options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const state = store.getState();
      return {
        ok: true as const,
        tool: "get_project_summary" as const,
        revision: state.revision,
        summary: serializeProjectSummary(state.project, state.validation),
      };
    } catch {
      return unexpected("get_project_summary");
    }
  };
}

export function createValidateLayoutHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = readInput<Record<string, never>>(
      "validate_layout",
      validateLayoutInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const state = store.getState();
      return {
        ok: true as const,
        tool: "validate_layout" as const,
        revision: state.revision,
        ...serializeValidation(state.validation),
      };
    } catch {
      return unexpected("validate_layout");
    }
  };
}

function executeMutation(
  store: ProjectStore,
  tool: RoomToolName,
  command: unknown,
) {
  const result = store.getState().dispatch(command);
  const state = store.getState();
  if (!result.ok) return { error: domainFailure(tool, result) } as const;
  return { result, state } as const;
}

export function createConfigureRoomHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = readInput<ConfigureRoomInput>(
      "configure_room",
      configureRoomInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = executeMutation(store, "configure_room", {
        type: "ROOM_CONFIGURED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      return {
        ...mutationBase("configure_room", execution.result, execution.state.validation),
        room: serializeRoom(execution.state.project.room),
      };
    } catch {
      return unexpected("configure_room");
    }
  };
}

export function createUpdateProjectSettingsHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = readInput<UpdateProjectSettingsInput>(
      "update_project_settings",
      updateProjectSettingsInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = executeMutation(store, "update_project_settings", {
        type: "PROJECT_SETTINGS_UPDATED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      return {
        ...mutationBase("update_project_settings", execution.result, execution.state.validation),
        settings: serializeSettings(execution.state.project),
      };
    } catch {
      return unexpected("update_project_settings");
    }
  };
}

export function createAddObstacleHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = readInput<AddObstacleInput>(
      "add_obstacle",
      addObstacleInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = executeMutation(store, "add_obstacle", {
        type: "OBSTACLE_ADDED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      const obstacleId = execution.result.affectedEntityIds[0];
      const obstacle = execution.state.project.obstacles.find(({ id }) => id === obstacleId);
      if (!obstacle) return unexpected("add_obstacle");
      return {
        ...mutationBase("add_obstacle", execution.result, execution.state.validation),
        obstacleId,
        obstacle: serializeObstacle(obstacle),
      };
    } catch {
      return unexpected("add_obstacle");
    }
  };
}

export function createUpdateObstacleHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = readInput<UpdateObstacleInput>(
      "update_obstacle",
      updateObstacleInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = executeMutation(store, "update_obstacle", {
        type: "OBSTACLE_UPDATED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      const obstacle = execution.state.project.obstacles.find(
        ({ id }) => id === parsed.obstacleId,
      );
      if (!obstacle) return unexpected("update_obstacle");
      return {
        ...mutationBase("update_obstacle", execution.result, execution.state.validation),
        obstacleId: obstacle.id,
        obstacle: serializeObstacle(obstacle),
      };
    } catch {
      return unexpected("update_obstacle");
    }
  };
}

export function createRemoveObstacleHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = readInput<RemoveObstacleInput>(
      "remove_obstacle",
      removeObstacleInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = executeMutation(store, "remove_obstacle", {
        type: "OBSTACLE_REMOVED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      if (execution.state.project.obstacles.some(({ id }) => id === parsed.obstacleId)) {
        return unexpected("remove_obstacle");
      }
      return {
        ...mutationBase("remove_obstacle", execution.result, execution.state.validation),
        removedObstacleId: parsed.obstacleId,
      };
    } catch {
      return unexpected("remove_obstacle");
    }
  };
}

export function createAddWallElementHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = readInput<AddWallElementInput>(
      "add_wall_element",
      addWallElementInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = executeMutation(store, "add_wall_element", {
        type: "WALL_ELEMENT_ADDED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      const wallElementId = execution.result.affectedEntityIds[0];
      const wallElement = execution.state.project.wallElements.find(
        ({ id }) => id === wallElementId,
      );
      if (!wallElement) return unexpected("add_wall_element");
      return {
        ...mutationBase("add_wall_element", execution.result, execution.state.validation),
        wallElementId,
        wallElement: serializeWallElement(wallElement),
      };
    } catch {
      return unexpected("add_wall_element");
    }
  };
}

export function createUpdateWallElementHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = readInput<UpdateWallElementInput>(
      "update_wall_element",
      updateWallElementInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = executeMutation(store, "update_wall_element", {
        type: "WALL_ELEMENT_UPDATED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      const wallElement = execution.state.project.wallElements.find(
        ({ id }) => id === parsed.wallElementId,
      );
      if (!wallElement) return unexpected("update_wall_element");
      return {
        ...mutationBase("update_wall_element", execution.result, execution.state.validation),
        wallElementId: wallElement.id,
        wallElement: serializeWallElement(wallElement),
      };
    } catch {
      return unexpected("update_wall_element");
    }
  };
}

export function createRemoveWallElementHandler(store: ProjectStore) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    const parsed = readInput<RemoveWallElementInput>(
      "remove_wall_element",
      removeWallElementInputSchema,
      input,
      options,
    );
    if (isToolError(parsed)) return parsed;

    try {
      const execution = executeMutation(store, "remove_wall_element", {
        type: "WALL_ELEMENT_REMOVED",
        payload: parsed,
      });
      if ("error" in execution) return execution.error;
      if (
        execution.state.project.wallElements.some(
          ({ id }) => id === parsed.wallElementId,
        )
      ) {
        return unexpected("remove_wall_element");
      }
      return {
        ...mutationBase("remove_wall_element", execution.result, execution.state.validation),
        removedWallElementId: parsed.wallElementId,
      };
    } catch {
      return unexpected("remove_wall_element");
    }
  };
}
