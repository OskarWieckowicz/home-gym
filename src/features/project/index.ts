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
export type { ProjectAccess } from "@/features/geometry/access-facts";
export { createDefaultProject } from "./defaults";
export {
  centimetersSchema,
  dimensionsSchema,
  footprintDimensionsSchema,
  positionSchema,
  positiveCentimetersSchema,
  rotationSchema,
  type Dimensions,
  type FootprintDimensions,
  type Position,
  type Rotation,
} from "./schemas/geometry";
export {
  gymProjectSchema,
  obstacleKindSchema,
  obstacleSchema,
  placementSchema,
  PLACEMENT_ID_PATTERN,
  physicalObstacleSchema,
  PROJECT_ENTITY_ID_PATTERN,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_VERSION,
  projectSettingsSchema,
  roomSchema,
  unavailableZoneSchema,
  WALL_ELEMENT_ID_PATTERN,
  wallElementKindSchema,
  wallElementSchema,
  wallSchema,
  type GymProject,
  type Obstacle,
  type ObstacleKind,
  type Placement,
  type PhysicalObstacle,
  type ProjectSettings,
  type Room,
  type UnavailableZone,
  type Wall,
  type WallElement,
  type WallElementKind,
} from "./schemas/project";
export {
  decodeProject,
  decodeProjectJson,
  serializeProject,
  type ProjectCodecError,
  type ProjectCodecErrorCode,
  type ProjectCodecResult,
  type ProjectSerializationResult,
} from "./serialization/project-codec";
export {
  CURRENT_PROJECT_VERSION,
  migrateProjectToCurrent,
  SUPPORTED_PROJECT_VERSIONS,
  type ProjectMigrationError,
  type ProjectMigrationResult,
} from "./serialization/project-migrations";
export {
  obstacleInputSchema,
  obstaclePatchSchema,
  placementPatchSchema,
  PROJECT_COMMAND_TYPES,
  projectCommandSchema,
  projectSettingsPatchSchema,
  wallElementInputSchema,
  wallElementPatchSchema,
  type ProjectCommand,
  type ProjectCommandType,
} from "./schemas/project-command";
export {
  analyzeProject,
  createProjectAnalysis,
  validateProject,
  type ProjectAnalysis,
} from "./validation/analyze-project";
export type {
  ProductResolver,
  ProductValidationDescriptor,
  ProjectValidationDependencies,
} from "./validation/product-validation";
export type {
  AccessImpact,
  AccessImpactEntry,
  AccessImpactReason,
} from "./validation/access-impact";
export type {
  AccessNotEvaluatedIssue,
  AccessTightIssue,
  BudgetExceededIssue,
  CeilingTooLowIssue,
  CollisionIssue,
  DoorBlockedIssue,
  DoorUnreachableIssue,
  ObstacleUnreachableIssue,
  OutsideWallIssue,
  OutsideRoomAxis,
  OutsideRoomIssue,
  UseZoneOverlapIssue,
  UseZoneOutsideRoomIssue,
  UseZoneUnreachableIssue,
  ValidationIssue,
  ValidationSeverity,
  WallElementOverlapIssue,
  WallMountOffWallIssue,
  WallMountOverlapsOpeningIssue,
} from "./validation/validation-issues";
