import { describe, expect, it } from "vitest";

import {
  entityIssueAriaSuffix,
  entityIssueClassName,
  entityIssueState,
} from "./entity-issue-state";

const issues = [
  { entityIds: ["placement_a"], severity: "warning" as const },
  { entityIds: ["placement_b", "placement_a"], severity: "error" as const },
  { entityIds: ["placement_c"], severity: "warning" as const },
];

describe("entityIssueState", () => {
  it("prefers errors over warnings for the same entity", () => {
    expect(entityIssueState("placement_a", [
      { entityIds: ["placement_a"], severity: "error" as const },
    ])).toBe("error");
    expect(entityIssueState("placement_c", [
      { entityIds: ["placement_c"], severity: "warning" as const },
    ])).toBe("warning");
    expect(entityIssueState("placement_missing", issues)).toBeNull();
  });

  it("maps state to plan classes and accessible labels", () => {
    expect(entityIssueClassName("error")).toBe("is-invalid");
    expect(entityIssueClassName("warning")).toBe("is-warned");
    expect(entityIssueClassName(null)).toBeUndefined();
    expect(entityIssueAriaSuffix("error")).toBe(", has layout error");
    expect(entityIssueAriaSuffix("warning")).toBe(", has layout warning");
    expect(entityIssueAriaSuffix(null)).toBe("");
  });

  it("maps unreachable equipment to invalid and tight or unapproachable ones to warned", () => {
    expect(entityIssueState("placement_bench", [
      { entityIds: ["placement_bench"], severity: "error" },
    ])).toBe("error");
    expect(entityIssueClassName("error")).toBe("is-invalid");
    expect(entityIssueAriaSuffix("error")).toBe(", has layout error");
    expect(entityIssueState("obstacle_column", [
      { entityIds: ["obstacle_column"], severity: "warning" },
    ])).toBe("warning");
    expect(entityIssueClassName("warning")).toBe("is-warned");
    expect(entityIssueAriaSuffix("warning")).toBe(", has layout warning");
  });
});
