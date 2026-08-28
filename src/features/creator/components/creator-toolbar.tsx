"use client";

import { Redo2, Undo2 } from "lucide-react";

import { useProjectPersistence } from "../persistence/project-persistence-boundary";
import { useProjectStore } from "../store/project-store-context";
import { ProjectFileActions } from "./project-file-actions";

export function CreatorToolbar() {
  const canUndo = useProjectStore((state) => state.canUndo);
  const canRedo = useProjectStore((state) => state.canRedo);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);
  const persistence = useProjectPersistence();

  return (
    <header className="creator-toolbar">
      <div>
        <p className="creator-eyebrow">Home Gym Creator</p>
        <h1>Untitled room</h1>
        {persistence ? (
          <p
            aria-live="polite"
            className={`creator-persistence-status is-${persistence.status.kind}`}
            role="status"
          >
            {persistence.status.message}
          </p>
        ) : null}
      </div>
      <div className="creator-toolbar-actions" aria-label="Editor controls" role="group">
        <ProjectFileActions />
        <div className="creator-view-switch" aria-label="Plan view" role="group">
          <span aria-current="true">2D</span>
          <button disabled title="3D preview arrives in a later phase" type="button">3D</button>
        </div>
        <button disabled={!canUndo} onClick={undo} type="button">
          <Undo2 aria-hidden="true" size={17} /> Undo
        </button>
        <button disabled={!canRedo} onClick={redo} type="button">
          <Redo2 aria-hidden="true" size={17} /> Redo
        </button>
      </div>
    </header>
  );
}
