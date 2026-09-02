"use client";
import { ChevronDown, Focus, Image as ImageIcon, Layers, Maximize, Redo2, Undo2 } from "lucide-react";
import { useProjectStore } from "../store/project-store-context";
import { EditorPopover } from "./editor-popover";

export function CreatorViewportToolbar({ viewMode, onViewModeChange, onCameraPreset, canFocusSelection, showAllUseZones, onShowAllUseZonesChange, presentationView, onPresentationViewChange }: {
  readonly presentationView: boolean;
  readonly onPresentationViewChange: (show: boolean) => void;
  readonly viewMode: "2d" | "3d";
  readonly onViewModeChange: (mode: "2d" | "3d") => void;
  readonly onCameraPreset: (kind: "fit" | "top" | "selection") => void;
  readonly canFocusSelection: boolean;
  readonly showAllUseZones: boolean;
  readonly onShowAllUseZonesChange: (show: boolean) => void;
}) {
  const canUndo = useProjectStore((state) => state.canUndo);
  const canRedo = useProjectStore((state) => state.canRedo);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);
  const room = useProjectStore((state) => state.project.room);
  return <div className="creator-viewport-toolbar" role="group" aria-label="View controls">
    <div className="creator-viewport-primary">
      <div className="creator-view-switch" aria-label="Plan view" role="group">
        <button aria-pressed={viewMode === "2d"} onClick={() => onViewModeChange("2d")} type="button">2D</button>
        <button aria-pressed={viewMode === "3d"} onClick={() => onViewModeChange("3d")} type="button">3D</button>
      </div>
      <button type="button" className="creator-zone-toggle" disabled={presentationView} aria-pressed={showAllUseZones}
        onClick={() => onShowAllUseZonesChange(!showAllUseZones)}>
        <Layers aria-hidden="true" size={16} /> Show all use zones
      </button>
      {viewMode === "3d" ? <button type="button" className="creator-zone-toggle" aria-pressed={presentationView}
        onClick={() => onPresentationViewChange(!presentationView)}>
        <ImageIcon aria-hidden="true" size={16} /> Presentation view
      </button> : null}
      <div className="creator-history" role="group" aria-label="Edit history">
        <button aria-label="Undo" title="Undo" disabled={!canUndo} onClick={undo} type="button"><Undo2 aria-hidden="true" size={18} /></button>
        <button aria-label="Redo" title="Redo" disabled={!canRedo} onClick={redo} type="button"><Redo2 aria-hidden="true" size={18} /></button>
      </div>
    </div>
    <div className="creator-viewport-secondary">
      <span>{room.widthCm} × {room.depthCm} cm</span>
      {viewMode === "3d" ? <div className="creator-camera-actions">
        <EditorPopover label="Camera controls" icon={<ChevronDown aria-hidden="true" size={16} />}>
          <button type="button" disabled={!canFocusSelection} onClick={() => onCameraPreset("selection")}>
            <Focus aria-hidden="true" size={16} /> Focus selected
          </button>
          <button type="button" onClick={() => onCameraPreset("fit")}><Maximize aria-hidden="true" size={16} /> Fit view</button>
          <button type="button" onClick={() => onCameraPreset("top")}>Top view</button>
        </EditorPopover>
      </div> : null}
    </div>
  </div>;
}
