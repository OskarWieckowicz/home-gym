import { applyProjectCommand } from "../commands/apply-project-command";
import { resolveProjectCommandDependencies } from "../commands/project-command-dependencies";
import type { GymProject } from "../schemas/project";
import { createProjectAnalysis } from "../validation/project-analysis";
import type { ValidationIssue } from "../validation/validation-issues";
import {
  generatePlacementCandidates,
  MAX_SUGGESTION_ACCESS_CELLS,
  MAX_SUGGESTION_ACCESS_WORK,
  PlacementSuggestionError,
  type PlacementCandidate,
  type PlacementSuggestionDependencies,
} from "./candidate-generation";
import { scoreCandidate } from "./candidate-scoring";
import {
  placementSuggestionRequestSchema,
  type PlacementSuggestionRequest,
  type PlacementSuggestionStrategy,
} from "./request-schema";
import {
  measureSpatialQuality,
  prepareSpatialQuality,
  type SpatialQualityMetrics,
} from "./spatial-quality";

export type PlacementScoreBreakdown = SpatialQualityMetrics & {
  readonly warningPenalty: number;
};

export type RankedPlacementCandidate = Omit<PlacementCandidate, "projectItemId" | "placementId"> & {
  /** @deprecated Compatibility alias for scoreBreakdown.warningPenalty. */
  readonly score: number;
  readonly scoreBreakdown: PlacementScoreBreakdown;
  readonly warningCounts: Readonly<Record<string, number>>;
  readonly warnings: readonly ValidationIssue[];
};

export type PlacementSuggestions = {
  readonly candidates: readonly RankedPlacementCandidate[];
  readonly generatedCount: number;
  readonly rejectedCount: number;
  readonly strategy: PlacementSuggestionStrategy;
  /** Each count is rejected candidates with that reason, not individual issues. */
  readonly rejectionReasons: Readonly<Record<string, number>>;
};

function candidatePlacementId(candidate: PlacementCandidate): string {
  return candidate.command.type === "PLACEMENT_UPDATED"
    ? candidate.command.payload.placementId
    : candidate.placementId;
}

function compareNumber(first: number, second: number): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function qualityTuple(
  strategy: PlacementSuggestionStrategy,
  score: PlacementScoreBreakdown,
): readonly number[] {
  const furnitureDistance = score.furnitureClearanceDistanceCm ?? 0;
  if (strategy === "perimeter") {
    return [
      score.perimeterDistanceCm,
      score.cornerDistanceCm,
      -furnitureDistance,
      -score.contiguousFreeAreaCells,
      -score.centralFreeAreaCells,
    ];
  }
  if (strategy === "open-center") {
    return [
      -score.centralFreeAreaCells,
      -score.contiguousFreeAreaCells,
      -furnitureDistance,
      score.perimeterDistanceCm,
      score.cornerDistanceCm,
    ];
  }
  return [
    -score.contiguousFreeAreaCells,
    -score.centralFreeAreaCells,
    -furnitureDistance,
    score.perimeterDistanceCm,
    score.cornerDistanceCm,
  ];
}

function comparePlacementCandidates(
  strategy: PlacementSuggestionStrategy,
  first: RankedPlacementCandidate,
  second: RankedPlacementCandidate,
): number {
  const warningComparison = compareNumber(
    first.scoreBreakdown.warningPenalty,
    second.scoreBreakdown.warningPenalty,
  );
  if (warningComparison !== 0) return warningComparison;
  const firstQuality = qualityTuple(strategy, first.scoreBreakdown);
  const secondQuality = qualityTuple(strategy, second.scoreBreakdown);
  for (let index = 0; index < firstQuality.length; index += 1) {
    const comparison = compareNumber(firstQuality[index], secondQuality[index]);
    if (comparison !== 0) return comparison;
  }
  return first.candidateIndex - second.candidateIndex;
}

function validateQualityWork(project: GymProject, candidateCount: number): void {
  if (candidateCount === 0) return;
  const cells = Math.ceil(project.room.widthCm / 10) * Math.ceil(project.room.depthCm / 10);
  if (cells > MAX_SUGGESTION_ACCESS_CELLS || cells * candidateCount > MAX_SUGGESTION_ACCESS_WORK) {
    throw new PlacementSuggestionError(
      "INVALID_INPUT",
      "Placement quality search is too large. Use a smaller room, region, or fewer rotations; quality scoring supports at most 20,000 grid cells and 30 million candidate-cell evaluations.",
    );
  }
}

export function suggestPlacements(
  project: GymProject,
  input: PlacementSuggestionRequest,
  dependencies: PlacementSuggestionDependencies,
): PlacementSuggestions {
  const request = placementSuggestionRequestSchema.parse(input);
  const generated = generatePlacementCandidates(project, request, dependencies);
  if (generated.length === 0) {
    return {
      candidates: [],
      generatedCount: 0,
      rejectedCount: 0,
      strategy: request.strategy,
      rejectionReasons: { NO_GRID_POSITIONS: 1 },
    };
  }
  validateQualityWork(project, generated.length);
  const resolved = resolveProjectCommandDependencies(dependencies);
  const existingPlacementId = "projectItemId" in request
    ? project.placements.find(({ projectItemId }) => projectItemId === request.projectItemId)?.id
    : undefined;
  const spatialPreparation = prepareSpatialQuality(project, resolved, {
    excludedPlacementId: existingPlacementId,
  });
  // Commands analyze the previous state for access-impact. Cache it once per search.
  const baseline = generated.length > 0 ? resolved.analyzeProject(project) : undefined;
  const candidates: RankedPlacementCandidate[] = [];
  const rejectionReasons: Record<string, number> = {};
  let rejectedCount = 0;
  function reject(reasons: readonly string[]) {
    rejectedCount += 1;
    for (const reason of reasons) rejectionReasons[reason] = (rejectionReasons[reason] ?? 0) + 1;
  }
  for (const candidate of generated) {
    const execution = applyProjectCommand(project, candidate.command, {
      ...resolved,
      generateProjectItemId: () => candidate.projectItemId,
      generatePlacementId: () => candidate.placementId,
      analyzeProject: (value) => value === project && baseline ? baseline : resolved.analyzeProject(value),
    });
    if (!execution.result.ok) {
      reject([execution.result.error.code]);
      continue;
    }
    const result = execution.result;
    const analysis = createProjectAnalysis(result.issues, result.access, result.items, result.coverage);
    const scoring = scoreCandidate(analysis);
    if (scoring.rejected) {
      reject(scoring.reasons);
      continue;
    }
    const spatialQuality = measureSpatialQuality(
      spatialPreparation,
      execution.project,
      resolved,
      candidatePlacementId(candidate),
    );
    candidates.push({
      candidateIndex: candidate.candidateIndex,
      position: candidate.position,
      rotation: candidate.rotation,
      command: candidate.command,
      score: scoring.score,
      scoreBreakdown: { warningPenalty: scoring.score, ...spatialQuality },
      warningCounts: scoring.warningCounts,
      warnings: analysis.issues.filter((issue) => issue.severity === "warning"),
    });
  }
  candidates.sort((first, second) => comparePlacementCandidates(request.strategy, first, second));
  return {
    candidates: candidates.slice(0, request.limit),
    generatedCount: generated.length,
    rejectedCount,
    strategy: request.strategy,
    rejectionReasons,
  };
}
