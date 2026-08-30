import type { ProjectAnalysis } from "../validation/project-analysis";
import type { ValidationIssue } from "../validation/validation-issues";

/** Integer penalties: access quality matters more than overlapping use zones.
 * Unevaluated access is visible and penalized, but does not claim unreachability.
 * Unreachable obstacles are rejected separately, regardless of their severity.
 */
export const CANDIDATE_WARNING_WEIGHTS = {
  ACCESS_NOT_EVALUATED: 1,
  USE_ZONE_OVERLAP: 10,
  ACCESS_TIGHT: 25,
  OBSTACLE_UNREACHABLE: 100,
} as const;

export type CandidateScore = {
  readonly rejected: boolean;
  readonly reasons: readonly string[];
  readonly score: number;
  readonly warningCounts: Readonly<Record<string, number>>;
};

function warningWeight(code: ValidationIssue["code"]): number {
  return code in CANDIDATE_WARNING_WEIGHTS
    ? CANDIDATE_WARNING_WEIGHTS[code as keyof typeof CANDIDATE_WARNING_WEIGHTS]
    : 1;
}

export function scoreCandidate(analysis: ProjectAnalysis): CandidateScore {
  const reasons = new Set<string>();
  const warningCounts: Record<string, number> = {};
  let score = 0;
  for (const issue of analysis.issues) {
    if (issue.severity === "error") reasons.add(issue.code);
    else {
      warningCounts[issue.code] = (warningCounts[issue.code] ?? 0) + 1;
      score += warningWeight(issue.code);
    }
  }
  if (analysis.errorCount > 0 && reasons.size === 0) reasons.add("VALIDATION_ERROR");
  if (analysis.access.facts.some((fact) => fact.state === "unreachable")) {
    reasons.add("ACCESS_UNREACHABLE");
  }
  return { rejected: reasons.size > 0, reasons: [...reasons].sort(), score, warningCounts };
}
