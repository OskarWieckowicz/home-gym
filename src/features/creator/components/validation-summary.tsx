"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { ValidationIssue } from "@/features/project/validation/validation-issues";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import { describeValidationIssue } from "@/features/project/validation/describe-validation-issue";

import { productForPlacement } from "../placement-product";

import { useProjectStore } from "../store/project-store-context";

function issueList(
  title: string,
  issues: readonly ValidationIssue[],
  names: ReadonlyMap<string, string>,
  severityClass: "creator-issue-error" | "creator-issue-warning",
) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div>
      <h3>{title}</h3>
      <ul aria-live="polite">
        {issues.map((issue) => (
          <li
            className={`creator-issue ${severityClass} creator-issue-${issue.code.toLowerCase()}`}
            key={`${issue.code}-${issue.entityIds.join("-")}`}
          >
            <span aria-hidden="true">!</span> {describeValidationIssue(issue, names)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function ValidationSummary() {
  const [expanded, setExpanded] = useState(true);
  const validation = useProjectStore((state) => state.validation);
  const project = useProjectStore((state) => state.project);
  const names = new Map([
    ...project.obstacles.map((obstacle) => [obstacle.id, obstacle.name] as const),
    ...project.wallElements.map((element) => [element.id, element.name] as const),
    ...project.projectItems.map((item) => [
      item.id,
      findProjectProductById(item.productId)?.name ?? "Unavailable product",
    ] as const),
    ...project.placements.map((placement) => [
      placement.id,
      productForPlacement(project, placement)?.name ?? "Unavailable product",
    ] as const),
  ]);
  const errors = validation.issues.filter((issue) => issue.severity === "error");
  const accessNotEvaluated = validation.issues.find(
    (issue) => issue.code === "ACCESS_NOT_EVALUATED",
  );
  const warnings = validation.issues.filter(
    (issue) => issue.severity === "warning" && issue.code !== "ACCESS_NOT_EVALUATED",
  );
  const layoutIssues = validation.issues.filter(
    (issue) => issue.code !== "ACCESS_NOT_EVALUATED",
  );
  const counts = `${countLabel(validation.errorCount, "error", "errors")}, ${countLabel(validation.warningCount, "warning", "warnings")}`;

  return (
    <section className="creator-validation" aria-labelledby="validation-title">
      <h2 id="validation-title"><button className="creator-validation-toggle" type="button" aria-label="Layout checks"
        aria-expanded={expanded} aria-controls="validation-details" onClick={() => setExpanded((value) => !value)}>
        <span>Layout checks</span><ChevronDown aria-hidden="true" size={16} />
      </button></h2>
      <div className="creator-validation-badges" role="status" aria-live="polite">
        {validation.errorCount > 0 ? <span className="is-error">{countLabel(validation.errorCount, "error", "errors")}</span> : null}
        {warnings.length > 0 ? <span className="is-warning">{countLabel(warnings.length, "warning", "warnings")}</span> : null}
        {accessNotEvaluated ? <span className="is-missing">Door needed for access check</span> : null}
        {validation.issues.length === 0 ? <span className="is-clear">No conflicts</span> : null}
      </div>
      <div id="validation-details" hidden={!expanded}>
      {validation.issues.length === 0 ? (
        <p className="creator-valid"><span aria-hidden="true">✓</span> No layout conflicts found.</p>
      ) : (
        <>
          {layoutIssues.length === 0 && accessNotEvaluated ? (
            <p className="creator-validation-missing-input">
              Access cannot be evaluated until the room has a door. Add a door to check
              that equipment and openings can be reached.
            </p>
          ) : (
            <p className={validation.errorCount === 0 ? "creator-validation-warnings-only" : "creator-validation-counts"}>
              {validation.errorCount === 0
                ? `No errors, ${countLabel(validation.warningCount, "warning", "warnings")}`
                : counts}
            </p>
          )}
          {accessNotEvaluated && layoutIssues.length > 0 ? (
            <p className="creator-validation-missing-input">
              Access cannot be evaluated until the room has a door. Add a door to check
              that equipment and openings can be reached.
            </p>
          ) : null}
          {issueList("Errors", errors, names, "creator-issue-error")}
          {issueList("Warnings", warnings, names, "creator-issue-warning")}
        </>
      )}
      </div>
    </section>
  );
}
