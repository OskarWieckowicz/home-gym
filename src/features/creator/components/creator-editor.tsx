"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import { findProjectProductById } from "@/features/catalog/queries/project-products";
import type { ProjectCommandDependencies } from "@/features/project/commands/apply-project-command";
import type { GymProject } from "@/features/project/schemas/project";
import { CreatorWebMcpBridge } from "@/features/webmcp/components/creator-webmcp-bridge";
import type { CreatorStartMode } from "@/lib/navigation";

import type { EditorPanel, PlacementTool } from "../editor-types";
import {
  ProjectPersistenceBoundary,
  type ProjectPersistenceBoundaryProps,
} from "../persistence/project-persistence-boundary";
import { productForPlacement } from "../placement-product";
import { ProjectStoreProvider, useProjectStore, useProjectStoreApi } from "../store/project-store-context";
import { CreatorToolbar } from "./creator-toolbar";
import { CreatorViewportToolbar } from "./creator-viewport-toolbar";
import type { SceneCameraPreset } from "../scene/scene-camera-controls";
import { sceneSelectionBox } from "../scene/scene-selection-box";
import { ElementPanel } from "./element-panel";
import { ObstacleForm } from "./obstacle-form";
import { PlacementForm } from "./placement-form";
import { ProjectItemForm } from "./project-item-form";
import { ProjectSettingsDialog, type SettingsDialogRequest } from "./project-settings-dialog";
import { ProjectCost } from "./project-cost";
import { RoomForm } from "./room-form";
import { RoomPlan } from "./room-plan";
import { ValidationSummary } from "./validation-summary";
import { WallElementForm } from "./wall-element-form";

const ScenePreview = dynamic(
  () => import("../scene/scene-preview").then((module) => module.ScenePreview),
  { ssr: false, loading: () => <section className="creator-scene-shell" aria-label="Loading 3D room editor"><p className="creator-help">Loading 3D editor… You can switch to 2D at any time.</p></section> },
);

function EditorWorkspace() {
  const store = useProjectStoreApi();
  const propertiesRef = useRef<HTMLElement>(null);
  const [settingsDialog, setSettingsDialog] = useState<SettingsDialogRequest | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<EditorPanel>("room");
  const [activeTool, setActiveTool] = useState<PlacementTool | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [activeProjectItemId, setActiveProjectItemId] = useState<string | null>(null);
  const [placementError, setPlacementError] = useState("");
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d");
  const [cameraPreset, setCameraPreset] = useState<SceneCameraPreset>({ kind: "fit", sequence: 0 });
  const [showAllUseZones, setShowAllUseZones] = useState(false);
  const obstacles = useProjectStore((state) => state.project.obstacles);
  const placements = useProjectStore((state) => state.project.placements);
  const wallElements = useProjectStore((state) => state.project.wallElements);
  const project = useProjectStore((state) => state.project);
  const issues = useProjectStore((state) => state.validation.issues);
  const dispatch = useProjectStore((state) => state.dispatch);
  const selectedObstacle = obstacles.find((obstacle) => obstacle.id === selectedId);
  const selectedPlacement = placements.find((placement) => placement.id === selectedId);
  const selectedProduct = selectedPlacement
    ? productForPlacement(project, selectedPlacement)
    : undefined;
  const selectedItem = project.projectItems.find((item) => item.id === selectedId);
  const selectedItemProduct = selectedItem ? findProjectProductById(selectedItem.productId) : undefined;
  const selectedWallElement = wallElements.find((element) => element.id === selectedId);
  const visibleSelectedId = selectedObstacle || selectedWallElement || selectedPlacement || selectedItem
    ? selectedId
    : null;
  const placing = Boolean(activeTool || activeProductId || activeProjectItemId);
  const displayedPanel = activePanel === "selected" && !visibleSelectedId && !placing ? "room" : activePanel;
  const selectionBox = sceneSelectionBox(project, visibleSelectedId);

  function clearPlacementMode() {
    setActiveTool(null);
    setActiveProductId(null);
    setActiveProjectItemId(null);
    setPlacementError("");
  }

  function changeView(mode: "2d" | "3d") {
    clearPlacementMode();
    setCameraPreset((previous) => ({ kind: "fit", sequence: previous.sequence + 1 }));
    setViewMode(mode);
  }

  function changeCamera(kind: "fit" | "top" | "selection") {
    if (kind === "selection") {
      if (selectionBox) setCameraPreset((previous) => ({ kind, box: selectionBox, sequence: previous.sequence + 1 }));
      return;
    }
    setCameraPreset((previous) => ({ kind, sequence: previous.sequence + 1 }));
  }

  function openSettings(initialFocus: SettingsDialogRequest["initialFocus"], returnFocus: HTMLButtonElement) {
    clearPlacementMode();
    setSettingsDialog({ initialFocus, returnFocus });
  }

  function select(id: string | null) {
    clearPlacementMode();
    setSelectedId(id);
    setActivePanel(id ? "selected" : "room");
  }

  function changePanel(panel: EditorPanel) {
    clearPlacementMode();
    setSelectedId(null);
    setActivePanel(panel);
  }

  function changeTool(tool: PlacementTool) {
    setActiveProductId(null);
    setActiveProjectItemId(null);
    setSelectedId(null);
    setActivePanel("selected");
    setPlacementError("");
    setActiveTool((current) => current === tool ? null : tool);
  }

  function changeProduct(productId: string) {
    setActiveTool(null);
    setActiveProjectItemId(null);
    setSelectedId(null);
    setActivePanel("selected");
    setPlacementError("");
    setActiveProductId((current) => current === productId ? null : productId);
  }

  function addProduct(productId: string) {
    const result = dispatch({
      type: "PROJECT_ITEM_ADDED",
      payload: { productId },
    });
    if (!result.ok) {
      setPlacementError(result.error.message);
      return;
    }
    const itemId = result.affectedEntityIds[0];
    clearPlacementMode();
    setSelectedId(itemId ?? null);
    setActivePanel("selected");
  }

  function placeItem(projectItemId: string) {
    setActiveTool(null);
    setActiveProductId(null);
    setSelectedId(null);
    setActivePanel("selected");
    setPlacementError("");
    setActiveProjectItemId((current) => current === projectItemId ? null : projectItemId);
  }

  function finishPlacement(id: string) {
    clearPlacementMode();
    setSelectedId(id);
    setActivePanel("selected");
  }

  return (
    <main className="creator-editor" id="creator-content" tabIndex={-1}>
      <CreatorToolbar onOpenSettings={(trigger) => openSettings("budget", trigger)} />
      <div className="creator-layout">
        <ElementPanel
          onCancelPlacement={clearPlacementMode}
          activePanel={displayedPanel}
          activeProductId={activeProductId}
          activeProjectItemId={activeProjectItemId}
          activeTool={activeTool}
          onPanelChange={changePanel}
          onPlaceItem={placeItem}
          onProductActivate={changeProduct}
          onProductAdd={addProduct}
          onSelect={select}
          onToolChange={changeTool}
          selectedId={visibleSelectedId}
        />
        <div className="creator-viewport">
        <CreatorViewportToolbar viewMode={viewMode} onViewModeChange={changeView}
          canFocusSelection={selectionBox !== null} onCameraPreset={changeCamera}
          showAllUseZones={showAllUseZones} onShowAllUseZonesChange={setShowAllUseZones} />
        {viewMode === "2d" ? <RoomPlan
          activeProductId={activeProductId}
          activeProjectItemId={activeProjectItemId}
          activeTool={activeTool}
          onCancelPlacement={clearPlacementMode}
          onPlacementComplete={finishPlacement}
          onPlacementError={setPlacementError}
          onSelect={select}
          placementError={placementError}
          selectedId={visibleSelectedId}
        /> : <ScenePreview project={project} selectedId={visibleSelectedId} issues={issues} store={store}
          cameraPreset={cameraPreset}
          showAllUseZones={showAllUseZones}
          activeTool={activeTool} activeProductId={activeProductId} activeProjectItemId={activeProjectItemId}
          placementError={placementError} onSelect={select} onPlacementComplete={finishPlacement}
          onPlacementError={setPlacementError} onCancelPlacement={clearPlacementMode} onFallback={() => changeView("2d")} />}
        </div>
        <aside className="creator-side creator-properties" aria-label="Properties and validation" ref={propertiesRef} tabIndex={-1}>
          <ProjectCost onEditBudget={(trigger) => openSettings("budget", trigger)} onEditGoals={(trigger) => openSettings("goals", trigger)} />
          <h2 className="creator-properties-title">Properties</h2>
          {displayedPanel === "room" ? <RoomForm /> : null}
          {displayedPanel === "selected" && selectedObstacle ? <ObstacleForm obstacle={selectedObstacle} onRemoved={() => select(null)} /> : null}
          {displayedPanel === "selected" && selectedWallElement ? <WallElementForm element={selectedWallElement} onRemoved={() => select(null)} /> : null}
          {displayedPanel === "selected" && selectedPlacement && selectedProduct ? (
            <PlacementForm placement={selectedPlacement} product={selectedProduct} onRemoved={() => select(null)}
              onUnplaced={() => {
                select(selectedPlacement.projectItemId);
                propertiesRef.current?.focus({ preventScroll: true });
              }} />
          ) : null}
          {displayedPanel === "selected" && selectedItem && selectedItemProduct && !selectedPlacement ? (
            <ProjectItemForm
              item={selectedItem}
              onPlace={() => placeItem(selectedItem.id)}
              onRemoved={() => select(null)}
              product={selectedItemProduct}
            />
          ) : null}
          {displayedPanel === "selected" && !selectedObstacle && !selectedWallElement && !selectedPlacement && !selectedItem ? (
            <p className="creator-help">
              {placing
                ? "Place the selected item in the room."
                : "Select an element in the room or in the list."}
            </p>
          ) : null}
          <ValidationSummary />
        </aside>
      </div>
      {settingsDialog ? <ProjectSettingsDialog {...settingsDialog} onClose={() => setSettingsDialog(null)} /> : null}
    </main>
  );
}

export function CreatorEditor({
  initialProject,
  dependencies,
  persistence,
  storage,
  startMode,
}: {
  readonly initialProject?: GymProject;
  readonly dependencies?: ProjectCommandDependencies;
  readonly persistence?: boolean;
  readonly storage?: ProjectPersistenceBoundaryProps["storage"];
  readonly startMode?: CreatorStartMode;
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
        startMode={startMode}
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
