import { describe, expect, it } from "vitest";

import { createProjectAnalysis } from "../validation/project-analysis";
import { CANDIDATE_WARNING_WEIGHTS, scoreCandidate } from "./candidate-scoring";

describe("candidate scoring", () => {
  it("rejects validation errors", () => {
    const score = scoreCandidate(createProjectAnalysis([
      { code: "DOOR_BLOCKED", severity: "error", entityIds: ["wall-element_door"], details: {} },
    ]));
    expect(score).toMatchObject({ rejected: true, reasons: ["DOOR_BLOCKED"] });
  });

  it.each(["door", "placement", "use-zone", "obstacle"] as const)("rejects unreachable %s facts even without errors", (kind) => {
    const analysis = createProjectAnalysis([], {
      evaluated: true, reason: null, facts: [{ entityId: "entity", kind, state: "unreachable" }],
    });
    expect(scoreCandidate(analysis)).toMatchObject({ rejected: true, reasons: ["ACCESS_UNREACHABLE"] });
    expect(analysis.errorCount).toBe(0);
  });

  it("keeps global obstacle warning severity unchanged while rejecting its access fact", () => {
    const issue = { code: "OBSTACLE_UNREACHABLE", severity: "warning", entityIds: ["obstacle_test"], details: {} } as const;
    const analysis = createProjectAnalysis([issue], {
      evaluated: true, reason: null, facts: [{ entityId: "obstacle_test", kind: "obstacle", state: "unreachable" }],
    });
    expect(analysis.valid).toBe(true);
    expect(scoreCandidate(analysis).rejected).toBe(true);
    expect(issue.severity).toBe("warning");
  });

  it("sums documented integer warning weights", () => {
    const analysis = createProjectAnalysis([
      { code: "ACCESS_NOT_EVALUATED", severity: "warning", entityIds: [], details: { reason: "no-door" } },
      { code: "ACCESS_TIGHT", severity: "warning", entityIds: ["placement_a"], details: { kind: "placement" } },
      { code: "ACCESS_TIGHT", severity: "warning", entityIds: ["placement_b"], details: { kind: "placement" } },
    ]);
    expect(scoreCandidate(analysis)).toEqual({
      rejected: false, reasons: [],
      score: CANDIDATE_WARNING_WEIGHTS.ACCESS_NOT_EVALUATED + CANDIDATE_WARNING_WEIGHTS.ACCESS_TIGHT * 2,
      warningCounts: { ACCESS_NOT_EVALUATED: 1, ACCESS_TIGHT: 2 },
    });
  });
});
