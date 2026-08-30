"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProjectSummary } from "@/features/project/summary/project-summary";
import type { SceneContentsProps } from "@/features/creator/scene/scene-contents";
import { SummaryRoomPlan } from "./summary-room-plan";

const SummaryScene = dynamic(() => import("./summary-scene").then((module) => module.SummaryScene), {
  ssr: false,
  loading: () => <p role="status" className="summary-scene-loading">Loading 3D preview…</p>,
});

export function SummaryLayoutCard({ project, issues, room }: Omit<SceneContentsProps, "selectedId"> & {
  readonly room: ProjectSummary["room"];
}) {
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [failed, setFailed] = useState(false);
  const planButton = useRef<HTMLButtonElement>(null);
  const fallback = useCallback(() => {
    setFailed(true);
    setView("2d");
    planButton.current?.focus();
  }, []);
  return <Card className="summary-card summary-layout-card">
    <div className="summary-card-heading">
      <h2>Finished layout</h2>
      <div className="summary-view-toggle" role="group" aria-label="Layout view">
        <Button ref={planButton} variant={view === "2d" ? "primary" : "secondary"}
          aria-pressed={view === "2d"} onClick={() => setView("2d")}>2D</Button>
        <Button variant={view === "3d" ? "primary" : "secondary"} disabled={failed}
          aria-pressed={view === "3d"} onClick={() => setView("3d")}>3D</Button>
      </div>
    </div>
    {failed ? <p role="status" className="summary-note">3D is unavailable. Showing the same layout in 2D.</p> : null}
    {view === "2d" ? <SummaryRoomPlan project={project} issues={issues} />
      : <SummaryScene project={project} issues={issues} onFallback={fallback} />}
    <div className="summary-layout-details">
      <p>{room.dimensionsLabel}<br /><span className="text-ink-muted">{room.areaLabel}</span></p>
      <ul className="summary-legend" aria-label="Plan legend">
        <li><span className="summary-key footprint" />Physical footprint</li>
        <li><span className="summary-key use-zone" />Use zone</li>
        <li><span className="summary-key obstacle" />Obstacle / unavailable zone</li>
      </ul>
    </div>
    <p className="summary-note">Read-only preview. In 3D, drag to orbit and scroll to zoom. Return to the creator to edit.</p>
  </Card>;
}
