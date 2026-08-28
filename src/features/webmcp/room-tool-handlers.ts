import type { ProjectStore } from "@/features/creator/store/project-store";
import type { DispatchResult } from "@/features/project/commands/command-results";

import {
  addObstacleInputSchema,
  configureRoomInputSchema,
  getProjectStateInputSchema,
  mapRoomToolInputIssues,
  removeObstacleInputSchema,
  updateObstacleInputSchema,
  updateProjectSettingsInputSchema,
  validateLayoutInputSchema,
  type AddObstacleInput,
  type ConfigureRoomInput,
  type RemoveObstacleInput,
  type UpdateObstacleInput,
  type UpdateProjectSettingsInput,
} from "./room-tool-schemas";
import {
  createRoomToolError,
  serializeObstacle,
  serializeProject,
  serializeRoom,
  serializeSettings,
  serializeValidation,
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
  validate_layout: "Layout validation could not be retrieved.",
  configure_room: "Room configuration could not be applied.",
  update_project_settings: "Project settings could not be updated.",
  add_obstacle: "Obstacle could not be added.",
  update_obstacle: "Obstacle could not be updated.",
  remove_obstacle: "Obstacle could not be removed.",
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

function mutationBase(tool: RoomToolName, result: Extract<DispatchResult, { ok: true }>) {
  return {
    ok: true as const,
    tool,
    changed: result.changed,
    revision: result.revision,
    affectedEntityIds: [...result.affectedEntityIds],
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
        validation: serializeValidation(state.validation),
      };
    } catch {
      return unexpected("get_project_state");
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
        ...mutationBase("configure_room", execution.result),
        room: serializeRoom(execution.state.project.room),
        validation: serializeValidation(execution.state.validation),
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
        ...mutationBase("update_project_settings", execution.result),
        settings: serializeSettings(execution.state.project),
        validation: serializeValidation(execution.state.validation),
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
        ...mutationBase("add_obstacle", execution.result),
        obstacleId,
        obstacle: serializeObstacle(obstacle),
        validation: serializeValidation(execution.state.validation),
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
        ...mutationBase("update_obstacle", execution.result),
        obstacleId: obstacle.id,
        obstacle: serializeObstacle(obstacle),
        validation: serializeValidation(execution.state.validation),
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
        ...mutationBase("remove_obstacle", execution.result),
        removedObstacleId: parsed.obstacleId,
        validation: serializeValidation(execution.state.validation),
      };
    } catch {
      return unexpected("remove_obstacle");
    }
  };
}
