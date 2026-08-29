export type PlanIssueRef = {
  readonly entityIds: readonly string[];
  readonly severity: "error" | "warning";
};

export function entityIssueState(
  id: string,
  issues: readonly PlanIssueRef[],
): "error" | "warning" | null {
  let warned = false;
  for (const issue of issues) {
    if (!issue.entityIds.includes(id)) {
      continue;
    }
    if (issue.severity === "error") {
      return "error";
    }
    warned = true;
  }
  return warned ? "warning" : null;
}

export function entityIssueClassName(
  state: "error" | "warning" | null,
): "is-invalid" | "is-warned" | undefined {
  if (state === "error") {
    return "is-invalid";
  }
  if (state === "warning") {
    return "is-warned";
  }
  return undefined;
}

export function entityIssueAriaSuffix(state: "error" | "warning" | null): string {
  if (state === "error") {
    return ", has layout error";
  }
  if (state === "warning") {
    return ", has layout warning";
  }
  return "";
}
