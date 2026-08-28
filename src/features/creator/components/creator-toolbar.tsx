"use client";

import { Redo2, Undo2 } from "lucide-react";

import { useProjectStore } from "../store/project-store-context";

export function CreatorToolbar() {
  const canUndo = useProjectStore((state) => state.canUndo);
  const canRedo = useProjectStore((state) => state.canRedo);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);

  return (
    <header className="creator-toolbar">
      <div>
        <p className="creator-eyebrow">Home Gym Creator</p>
        <h1>Untitled room</h1>
      </div>
      <div className="creator-toolbar-actions" aria-label="Editor history">
        <div className="creator-view-switch" aria-label="Plan view">
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
