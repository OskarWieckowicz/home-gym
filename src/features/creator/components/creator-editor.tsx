"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import type { ProjectCommandDependencies } from "@/features/project/commands/apply-project-command";
import type { GymProject } from "@/features/project/schemas/project";
import { findProductById } from "@/features/catalog/queries/catalog";
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
import { PlacementForm } from "./placement-form";
import { ProjectSettingsForm } from "./project-settings-form";
import { RoomForm } from "./room-form";
import { RoomPlan } from "./room-plan";
import { ValidationSummary } from "./validation-summary";
import { WallElementForm } from "./wall-element-form";

const ScenePreview = dynamic(
  () => import("../scene/scene-preview").then((module) => module.ScenePreview),
  { ssr: false, loading: () => <section className="creator-scene-shell" aria-label="Loading 3D room preview"><p className="creator-help">Loading 3D preview…</p></section> },
);

function EditorWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<EditorPanel>("room");
  const [activeTool, setActiveTool] = useState<PlacementTool | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [placementError, setPlacementError] = useState("");
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const obstacles = useProjectStore((state) => state.project.obstacles);
  const placements = useProjectStore((state) => state.project.placements);
  const wallElements = useProjectStore((state) => state.project.wallElements);
  const project = useProjectStore((state) => state.project);
  const selectedObstacle = obstacles.find((obstacle) => obstacle.id === selectedId);
  const selectedPlacement = placements.find((placement) => placement.id === selectedId);
  const selectedProduct = selectedPlacement
    ? findProductById(selectedPlacement.productId)
    : undefined;
  const selectedWallElement = wallElements.find((element) => element.id === selectedId);
  const visibleSelectedId = selectedObstacle || selectedWallElement || selectedPlacement
    ? selectedId
    : null;

  function select(id: string | null) {
    setActiveTool(null);
    setActiveProductId(null);
    setPlacementError("");
    setSelectedId(id);
    if (id) setActivePanel("selected");
  }

  function changePanel(panel: EditorPanel) {
    setActiveTool(null);
    setActiveProductId(null);
    setPlacementError("");
    setSelectedId(null);
    setActivePanel(panel);
  }

  function changeTool(tool: PlacementTool) {
    setActiveProductId(null);
    setSelectedId(null);
    setActivePanel("selected");
    setPlacementError("");
    setActiveTool((current) => current === tool ? null : tool);
  }

  function changeProduct(productId: string) {
    setActiveTool(null);
    setSelectedId(null);
    setActivePanel("selected");
    setPlacementError("");
    setActiveProductId((current) => current === productId ? null : productId);
  }

  function finishPlacement(id: string) {
    setActiveTool(null);
    setActiveProductId(null);
    setPlacementError("");
    setSelectedId(id);
    setActivePanel("selected");
  }

  return (
    <main className="creator-editor" id="creator-content" tabIndex={-1}>
      <CreatorToolbar viewMode={viewMode} onViewModeChange={setViewMode} />
      <div className="creator-layout">
        <ElementPanel
          activePanel={activePanel}
          activeProductId={activeProductId}
          activeTool={activeTool}
          onPanelChange={changePanel}
          onProductActivate={changeProduct}
          onSelect={select}
          onToolChange={changeTool}
          selectedId={visibleSelectedId}
        />
        {viewMode === "2d" ? <RoomPlan
          activeProductId={activeProductId}
          activeTool={activeTool}
          onCancelPlacement={() => {
            setActiveTool(null);
            setActiveProductId(null);
          }}
          onPlacementComplete={finishPlacement}
          onPlacementError={setPlacementError}
          onSelect={select}
          placementError={placementError}
          selectedId={visibleSelectedId}
        /> : <ScenePreview project={project} />}
        <aside className="creator-side creator-properties" aria-label="Properties and validation">
          {activePanel === "room" ? <RoomForm /> : null}
          {activePanel === "settings" ? <ProjectSettingsForm /> : null}
          {activePanel === "selected" && selectedObstacle ? <ObstacleForm obstacle={selectedObstacle} onRemoved={() => select(null)} /> : null}
          {activePanel === "selected" && selectedWallElement ? <WallElementForm element={selectedWallElement} onRemoved={() => select(null)} /> : null}
          {activePanel === "selected" && selectedPlacement && selectedProduct ? (
            <PlacementForm placement={selectedPlacement} product={selectedProduct} onRemoved={() => select(null)} />
          ) : null}
          {activePanel === "selected" && !selectedObstacle && !selectedWallElement && !selectedPlacement ? (
            <p className="creator-help">
              {activeTool || activeProductId
                ? "Place the selected item on the plan."
                : "Select an element on the plan or in the list."}
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
