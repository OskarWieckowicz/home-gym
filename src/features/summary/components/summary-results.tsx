import { CircleCheck, CircleAlert, Dumbbell, Scan, ShieldCheck, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { siteLinks } from "@/lib/navigation";
import type { ProjectSummary } from "@/features/project/summary/project-summary";

export function SummaryResults({ summary }: { readonly summary: ProjectSummary }) {
  return <Card className="summary-card">
    <h2>Project result</h2>
    <div className="summary-cost">
      <div><p>Total cost</p><strong>{summary.totals.totalPriceLabel}</strong><p>Budget: {summary.totals.budgetLabel}</p></div>
      <p className={summary.totals.overBudget ? "summary-warning" : "summary-success"}>{summary.totals.balanceLabel}</p>
    </div>
    <progress className="summary-budget" aria-label="Budget used" max={100} value={summary.totals.budgetUsedPercent} />
    <dl className="summary-metrics">
      <div><Dumbbell aria-hidden="true" /><dd>{summary.totals.itemCount}</dd><dt>products</dt></div>
      <div><ShieldCheck aria-hidden="true" /><dd>{summary.physicalCollisionCount}</dd><dt>collisions</dt></div>
      <div><Target aria-hidden="true" /><dd title={summary.coverage.label}>{summary.coverage.countLabel}</dd><dt>goals covered</dt></div>
      <div><Scan aria-hidden="true" /><dd>{summary.floor.freePercentLabel}</dd><dt>free floor</dt></div>
    </dl>
    <p className="summary-note">Free floor excludes footprints, obstacles, unavailable zones and wall intrusions. It does not subtract exercise use zones.</p>
    <LinkButton className="w-full" href={siteLinks.backToEditing.href}>{siteLinks.backToEditing.label}</LinkButton>
  </Card>;
}

export function SummaryCoverage({ summary }: { readonly summary: ProjectSummary }) {
  return <Card className="summary-card">
    <h2>Training goal coverage</h2>
    {summary.coverage.requestedCount === 0 ? <p className="summary-note">No training goals selected. Set your goals in the creator.</p> : null}
    <ul className="summary-checks">{summary.coverage.goals.map((goal) => <li key={goal.id}>
      <StatusIcon passed={goal.covered} /><span>{goal.label}</span>
      <span className={goal.covered ? "summary-success" : "summary-warning"}>{goal.statusLabel}</span>
    </li>)}</ul>
  </Card>;
}

function StatusIcon({ passed }: { readonly passed: boolean }) {
  return passed ? <CircleCheck className="summary-success" size={18} aria-hidden="true" />
    : <CircleAlert className="summary-warning" size={18} aria-hidden="true" />;
}

export function SummaryChecks({ summary }: { readonly summary: ProjectSummary }) {
  return <Card className="summary-card">
    <h2>Layout validation</h2>
    <p className="summary-note">{summary.issueCountLabel}</p>
    <ul className="summary-checks">{summary.checks.map((check) => <li key={check.id}>
      <StatusIcon passed={check.passed} /><span>{check.label}</span><span>{check.statusLabel}</span>
    </li>)}</ul>
    {summary.blockingIssues.map((issue) => <p className="summary-error-note" key={issue.id}>{issue.message}</p>)}
    {summary.recommendations.map((issue) => <p className="summary-recommendation" key={issue.id}>{issue.message}</p>)}
  </Card>;
}
