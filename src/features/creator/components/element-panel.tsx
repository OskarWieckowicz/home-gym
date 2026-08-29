"use client";

import { Ban, Box, DoorOpen, Dumbbell, PanelTop, Ruler, Settings } from "lucide-react";

import { findProductById } from "@/features/catalog/queries/catalog";

import type { EditorPanel, PlacementTool } from "../editor-types";
import { useProjectStore } from "../store/project-store-context";
import { EquipmentCatalogPanel } from "./equipment-catalog-panel";

type ElementPanelProps = {
  readonly activePanel: EditorPanel;
  readonly activeTool: PlacementTool | null;
  readonly activeProductId: string | null;
  readonly onPanelChange: (panel: EditorPanel) => void;
  readonly onProductActivate: (productId: string) => void;
  readonly onToolChange: (tool: PlacementTool) => void;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
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
  activeTool,
  onPanelChange,
  onProductActivate,
  onToolChange,
  selectedId,
  onSelect,
}: ElementPanelProps) {
  const obstacles = useProjectStore((state) => state.project.obstacles);
  const placements = useProjectStore((state) => state.project.placements);
  const wallElements = useProjectStore((state) => state.project.wallElements);
  return (
    <aside className="creator-side creator-elements" aria-label="Room elements">
      <h2>Build the room</h2>
      <nav aria-label="Editor panels">
        <button aria-current={activePanel === "room" ? "page" : undefined} onClick={() => onPanelChange("room")} type="button">
          <Ruler aria-hidden="true" size={18} /> Room dimensions
        </button>
        <button aria-current={activePanel === "settings" ? "page" : undefined} onClick={() => onPanelChange("settings")} type="button">
          <Settings aria-hidden="true" size={18} /> Project settings
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
      </section>

      <EquipmentCatalogPanel
        activeProductId={activeProductId}
        onActivate={onProductActivate}
      />

      <div className="creator-element-list">
        <h3>Placed equipment</h3>
        {placements.length === 0 ? <p>No equipment placed yet.</p> : (
          <ul>
            {placements.map((placement) => {
              const product = findProductById(placement.productId);
              return (
                <li key={placement.id}>
                  <button
                    aria-current={selectedId === placement.id ? "true" : undefined}
                    onClick={() => onSelect(placement.id)}
                    type="button"
                  >
                    <Dumbbell aria-hidden="true" size={17} />
                    <span>
                      <strong>{product?.name ?? "Unavailable product"}</strong>
                      <small>Equipment · {placement.rotation}°</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

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
    </aside>
  );
}
