"use client";

import { ProjectPersistenceBoundary } from "@/features/creator/persistence/project-persistence-boundary";
import { SummaryWebMcpBridge } from "@/features/webmcp/components/summary-webmcp-bridge";
import { SummaryView } from "./summary-view";

export function SummaryEntry() {
  return <ProjectPersistenceBoundary>
    <SummaryWebMcpBridge />
    <SummaryView />
  </ProjectPersistenceBoundary>;
}
