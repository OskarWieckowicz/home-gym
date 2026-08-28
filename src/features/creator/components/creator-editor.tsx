"use client";

import { useState } from "react";

import type { ProjectCommandDependencies } from "@/features/project/commands/apply-project-command";
import type { GymProject } from "@/features/project/schemas/project";

import type { EditorPanel } from "../editor-types";
import { ProjectStoreProvider, useProjectStore } from "../store/project-store-context";
import { CreatorToolbar } from "./creator-toolbar";
import { ElementPanel } from "./element-panel";
import { ObstacleForm } from "./obstacle-form";
import { ProjectSettingsForm } from "./project-settings-form";
import { RoomForm } from "./room-form";
import { RoomPlan } from "./room-plan";
import { ValidationSummary } from "./validation-summary";

function EditorWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<EditorPanel>("room");
  const obstacles = useProjectStore((state) => state.project.obstacles);
  const selected = obstacles.find((obstacle) => obstacle.id === selectedId);
  const visibleSelectedId = selected ? selectedId : null;

  function select(id: string | null) {
    setSelectedId(id);
    if (id) setActivePanel("selected");
  }

  return (
    <main className="creator-editor" id="creator-content" tabIndex={-1}>
      <CreatorToolbar />
      <div className="creator-layout">
        <ElementPanel activePanel={activePanel} onPanelChange={setActivePanel} onSelect={select} selectedId={visibleSelectedId} />
        <RoomPlan onSelect={select} selectedId={visibleSelectedId} />
        <aside className="creator-side creator-properties" aria-label="Properties and validation">
          {activePanel === "room" ? <RoomForm /> : null}
          {activePanel === "settings" ? <ProjectSettingsForm /> : null}
          {activePanel === "add" ? <ObstacleForm mode="add" onCreated={select} /> : null}
          {activePanel === "selected" && selected ? <ObstacleForm mode="edit" obstacle={selected} onRemoved={() => select(null)} /> : null}
          {activePanel === "selected" && !selected ? <p className="creator-help">Select an area on the plan or in the list.</p> : null}
          <ValidationSummary />
        </aside>
      </div>
    </main>
  );
}

export function CreatorEditor({
  initialProject,
  dependencies,
}: {
  readonly initialProject?: GymProject;
  readonly dependencies?: ProjectCommandDependencies;
} = {}) {
  return <ProjectStoreProvider dependencies={dependencies} initialProject={initialProject}><EditorWorkspace /></ProjectStoreProvider>;
}
