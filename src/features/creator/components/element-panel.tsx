"use client";

import { Ban, Box, DoorOpen, PanelTop, Ruler } from "lucide-react";
import { useId, useState } from "react";

import type { EditorPanel, PlacementTool } from "../editor-types";
import { useProjectStore } from "../store/project-store-context";
import { useProjectShopping } from "../store/use-project-shopping";
import { EquipmentCatalogPanel } from "./equipment-catalog-panel";
import { ProjectItemsList } from "./project-items-list";
import { SidebarTabs, type SidebarTab } from "./sidebar-tabs";

type ElementPanelProps = {
  readonly activePanel: EditorPanel;
  readonly activeTool: PlacementTool | null;
  readonly activeProductId: string | null;
  readonly activeProjectItemId: string | null;
  readonly onPanelChange: (panel: EditorPanel) => void;
  readonly onProductActivate: (productId: string) => void;
  readonly onProductAdd: (productId: string) => void;
  readonly onPlaceItem: (projectItemId: string) => void;
  readonly onToolChange: (tool: PlacementTool) => void;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly onCancelPlacement: () => void;
};

const TOOLS = [
  { id: "obstacle", label: "Physical obstacle", icon: Box },
  { id: "unavailable-zone", label: "Unavailable zone", icon: Ban },
  { id: "door", label: "Door", icon: DoorOpen },
  { id: "window", label: "Window", icon: PanelTop },
] as const;

export function ElementPanel({
  activePanel,
  activeProductId,
  activeProjectItemId,
  activeTool,
  onPanelChange,
  onProductActivate,
  onProductAdd,
  onPlaceItem,
  onToolChange,
  selectedId,
  onSelect,
  onCancelPlacement,
}: ElementPanelProps) {
  const id = useId();
  const [activeTab, setActiveTab] = useState<SidebarTab>("Equipment");
  const obstacles = useProjectStore((state) => state.project.obstacles);
  const wallElements = useProjectStore((state) => state.project.wallElements);
  const { pending } = useProjectShopping();

  function changeTab(tab: SidebarTab) {
    if (tab === activeTab) return;
    onCancelPlacement();
    setActiveTab(tab);
  }

  return (
    <aside className="creator-side creator-elements" aria-label="Room elements">
      <h2 className="visually-hidden">Build the room</h2>
      <SidebarTabs id={id} activeTab={activeTab} onChange={changeTab} pendingCount={pending.count} />
      <div className="creator-sidebar-panel" role="tabpanel" id={`${id}-panel-0`} aria-labelledby={`${id}-tab-0`} hidden={activeTab !== "Equipment"}>
        <EquipmentCatalogPanel
          activeProductId={activeProductId}
          onActivate={onProductActivate}
          onAdd={onProductAdd}
        />
      </div>

      <div className="creator-sidebar-panel" role="tabpanel" id={`${id}-panel-1`} aria-labelledby={`${id}-tab-1`} hidden={activeTab !== "Room"}>
      <nav aria-label="Editor panels">
        <button aria-current={activePanel === "room" ? "page" : undefined} onClick={() => onPanelChange("room")} type="button">
          <Ruler aria-hidden="true" size={18} /> Room dimensions
        </button>
      </nav>

      <section className="creator-tool-palette" aria-labelledby="placement-tools-title">
        <h3 id="placement-tools-title">Add to the room</h3>
        <div className="creator-tool-grid">
          {TOOLS.map(({ id, label, icon: Icon }) => (
            <button
              aria-pressed={activeTool === id}
              key={id}
              onClick={() => onToolChange(id)}
              type="button"
            >
              <Icon aria-hidden="true" size={18} /> {label}
            </button>
          ))}
        </div>
        <p className="creator-tool-hint">
          Physical obstacles block walking. Unavailable zones keep equipment off that floor, but a person can still walk through them.
        </p>
      </section>
      </div>
      <div className="creator-sidebar-panel" role="tabpanel" id={`${id}-panel-2`} aria-labelledby={`${id}-tab-2`} hidden={activeTab !== "Project items"}>
      <ProjectItemsList
        activeProjectItemId={activeProjectItemId}
        onPlaceItem={onPlaceItem}
        onSelect={onSelect}
        selectedId={selectedId}
      />

      <div className="creator-element-list">
        <h3>Floor areas</h3>
        {obstacles.length === 0 ? <p>No obstacles or unavailable zones yet.</p> : (
          <ul>
            {obstacles.map((obstacle) => (
              <li key={obstacle.id}>
                <button
                  aria-current={selectedId === obstacle.id ? "true" : undefined}
                  onClick={() => onSelect(obstacle.id)}
                  type="button"
                >
                  {obstacle.kind === "obstacle"
                    ? <Box aria-hidden="true" size={17} />
                    : <Ban aria-hidden="true" size={17} />}
                  <span>
                    <strong>{obstacle.name}</strong>
                    <small>{obstacle.kind === "obstacle" ? "Physical obstacle" : "Unavailable zone"}{obstacle.locked ? " · Locked" : ""}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="creator-element-list">
        <h3>Wall elements</h3>
        {wallElements.length === 0 ? <p>No doors or windows yet.</p> : (
          <ul>
            {wallElements.map((element) => (
              <li key={element.id}>
                <button
                  aria-current={selectedId === element.id ? "true" : undefined}
                  onClick={() => onSelect(element.id)}
                  type="button"
                >
                  {element.kind === "door"
                    ? <DoorOpen aria-hidden="true" size={17} />
                    : <PanelTop aria-hidden="true" size={17} />}
                  <span><strong>{element.name}</strong><small>{element.kind === "door" ? "Door" : "Window"} · {element.wall} wall</small></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </aside>
  );
}
