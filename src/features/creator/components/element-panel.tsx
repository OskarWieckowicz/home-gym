"use client";

import { Box, Plus, Ruler, Settings } from "lucide-react";

import type { EditorPanel } from "../editor-types";
import { useProjectStore } from "../store/project-store-context";

type ElementPanelProps = {
  readonly activePanel: EditorPanel;
  readonly onPanelChange: (panel: EditorPanel) => void;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
};

export function ElementPanel({ activePanel, onPanelChange, selectedId, onSelect }: ElementPanelProps) {
  const obstacles = useProjectStore((state) => state.project.obstacles);
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
        <button aria-current={activePanel === "add" ? "page" : undefined} onClick={() => onPanelChange("add")} type="button">
          <Plus aria-hidden="true" size={18} /> Add an area
        </button>
      </nav>
      <div className="creator-element-list">
        <h3>Areas in this room</h3>
        {obstacles.length === 0 ? <p>No obstacles or unavailable zones yet.</p> : (
          <ul>
            {obstacles.map((obstacle) => (
              <li key={obstacle.id}>
                <button
                  aria-current={selectedId === obstacle.id ? "true" : undefined}
                  onClick={() => onSelect(obstacle.id)}
                  type="button"
                >
                  <Box aria-hidden="true" size={17} />
                  <span><strong>{obstacle.name}</strong><small>{obstacle.kind === "obstacle" ? "Physical obstacle" : "Unavailable zone"}{obstacle.locked ? " · Locked" : ""}</small></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
