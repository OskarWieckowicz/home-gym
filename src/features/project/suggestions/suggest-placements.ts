import { applyProjectCommand } from "../commands/apply-project-command";
import { resolveProjectCommandDependencies } from "../commands/project-command-dependencies";
import type { GymProject } from "../schemas/project";
import { createProjectAnalysis } from "../validation/project-analysis";
import type { ValidationIssue } from "../validation/validation-issues";
import {
  generatePlacementCandidates,
  type PlacementCandidate,
  type PlacementSuggestionDependencies,
} from "./candidate-generation";
import { scoreCandidate } from "./candidate-scoring";
import { placementSuggestionRequestSchema, type PlacementSuggestionRequest } from "./request-schema";

export type RankedPlacementCandidate = Omit<PlacementCandidate, "projectItemId" | "placementId"> & {
  readonly score: number;
  readonly warningCounts: Readonly<Record<string, number>>;
  readonly warnings: readonly ValidationIssue[];
};

export type PlacementSuggestions = {
  readonly candidates: readonly RankedPlacementCandidate[];
  readonly generatedCount: number;
  readonly rejectedCount: number;
  /** Each count is rejected candidates with that reason, not individual issues. */
  readonly rejectionReasons: Readonly<Record<string, number>>;
};

export function suggestPlacements(
  project: GymProject,
  input: PlacementSuggestionRequest,
  dependencies: PlacementSuggestionDependencies,
): PlacementSuggestions {
  const request = placementSuggestionRequestSchema.parse(input);
  const generated = generatePlacementCandidates(project, request, dependencies);
  const resolved = resolveProjectCommandDependencies(dependencies);
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
    candidates.push({
      candidateIndex: candidate.candidateIndex,
      position: candidate.position,
      rotation: candidate.rotation,
      command: candidate.command,
      score: scoring.score,
      warningCounts: scoring.warningCounts,
      warnings: analysis.issues.filter((issue) => issue.severity === "warning"),
    });
  }
  if (generated.length === 0) rejectionReasons.NO_GRID_POSITIONS = 1;
  candidates.sort((first, second) => first.score - second.score || first.candidateIndex - second.candidateIndex);
  return {
    candidates: candidates.slice(0, request.limit),
    generatedCount: generated.length,
    rejectedCount,
    rejectionReasons,
  };
}
