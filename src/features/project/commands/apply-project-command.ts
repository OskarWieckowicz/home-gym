import { validateProject } from "../validation/validate-project";
import type { ValidationIssue } from "../validation/validation-issues";
import {
  PROJECT_COMMAND_TYPES,
  projectCommandSchema,
  type ProjectCommand,
  type ProjectCommandType,
} from "../schemas/project-command";
import {
  obstacleSchema,
  wallElementSchema,
  type GymProject,
  type Obstacle,
  type Room,
  type WallElement,
} from "../schemas/project";
import type {
  CommandErrorCode,
  CommandFailure,
  CommandSuccess,
} from "./command-results";

export type ProjectCommandDependencies = {
  readonly generateObstacleId: () => string;
  readonly generateWallElementId?: () => string;
};

export type ProjectCommandExecution =
  | { readonly result: CommandSuccess; readonly project: GymProject }
  | { readonly result: CommandFailure; readonly project: GymProject };

type ObstacleUpdateCommand = Extract<ProjectCommand, { type: "OBSTACLE_UPDATED" }>;
type ObstacleDimensionsPatch = NonNullable<
  ObstacleUpdateCommand["payload"]["patch"]["dimensions"]
>;

const ERROR_MESSAGES: Readonly<Record<CommandErrorCode, string>> = {
  INVALID_COMMAND: "Command input is invalid.",
  ENTITY_NOT_FOUND: "The requested entity does not exist.",
  ENTITY_LOCKED: "The obstacle is locked. Unlock it before making other changes.",
  ID_CONFLICT: "The generated entity ID already exists.",
  EXECUTION_FAILED: "The command could not be executed.",
};

const COMMAND_TYPE_SET = new Set<string>(PROJECT_COMMAND_TYPES);

export const defaultProjectCommandDependencies: ProjectCommandDependencies = {
  generateObstacleId: () => `obstacle_${globalThis.crypto.randomUUID()}`,
  generateWallElementId: () => `wall-element_${globalThis.crypto.randomUUID()}`,
};

function extractCommandType(command: unknown): ProjectCommandType | null {
  if (typeof command !== "object" || command === null || !("type" in command)) {
    return null;
  }

  const type = command.type;
  return typeof type === "string" && COMMAND_TYPE_SET.has(type)
    ? (type as ProjectCommandType)
    : null;
}

function failure(
  project: GymProject,
  code: CommandErrorCode,
  commandType: ProjectCommandType | null,
  message = ERROR_MESSAGES[code],
): ProjectCommandExecution {
  return {
    project,
    result: {
      ok: false,
      commandType,
      error: { code, message },
    },
  };
}

function success(
  previousProject: GymProject,
  project: GymProject,
  commandType: ProjectCommandType,
  affectedEntityIds: readonly string[],
): ProjectCommandExecution {
  const changed = project !== previousProject;
  const issues: ValidationIssue[] = changed
    ? validateProject(project)
    : validateProject(previousProject);

  return {
    project,
    result: {
      ok: true,
      commandType,
      changed,
      affectedEntityIds,
      issues,
    },
  };
}

function roomsEqual(first: Room, second: Room): boolean {
  return (
    first.widthCm === second.widthCm &&
    first.depthCm === second.depthCm &&
    first.heightCm === second.heightCm
  );
}

function arraysEqual(first: readonly string[], second: readonly string[]): boolean {
  return (
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  );
}

function obstaclesEqual(first: Obstacle, second: Obstacle): boolean {
  return (
    first.id === second.id &&
    first.kind === second.kind &&
    first.name === second.name &&
    first.position.xCm === second.position.xCm &&
    first.position.zCm === second.position.zCm &&
    first.dimensions.widthCm === second.dimensions.widthCm &&
    first.dimensions.depthCm === second.dimensions.depthCm &&
    (first.kind === "unavailable-zone" ||
      (second.kind === "obstacle" &&
        first.dimensions.heightCm === second.dimensions.heightCm)) &&
    first.rotation === second.rotation &&
    first.locked === second.locked
  );
}

function wallElementsEqual(first: WallElement, second: WallElement): boolean {
  return (
    first.id === second.id &&
    first.kind === second.kind &&
    first.name === second.name &&
    first.wall === second.wall &&
    first.offsetCm === second.offsetCm &&
    first.widthCm === second.widthCm
  );
}

function applyRoomCommand(
  project: GymProject,
  command: Extract<ProjectCommand, { type: "ROOM_CONFIGURED" }>,
): ProjectCommandExecution {
  const nextProject = roomsEqual(project.room, command.payload)
    ? project
    : { ...project, room: command.payload };
  return success(project, nextProject, command.type, []);
}

function applySettingsCommand(
  project: GymProject,
  command: Extract<ProjectCommand, { type: "PROJECT_SETTINGS_UPDATED" }>,
): ProjectCommandExecution {
  const nextBudget = command.payload.budget ?? project.budget;
  const nextGoals = command.payload.trainingGoals ?? project.trainingGoals;
  const unchanged =
    nextBudget === project.budget && arraysEqual(nextGoals, project.trainingGoals);
  const nextProject = unchanged
    ? project
    : { ...project, budget: nextBudget, trainingGoals: nextGoals };

  return success(project, nextProject, command.type, []);
}

function applyAddCommand(
  project: GymProject,
  command: Extract<ProjectCommand, { type: "OBSTACLE_ADDED" }>,
  dependencies: ProjectCommandDependencies,
): ProjectCommandExecution {
  const id = dependencies.generateObstacleId();
  if (project.obstacles.some((obstacle) => obstacle.id === id)) {
    return failure(project, "ID_CONFLICT", command.type);
  }

  const parsedObstacle = obstacleSchema.safeParse({ id, ...command.payload });
  if (!parsedObstacle.success) {
    return failure(project, "EXECUTION_FAILED", command.type);
  }

  const obstacle = parsedObstacle.data;
  return success(
    project,
    { ...project, obstacles: [...project.obstacles, obstacle] },
    command.type,
    [id],
  );
}

function findObstacle(project: GymProject, obstacleId: string): Obstacle | undefined {
  return project.obstacles.find((obstacle) => obstacle.id === obstacleId);
}

function isUnlockOnlyPatch(patch: Record<string, unknown>): boolean {
  return Object.keys(patch).length === 1 && patch.locked === false;
}

function dimensionsMatchObstacleKind(
  obstacle: Obstacle,
  dimensions: ObstacleDimensionsPatch | undefined,
): boolean {
  if (!dimensions) return true;
  return obstacle.kind === "obstacle"
    ? "heightCm" in dimensions
    : !("heightCm" in dimensions);
}

function applyUpdateCommand(
  project: GymProject,
  command: Extract<ProjectCommand, { type: "OBSTACLE_UPDATED" }>,
): ProjectCommandExecution {
  const current = findObstacle(project, command.payload.obstacleId);
  if (!current) {
    return failure(project, "ENTITY_NOT_FOUND", command.type);
  }
  if (current.locked && !isUnlockOnlyPatch(command.payload.patch)) {
    return failure(project, "ENTITY_LOCKED", command.type);
  }
  if (!dimensionsMatchObstacleKind(current, command.payload.patch.dimensions)) {
    return failure(
      project,
      "INVALID_COMMAND",
      command.type,
      "Obstacle dimensions do not match the target obstacle kind.",
    );
  }

  const parsedObstacle = obstacleSchema.safeParse({
    ...current,
    ...command.payload.patch,
  });
  if (!parsedObstacle.success) {
    return failure(project, "EXECUTION_FAILED", command.type);
  }
  const updated = parsedObstacle.data;
  if (obstaclesEqual(current, updated)) {
    return success(project, project, command.type, [current.id]);
  }

  const obstacles = project.obstacles.map((obstacle) =>
    obstacle.id === current.id ? updated : obstacle,
  );
  return success(project, { ...project, obstacles }, command.type, [current.id]);
}

function applyAddWallElementCommand(
  project: GymProject,
  command: Extract<ProjectCommand, { type: "WALL_ELEMENT_ADDED" }>,
  dependencies: ProjectCommandDependencies,
): ProjectCommandExecution {
  const generateId =
    dependencies.generateWallElementId ??
    defaultProjectCommandDependencies.generateWallElementId;
  const id = generateId?.();
  if (!id) {
    return failure(project, "EXECUTION_FAILED", command.type);
  }
  if (project.wallElements.some((wallElement) => wallElement.id === id)) {
    return failure(project, "ID_CONFLICT", command.type);
  }

  const parsedWallElement = wallElementSchema.safeParse({
    id,
    ...command.payload,
  });
  if (!parsedWallElement.success) {
    return failure(project, "EXECUTION_FAILED", command.type);
  }

  return success(
    project,
    { ...project, wallElements: [...project.wallElements, parsedWallElement.data] },
    command.type,
    [id],
  );
}

function findWallElement(
  project: GymProject,
  wallElementId: string,
): WallElement | undefined {
  return project.wallElements.find(({ id }) => id === wallElementId);
}

function applyUpdateWallElementCommand(
  project: GymProject,
  command: Extract<ProjectCommand, { type: "WALL_ELEMENT_UPDATED" }>,
): ProjectCommandExecution {
  const current = findWallElement(project, command.payload.wallElementId);
  if (!current) {
    return failure(project, "ENTITY_NOT_FOUND", command.type);
  }

  const parsedWallElement = wallElementSchema.safeParse({
    ...current,
    ...command.payload.patch,
  });
  if (!parsedWallElement.success) {
    return failure(project, "EXECUTION_FAILED", command.type);
  }
  const updated = parsedWallElement.data;
  if (wallElementsEqual(current, updated)) {
    return success(project, project, command.type, [current.id]);
  }

  const wallElements = project.wallElements.map((wallElement) =>
    wallElement.id === current.id ? updated : wallElement,
  );
  return success(project, { ...project, wallElements }, command.type, [current.id]);
}

function applyRemoveWallElementCommand(
  project: GymProject,
  command: Extract<ProjectCommand, { type: "WALL_ELEMENT_REMOVED" }>,
): ProjectCommandExecution {
  const current = findWallElement(project, command.payload.wallElementId);
  if (!current) {
    return failure(project, "ENTITY_NOT_FOUND", command.type);
  }

  return success(
    project,
    {
      ...project,
      wallElements: project.wallElements.filter(({ id }) => id !== current.id),
    },
    command.type,
    [current.id],
  );
}

function applyRemoveCommand(
  project: GymProject,
  command: Extract<ProjectCommand, { type: "OBSTACLE_REMOVED" }>,
): ProjectCommandExecution {
  const current = findObstacle(project, command.payload.obstacleId);
  if (!current) {
    return failure(project, "ENTITY_NOT_FOUND", command.type);
  }
  if (current.locked) {
    return failure(project, "ENTITY_LOCKED", command.type);
  }

  return success(
    project,
    {
      ...project,
      obstacles: project.obstacles.filter((obstacle) => obstacle.id !== current.id),
    },
    command.type,
    [current.id],
  );
}

function executeParsedCommand(
  project: GymProject,
  command: ProjectCommand,
  dependencies: ProjectCommandDependencies,
): ProjectCommandExecution {
  switch (command.type) {
    case "ROOM_CONFIGURED":
      return applyRoomCommand(project, command);
    case "PROJECT_SETTINGS_UPDATED":
      return applySettingsCommand(project, command);
    case "OBSTACLE_ADDED":
      return applyAddCommand(project, command, dependencies);
    case "OBSTACLE_UPDATED":
      return applyUpdateCommand(project, command);
    case "OBSTACLE_REMOVED":
      return applyRemoveCommand(project, command);
    case "WALL_ELEMENT_ADDED":
      return applyAddWallElementCommand(project, command, dependencies);
    case "WALL_ELEMENT_UPDATED":
      return applyUpdateWallElementCommand(project, command);
    case "WALL_ELEMENT_REMOVED":
      return applyRemoveWallElementCommand(project, command);
  }
}

export function applyProjectCommand(
  project: GymProject,
  command: unknown,
  dependencies: ProjectCommandDependencies = defaultProjectCommandDependencies,
): ProjectCommandExecution {
  const commandType = extractCommandType(command);

  try {
    const parsedCommand = projectCommandSchema.safeParse(command);
    if (!parsedCommand.success) {
      return failure(project, "INVALID_COMMAND", commandType);
    }

    return executeParsedCommand(project, parsedCommand.data, dependencies);
  } catch {
    return failure(project, "EXECUTION_FAILED", commandType);
  }
}
