export {
  applyProjectCommand,
  defaultProjectCommandDependencies,
  type ProjectCommandDependencies,
  type ProjectCommandExecution,
} from "./commands/apply-project-command";
export type {
  CommandErrorCode,
  CommandFailure,
  CommandSuccess,
  DispatchResult,
  ProjectCommandResult,
} from "./commands/command-results";
export { createDefaultProject } from "./defaults";
export {
  centimetersSchema,
  dimensionsSchema,
  positionSchema,
  positiveCentimetersSchema,
  rotationSchema,
  type Dimensions,
  type Position,
  type Rotation,
} from "./schemas/geometry";
export {
  gymProjectSchema,
  obstacleKindSchema,
  obstacleSchema,
  PROJECT_ENTITY_ID_PATTERN,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_VERSION,
  projectSettingsSchema,
  roomSchema,
  type GymProject,
  type Obstacle,
  type ObstacleKind,
  type ProjectSettings,
  type Room,
} from "./schemas/project";
export {
  obstacleInputSchema,
  obstaclePatchSchema,
  PROJECT_COMMAND_TYPES,
  projectCommandSchema,
  projectSettingsPatchSchema,
  type ProjectCommand,
  type ProjectCommandType,
} from "./schemas/project-command";
export { validateProject } from "./validation/validate-project";
export type {
  CollisionIssue,
  OutsideRoomAxis,
  OutsideRoomIssue,
  ValidationIssue,
} from "./validation/validation-issues";
