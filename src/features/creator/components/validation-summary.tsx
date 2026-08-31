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
      <ul role="list">
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
  // Budget has one dedicated presentation in ProjectCost. Missing access input is
  // not a spatial conflict; all layout badges and lists use this same collection.
  const layoutIssues = validation.issues.filter(
    (issue) => issue.code !== "ACCESS_NOT_EVALUATED" && issue.code !== "BUDGET_EXCEEDED",
  );
  const errors = layoutIssues.filter((issue) => issue.severity === "error");
  const warnings = layoutIssues.filter((issue) => issue.severity === "warning");
  const accessNotEvaluated = validation.issues.some((issue) => issue.code === "ACCESS_NOT_EVALUATED");

  return (
    <section className="creator-validation" aria-labelledby="validation-title">
      <h2 id="validation-title"><button className="creator-validation-toggle" type="button" aria-label="Layout checks"
        aria-expanded={expanded} aria-controls="validation-details" onClick={() => setExpanded((value) => !value)}>
        <span>Layout checks</span><ChevronDown aria-hidden="true" size={16} />
      </button></h2>
      <div role="status" aria-live="polite" aria-atomic="true">
        <div className="creator-validation-badges">
          {errors.length > 0 ? <span className="is-error">{countLabel(errors.length, "error", "errors")}</span> : null}
          {warnings.length > 0 ? <span className="is-warning">{countLabel(warnings.length, "warning", "warnings")}</span> : null}
          {layoutIssues.length === 0 && !accessNotEvaluated ? <span className="is-clear">No layout conflicts found.</span> : null}
        </div>
        {accessNotEvaluated ? <p className="creator-validation-missing-input">Add a door to check access.</p> : null}
      </div>
      <div id="validation-details" hidden={!expanded}>
        {issueList("Errors", errors, names, "creator-issue-error")}
        {issueList("Warnings", warnings, names, "creator-issue-warning")}
      </div>
    </section>
  );
}
