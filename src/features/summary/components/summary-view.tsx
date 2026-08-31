"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CircleCheck, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import { useProjectPersistence } from "@/features/creator/persistence/project-persistence-boundary";
import { useProjectStore } from "@/features/creator/store/project-store-context";
import { useProjectShopping } from "@/features/creator/store/use-project-shopping";
import { buildProjectSummary } from "@/features/project/summary/project-summary";
import { routes } from "@/lib/navigation";
import { SummaryToolbar } from "./summary-toolbar";
import { SummaryEquipment } from "./summary-equipment";
import { SummaryLayoutCard } from "./summary-layout-card";
import { SummaryChecks, SummaryCoverage, SummaryResults } from "./summary-results";

export function SummaryView() {
  const project = useProjectStore((state) => state.project);
  const analysis = useProjectStore((state) => state.validation);
  const persistence = useProjectPersistence();
  const { pending } = useProjectShopping();
  const summary = useMemo(() => buildProjectSummary(project, analysis, findProjectProductById), [project, analysis]);
  return <div className="summary-page">
    <SummaryToolbar />
    <main id="summary-content" tabIndex={-1} className="summary-content">
      <nav aria-label="Breadcrumb" className="summary-breadcrumb"><Link href={routes.creator}>Creator</Link><span aria-hidden="true">/</span><span aria-current="page">Summary</span></nav>
      <div className="summary-heading">
        <div><h1>Project summary</h1><p>Review your equipment, cost, training goals and room layout.</p></div>
        {!summary.empty ? <p role="status" className={`summary-badge ${summary.valid ? "summary-success" : "summary-warning"}`}>{summary.statusLabel}</p> : null}
      </div>
      {summary.empty ? <Card className="summary-empty">
        <ClipboardList size={40} aria-hidden="true" />
        <h2>Your project is waiting for equipment</h2>
        <p>Add equipment in the creator to see your layout, budget and training goals together.</p>
        <LinkButton href={routes.creator}>Open creator</LinkButton>
      </Card> : <div className="summary-grid">
        <div className="summary-column">
          <SummaryLayoutCard project={project} issues={analysis.issues} room={summary.room} />
          <SummaryEquipment summary={summary} pending={pending} />
        </div>
        <div className="summary-column">
          <SummaryResults summary={summary} />
          <SummaryCoverage summary={summary} />
          <SummaryChecks summary={summary} />
        </div>
      </div>}
      <footer className="summary-footer">
        {persistence ? <p role="status">{persistence.status.kind === "saved" ? <CircleCheck size={17} aria-hidden="true" /> : null}{persistence.status.message}</p> : null}
        <p>This project stays in this browser. Export the JSON to keep a copy. Fictional catalog — no checkout.</p>
      </footer>
    </main>
  </div>;
}
