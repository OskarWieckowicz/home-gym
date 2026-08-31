import { EQUIPMENT_LOCKED_MESSAGE } from "../commands/placement-command-handlers";
import type { ProjectCommandDependencies } from "../commands/project-command-dependencies";
import type { Position, Rotation } from "../schemas/geometry";
import type { GymProject } from "../schemas/project";
import type { ProjectCommand } from "../schemas/project-command";
import { placementSuggestionRequestSchema, type PlacementSuggestionRequest } from "./request-schema";

export const PLACEMENT_GRID_CM = 10;
export const MAX_PLACEMENT_CANDIDATES = 20_000;
export const MAX_SUGGESTION_ACCESS_CELLS = 20_000;
export const MAX_SUGGESTION_ACCESS_WORK = 30_000_000;
const ROTATIONS: readonly Rotation[] = [0, 90, 180, 270];

export type PlacementSuggestionDependencies = ProjectCommandDependencies & {
  readonly candidateIdPrefix: string;
};

export type PlacementCandidate = {
  readonly candidateIndex: number;
  readonly position: Position;
  readonly rotation: Rotation;
  readonly command: ProjectCommand;
  readonly projectItemId: string;
  readonly placementId: string;
};

export class PlacementSuggestionError extends Error {
  constructor(readonly code: "ENTITY_NOT_FOUND" | "ENTITY_LOCKED" | "INVALID_COMMAND" | "INVALID_INPUT", message: string) {
    super(message);
    this.name = "PlacementSuggestionError";
  }
}

function candidateCommand(
  project: GymProject,
  request: PlacementSuggestionRequest,
  position: Position,
  rotation: Rotation,
): ProjectCommand {
  if ("productId" in request) {
    return { type: "PRODUCT_PLACED", payload: { productId: request.productId, position, rotation } };
  }
  const existing = project.placements.find((item) => item.projectItemId === request.projectItemId);
  return existing
    ? { type: "PLACEMENT_UPDATED", payload: { placementId: existing.id, patch: { position, rotation } } }
    : { type: "PROJECT_ITEM_PLACED", payload: { projectItemId: request.projectItemId, position, rotation } };
}

function safePrefix(project: GymProject, prefix: string): string {
  if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(prefix)) {
    throw new TypeError("Candidate ID prefix must use lowercase letters, digits, hyphens or underscores.");
  }
  const existingIds = [...project.projectItems, ...project.placements].map(({ id }) => id);
  let attempt = prefix;
  let suffix = 0;
  while (existingIds.some((id) => id.startsWith(`placement_${attempt}_`) || id.startsWith(`project-item_${attempt}_`))) {
    attempt = `${prefix}_${++suffix}`;
  }
  return attempt;
}

function validateReference(project: GymProject, request: PlacementSuggestionRequest, dependencies: PlacementSuggestionDependencies) {
  if ("projectItemId" in request && project.placements.some((placement) =>
    placement.projectItemId === request.projectItemId && placement.locked)) {
    throw new PlacementSuggestionError("ENTITY_LOCKED", EQUIPMENT_LOCKED_MESSAGE);
  }
  const productId = "productId" in request ? request.productId
    : project.projectItems.find((item) => item.id === request.projectItemId)?.productId;
  const product = productId ? dependencies.resolveProduct?.(productId) : undefined;
  if (!product) throw new PlacementSuggestionError("ENTITY_NOT_FOUND", "The requested product or project item does not exist.");
  if ("productId" in request && product.retired) {
    throw new PlacementSuggestionError("INVALID_COMMAND", "This product has been retired from the catalog.");
  }
  if (product.placementMode === "selection-only") {
    throw new PlacementSuggestionError("INVALID_COMMAND", "This product cannot be placed on the floor.");
  }
}

export function generatePlacementCandidates(
  project: GymProject,
  input: PlacementSuggestionRequest,
  dependencies: PlacementSuggestionDependencies,
): readonly PlacementCandidate[] {
  const request = placementSuggestionRequestSchema.parse(input);
  validateReference(project, request, dependencies);
  if (request.region && (request.region.minXCm > request.region.maxXCm || request.region.minZCm > request.region.maxZCm)) {
    throw new PlacementSuggestionError("INVALID_INPUT", "Region minimum coordinates must not exceed maximum coordinates.");
  }
  const prefix = safePrefix(project, dependencies.candidateIdPrefix);
  const rotations = ROTATIONS.filter((rotation) => !request.rotations || request.rotations.includes(rotation));
  const minX = Math.ceil((request.region?.minXCm ?? 0) / PLACEMENT_GRID_CM) * PLACEMENT_GRID_CM;
  const minZ = Math.ceil((request.region?.minZCm ?? 0) / PLACEMENT_GRID_CM) * PLACEMENT_GRID_CM;
  const maxX = Math.min(project.room.widthCm, request.region?.maxXCm ?? project.room.widthCm);
  const maxZ = Math.min(project.room.depthCm, request.region?.maxZCm ?? project.room.depthCm);
  const count = Math.max(0, Math.floor((maxX - minX) / PLACEMENT_GRID_CM) + 1)
    * Math.max(0, Math.floor((maxZ - minZ) / PLACEMENT_GRID_CM) + 1) * rotations.length;
  if (count === 0) return [];
  const accessCells = Math.ceil(project.room.widthCm / 10) * Math.ceil(project.room.depthCm / 10);
  const hasDoor = project.wallElements.some((element) => element.kind === "door");
  if (count > MAX_PLACEMENT_CANDIDATES || (hasDoor && (
    accessCells > MAX_SUGGESTION_ACCESS_CELLS || accessCells * count > MAX_SUGGESTION_ACCESS_WORK
  ))) throw new PlacementSuggestionError("INVALID_INPUT", "Placement search is too large. Use a smaller region or fewer rotations; rooms with more than 20,000 access cells are unsupported.");

  const candidates: PlacementCandidate[] = [];
  for (let zCm = minZ; zCm <= maxZ; zCm += PLACEMENT_GRID_CM) {
    for (let xCm = minX; xCm <= maxX; xCm += PLACEMENT_GRID_CM) {
      for (const rotation of rotations) {
        const position = { xCm, zCm };
        const candidateIndex = candidates.length;
        candidates.push({
          candidateIndex, position, rotation,
          command: candidateCommand(project, request, position, rotation),
          projectItemId: `project-item_${prefix}_${candidateIndex + 1}`,
          placementId: `placement_${prefix}_${candidateIndex + 1}`,
        });
      }
    }
  }
  return candidates;
}
