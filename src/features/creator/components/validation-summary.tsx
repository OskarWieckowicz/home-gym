"use client";

import type { ValidationIssue } from "@/features/project/validation/validation-issues";
import { findProductById } from "@/features/catalog/queries/catalog";
import { formatPricePln } from "@/features/catalog/components/catalog-formatters";

import { useProjectStore } from "../store/project-store-context";

export function describeValidationIssue(
  issue: ValidationIssue,
  names: ReadonlyMap<string, string>,
): string {
  const label = (id: string) => names.get(id) ?? id;
  if (issue.code === "OUTSIDE_ROOM") {
    return `${label(issue.entityIds[0])} is outside the room on ${issue.details.axes.join(", ")}.`;
  }
  if (issue.code === "CLEARANCE_OUTSIDE_ROOM") {
    return `${label(issue.entityIds[0])}'s required clearance leaves the room on ${issue.details.axes.join(", ")}.`;
  }
  if (issue.code === "OUTSIDE_WALL") {
    return `${label(issue.entityIds[0])} does not fit on the ${issue.details.wall} wall.`;
  }
  if (issue.code === "CEILING_TOO_LOW") {
    return `${label(issue.entityIds[0])} needs ${issue.details.requiredHeightCm} cm of ceiling height; the room has ${issue.details.roomHeightCm} cm.`;
  }
  if (issue.code === "BUDGET_EXCEEDED") {
    return `Placed equipment costs ${formatPricePln(issue.details.totalPrice)}, exceeding the ${formatPricePln(issue.details.budget)} budget by ${formatPricePln(issue.details.excess)}.`;
  }
  const pair = `${label(issue.entityIds[0])} and ${label(issue.entityIds[1])}`;
  if (issue.code === "WALL_ELEMENT_OVERLAP") {
    return `${pair} overlap on the ${issue.details.wall} wall.`;
  }
  if (issue.code === "CLEARANCE_CONFLICT") {
    return `${pair} conflict with required equipment clearance.`;
  }
  return issue.code === "PHYSICAL_COLLISION"
    ? `${pair} physically overlap.`
    : `${pair} conflict with an unavailable zone.`;
}

export function ValidationSummary() {
  const validation = useProjectStore((state) => state.validation);
  const obstacles = useProjectStore((state) => state.project.obstacles);
  const wallElements = useProjectStore((state) => state.project.wallElements);
  const placements = useProjectStore((state) => state.project.placements);
  const names = new Map([
    ...obstacles.map((obstacle) => [obstacle.id, obstacle.name] as const),
    ...wallElements.map((element) => [element.id, element.name] as const),
    ...placements.map((placement) => [
      placement.id,
      findProductById(placement.productId)?.name ?? "Unavailable product",
    ] as const),
  ]);

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
