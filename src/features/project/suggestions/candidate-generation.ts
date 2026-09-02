import { EQUIPMENT_LOCKED_MESSAGE } from "../commands/placement-command-handlers";
import { getMountedWall } from "@/features/geometry/wall-mounting";
import { getRotatedFootprintDimensions } from "@/features/geometry/rectangles";
import type { ProjectCommandDependencies } from "../commands/project-command-dependencies";
import type { Position, Rotation } from "../schemas/geometry";
import type { GymProject } from "../schemas/project";
import type { ProjectCommand } from "../schemas/project-command";
import type { ProductValidationDescriptor } from "../validation/product-validation";
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
  return product;
}

type CandidatePose = {
  readonly position: Position;
  readonly rotation: Rotation;
};

type WallCandidateRange = {
  readonly rotation: Rotation;
  readonly startCm: number;
  readonly endCm: number;
  readonly horizontal: boolean;
  readonly fixedCm: number;
};

function gridStart(value: number): number {
  return Math.ceil(value / PLACEMENT_GRID_CM) * PLACEMENT_GRID_CM;
}

function gridEnd(value: number): number {
  return Math.floor(value / PLACEMENT_GRID_CM) * PLACEMENT_GRID_CM;
}

function gridCount(startCm: number, endCm: number): number {
  return endCm < startCm
    ? 0
    : Math.floor((endCm - startCm) / PLACEMENT_GRID_CM) + 1;
}

function productFitsRoom(
  dimensions: { readonly widthCm: number; readonly depthCm: number },
  room: GymProject["room"],
): boolean {
  return dimensions.widthCm <= room.widthCm && dimensions.depthCm <= room.depthCm;
}

function wallAxisValues(
  horizontal: boolean,
  project: GymProject,
  request: PlacementSuggestionRequest,
  dimensions: { readonly widthCm: number; readonly depthCm: number },
) {
  if (horizontal) {
    return {
      fixedSizeCm: dimensions.depthCm,
      fixedMinCm: request.region?.minZCm,
      fixedMaxCm: request.region?.maxZCm,
      roomLengthCm: project.room.widthCm,
      spanCm: dimensions.widthCm,
      regionMinCm: request.region?.minXCm,
      regionMaxCm: request.region?.maxXCm,
    };
  }
  return {
    fixedSizeCm: dimensions.widthCm,
    fixedMinCm: request.region?.minXCm,
    fixedMaxCm: request.region?.maxXCm,
    roomLengthCm: project.room.depthCm,
    spanCm: dimensions.depthCm,
    regionMinCm: request.region?.minZCm,
    regionMaxCm: request.region?.maxZCm,
  };
}

function regionContainsFixedSpan(
  fixedCm: number,
  fixedSizeCm: number,
  fixedMinCm: number | undefined,
  fixedMaxCm: number | undefined,
): boolean {
  if (fixedMinCm !== undefined && fixedCm < fixedMinCm) return false;
  if (fixedMaxCm !== undefined && fixedCm + fixedSizeCm > fixedMaxCm) return false;
  return true;
}

function wallCandidateRange(
  project: GymProject,
  request: PlacementSuggestionRequest,
  product: ProductValidationDescriptor,
  rotation: Rotation,
): WallCandidateRange | null {
  const wall = getMountedWall(rotation);
  const dimensions = getRotatedFootprintDimensions(product.dimensions, rotation);
  if (!productFitsRoom(dimensions, project.room)) return null;

  const horizontal = wall === "top" || wall === "bottom";
  const fixedCoordinates = {
    top: 0,
    right: project.room.widthCm - dimensions.widthCm,
    bottom: project.room.depthCm - dimensions.depthCm,
    left: 0,
  };
  const fixedCm = fixedCoordinates[wall];
  const axis = wallAxisValues(horizontal, project, request, dimensions);
  if (!regionContainsFixedSpan(
    fixedCm,
    axis.fixedSizeCm,
    axis.fixedMinCm,
    axis.fixedMaxCm,
  )) return null;

  const startCm = gridStart(Math.max(0, axis.regionMinCm ?? 0));
  const endCm = gridEnd(Math.min(
    axis.roomLengthCm - axis.spanCm,
    axis.regionMaxCm === undefined
      ? axis.roomLengthCm - axis.spanCm
      : axis.regionMaxCm - axis.spanCm,
  ));
  return gridCount(startCm, endCm) > 0
    ? { rotation, startCm, endCm, horizontal, fixedCm }
    : null;
}

function wallCandidateRanges(
  project: GymProject,
  request: PlacementSuggestionRequest,
  product: ProductValidationDescriptor,
  rotations: readonly Rotation[],
): readonly WallCandidateRange[] {
  return rotations.flatMap((rotation) => {
    const range = wallCandidateRange(project, request, product, rotation);
    return range ? [range] : [];
  });
}

function floorCandidateCount(
  project: GymProject,
  request: PlacementSuggestionRequest,
  rotations: readonly Rotation[],
): number {
  const minX = gridStart(request.region?.minXCm ?? 0);
  const minZ = gridStart(request.region?.minZCm ?? 0);
  const maxX = Math.min(project.room.widthCm, request.region?.maxXCm ?? project.room.widthCm);
  const maxZ = Math.min(project.room.depthCm, request.region?.maxZCm ?? project.room.depthCm);
  return gridCount(minX, maxX) * gridCount(minZ, maxZ) * rotations.length;
}

function generateFloorPoses(
  project: GymProject,
  request: PlacementSuggestionRequest,
  rotations: readonly Rotation[],
): CandidatePose[] {
  const poses: CandidatePose[] = [];
  const minX = gridStart(request.region?.minXCm ?? 0);
  const minZ = gridStart(request.region?.minZCm ?? 0);
  const maxX = Math.min(project.room.widthCm, request.region?.maxXCm ?? project.room.widthCm);
  const maxZ = Math.min(project.room.depthCm, request.region?.maxZCm ?? project.room.depthCm);
  for (let zCm = minZ; zCm <= maxZ; zCm += PLACEMENT_GRID_CM) {
    for (let xCm = minX; xCm <= maxX; xCm += PLACEMENT_GRID_CM) {
      for (const rotation of rotations) poses.push({ position: { xCm, zCm }, rotation });
    }
  }
  return poses;
}

function generateWallPoses(ranges: readonly WallCandidateRange[]): CandidatePose[] {
  const poses: CandidatePose[] = [];
  const seen = new Set<string>();
  for (const range of ranges) {
    for (
      let alongCm = range.startCm;
      alongCm <= range.endCm;
      alongCm += PLACEMENT_GRID_CM
    ) {
      const position = range.horizontal
        ? { xCm: alongCm, zCm: range.fixedCm }
        : { xCm: range.fixedCm, zCm: alongCm };
      const key = `${position.xCm}:${position.zCm}:${range.rotation}`;
      if (seen.has(key)) continue;
      seen.add(key);
      poses.push({ position, rotation: range.rotation });
    }
  }
  return poses;
}

function validateSearchSize(project: GymProject, count: number): void {
  if (count === 0) return;
  const accessCells = Math.ceil(project.room.widthCm / 10) * Math.ceil(project.room.depthCm / 10);
  const hasDoor = project.wallElements.some((element) => element.kind === "door");
  if (count > MAX_PLACEMENT_CANDIDATES || (hasDoor && (
    accessCells > MAX_SUGGESTION_ACCESS_CELLS || accessCells * count > MAX_SUGGESTION_ACCESS_WORK
  ))) throw new PlacementSuggestionError("INVALID_INPUT", "Placement search is too large. Use a smaller region or fewer rotations; rooms with more than 20,000 access cells are unsupported.");
}

export function generatePlacementCandidates(
  project: GymProject,
  input: PlacementSuggestionRequest,
  dependencies: PlacementSuggestionDependencies,
): readonly PlacementCandidate[] {
  const request = placementSuggestionRequestSchema.parse(input);
  const product = validateReference(project, request, dependencies);
  if (request.region && (request.region.minXCm > request.region.maxXCm || request.region.minZCm > request.region.maxZCm)) {
    throw new PlacementSuggestionError("INVALID_INPUT", "Region minimum coordinates must not exceed maximum coordinates.");
  }
  const prefix = safePrefix(project, dependencies.candidateIdPrefix);
  const rotations = ROTATIONS.filter((rotation) => !request.rotations || request.rotations.includes(rotation));
  const ranges = product.mounting?.kind === "wall"
    ? wallCandidateRanges(project, request, product, rotations)
    : [];
  const count = product.mounting?.kind === "wall"
    ? ranges.reduce((total, range) => total + gridCount(range.startCm, range.endCm), 0)
    : floorCandidateCount(project, request, rotations);
  if (count === 0) return [];
  validateSearchSize(project, count);

  const poses = product.mounting?.kind === "wall"
    ? generateWallPoses(ranges)
    : generateFloorPoses(project, request, rotations);
  return poses.map(({ position, rotation }, candidateIndex) => ({
    candidateIndex,
    position,
    rotation,
    command: candidateCommand(project, request, position, rotation),
    projectItemId: `project-item_${prefix}_${candidateIndex + 1}`,
    placementId: `placement_${prefix}_${candidateIndex + 1}`,
  }));
}
