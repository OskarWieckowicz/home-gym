"use client";

import { useState } from "react";

import type { ProjectCommandDependencies } from "@/features/project/commands/apply-project-command";
import type { GymProject } from "@/features/project/schemas/project";
import { CreatorWebMcpBridge } from "@/features/webmcp/components/creator-webmcp-bridge";

import type { EditorPanel, PlacementTool } from "../editor-types";
import {
  ProjectPersistenceBoundary,
  type ProjectPersistenceBoundaryProps,
} from "../persistence/project-persistence-boundary";
import { ProjectStoreProvider, useProjectStore } from "../store/project-store-context";
import { CreatorToolbar } from "./creator-toolbar";
import { ElementPanel } from "./element-panel";
import { ObstacleForm } from "./obstacle-form";
import { ProjectSettingsForm } from "./project-settings-form";
import { RoomForm } from "./room-form";
import { RoomPlan } from "./room-plan";
import { ValidationSummary } from "./validation-summary";
import { WallElementForm } from "./wall-element-form";

function EditorWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<EditorPanel>("room");
  const [activeTool, setActiveTool] = useState<PlacementTool | null>(null);
  const [placementError, setPlacementError] = useState("");
  const obstacles = useProjectStore((state) => state.project.obstacles);
  const wallElements = useProjectStore((state) => state.project.wallElements);
  const selectedObstacle = obstacles.find((obstacle) => obstacle.id === selectedId);
  const selectedWallElement = wallElements.find((element) => element.id === selectedId);
  const visibleSelectedId = selectedObstacle || selectedWallElement ? selectedId : null;

  function select(id: string | null) {
    setActiveTool(null);
    setPlacementError("");
    setSelectedId(id);
    if (id) setActivePanel("selected");
  }

  function changePanel(panel: EditorPanel) {
    setActiveTool(null);
    setPlacementError("");
    setSelectedId(null);
    setActivePanel(panel);
  }

  function changeTool(tool: PlacementTool) {
    setSelectedId(null);
    setActivePanel("selected");
    setPlacementError("");
    setActiveTool((current) => current === tool ? null : tool);
  }

  function finishPlacement(id: string) {
    setActiveTool(null);
    setPlacementError("");
    setSelectedId(id);
    setActivePanel("selected");
  }

  return (
    <main className="creator-editor" id="creator-content" tabIndex={-1}>
      <CreatorToolbar />
      <div className="creator-layout">
        <ElementPanel
          activePanel={activePanel}
          activeTool={activeTool}
          onPanelChange={changePanel}
          onSelect={select}
          onToolChange={changeTool}
          selectedId={visibleSelectedId}
        />
        <RoomPlan
          activeTool={activeTool}
          onCancelPlacement={() => setActiveTool(null)}
          onPlacementComplete={finishPlacement}
          onPlacementError={setPlacementError}
          onSelect={select}
          placementError={placementError}
          selectedId={visibleSelectedId}
        />
        <aside className="creator-side creator-properties" aria-label="Properties and validation">
          {activePanel === "room" ? <RoomForm /> : null}
          {activePanel === "settings" ? <ProjectSettingsForm /> : null}
          {activePanel === "selected" && selectedObstacle ? <ObstacleForm obstacle={selectedObstacle} onRemoved={() => select(null)} /> : null}
          {activePanel === "selected" && selectedWallElement ? <WallElementForm element={selectedWallElement} onRemoved={() => select(null)} /> : null}
          {activePanel === "selected" && !selectedObstacle && !selectedWallElement ? (
            <p className="creator-help">
              {activeTool ? "Place the selected element on the plan." : "Select an element on the plan or in the list."}
            </p>
          ) : null}
          <ValidationSummary />
        </aside>
      </div>
    </main>
  );
}

export function CreatorEditor({
  initialProject,
  dependencies,
  persistence,
  storage,
}: {
  readonly initialProject?: GymProject;
  readonly dependencies?: ProjectCommandDependencies;
  readonly persistence?: boolean;
  readonly storage?: ProjectPersistenceBoundaryProps["storage"];
} = {}) {
  const workspace = (
    <>
      <CreatorWebMcpBridge />
      <EditorWorkspace />
    </>
  );
  const persistenceEnabled =
    persistence ?? (storage !== undefined || initialProject === undefined);

  if (persistenceEnabled) {
    return (
      <ProjectPersistenceBoundary
        dependencies={dependencies}
        fallbackProject={initialProject}
        storage={storage}
      >
        {workspace}
      </ProjectPersistenceBoundary>
    );
  }

  return (
    <ProjectStoreProvider dependencies={dependencies} initialProject={initialProject}>
      {workspace}
    </ProjectStoreProvider>
  );
}
