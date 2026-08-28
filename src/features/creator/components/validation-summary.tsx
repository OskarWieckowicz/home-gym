"use client";

import type { ValidationIssue } from "@/features/project/validation/validation-issues";

import { useProjectStore } from "../store/project-store-context";

export function describeValidationIssue(
  issue: ValidationIssue,
  names: ReadonlyMap<string, string>,
): string {
  const label = (id: string) => names.get(id) ?? id;
  if (issue.code === "OUTSIDE_ROOM") {
    return `${label(issue.entityIds[0])} is outside the room on ${issue.details.axes.join(", ")}.`;
  }
  const pair = `${label(issue.entityIds[0])} and ${label(issue.entityIds[1])}`;
  return issue.code === "PHYSICAL_COLLISION"
    ? `${pair} physically overlap.`
    : `${pair} conflict with an unavailable zone.`;
}

export function ValidationSummary() {
  const validation = useProjectStore((state) => state.validation);
  const obstacles = useProjectStore((state) => state.project.obstacles);
  const names = new Map(obstacles.map((obstacle) => [obstacle.id, obstacle.name]));

  return (
    <section className="creator-validation" aria-labelledby="validation-title">
      <h2 id="validation-title">Layout checks</h2>
      {validation.length === 0 ? (
        <p className="creator-valid"><span aria-hidden="true">✓</span> No layout conflicts found.</p>
      ) : (
        <ul aria-live="polite">
          {validation.map((issue) => (
            <li className={`creator-issue creator-issue-${issue.code.toLowerCase()}`} key={`${issue.code}-${issue.entityIds.join("-")}`}>
              <span aria-hidden="true">!</span> {describeValidationIssue(issue, names)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
