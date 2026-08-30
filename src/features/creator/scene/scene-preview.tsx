"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useCallback, useEffect, useState, type PointerEvent } from "react";
import { PCFShadowMap } from "three";
import { EQUIPMENT_DRAG_TYPE } from "../components/equipment-catalog-panel";
import { SceneBoundary, SceneContextLoss, SceneRecovery } from "./scene-boundary";
import { SceneCameraControls, type SceneCameraPreset } from "./scene-camera-controls";
import { SceneContents } from "./scene-contents";
import { SceneGhost, SceneWallTargets } from "./scene-ghost";
import { ScenePicking } from "./scene-picking";
import { projectVisualAssetSources } from "./scene-preload";
import { useSceneEditing } from "./use-scene-editing";
import type { SceneEditorProps } from "./scene-editor-types";

export type ScenePreviewProps = SceneEditorProps;

export function ScenePreview(props: ScenePreviewProps) {
  const { project, selectedId, issues, store } = props;
  const [preset, setPreset] = useState<SceneCameraPreset>({ kind: "fit", sequence: 0 });
  const [contextLost, setContextLost] = useState(false);
  const placing = Boolean(props.activeTool || props.activeProductId || props.activeProjectItemId);
  const { controller, projectPointerRef, snapshot } = useSceneEditing(store, props);
  const getProject = useCallback(() => store.getState().project, [store]);
  const loseContext = useCallback(() => { controller.dispose(); setContextLost(true); }, [controller]);

  useEffect(() => {
    for (const src of projectVisualAssetSources(project)) useGLTF.preload(src);
  }, [project]);

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("button")) return;
    if (event.button !== 0) return;
    event.currentTarget.focus({ preventScroll: true });
    const element = event.currentTarget;
    const editing = controller.pointerDown(event, projectPointerRef.current?.(event) ?? null, () => {
      element.setPointerCapture(event.pointerId);
      return () => { if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId); };
    });
    // This capture handler runs before the native canvas camera listener. React state alone
    // cannot disable OrbitControls soon enough for the same pointer-down event.
    if (editing) event.stopPropagation();
  }

  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const inside = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    controller.pointerUp(event, projectPointerRef.current?.(event) ?? null, inside);
  }

  return <section className="creator-scene-shell" aria-labelledby="scene-title">
    <div className="creator-plan-heading"><div><h2 id="scene-title">3D room editor</h2>
      <p id="scene-help">{placing ? "Choose a floor or highlighted wall-edge target. Enter places at the centre; Escape cancels."
        : "Click an item to select it, then drag it to move. Drag elsewhere to orbit; scroll to zoom. Click empty space to deselect."}</p>
    </div><span>{project.room.widthCm} × {project.room.depthCm} cm</span></div>
    <div className="creator-scene-controls" role="group" aria-label="3D controls">
      <button type="button" onClick={() => { controller.cancel(); setPreset({ kind: "fit", sequence: preset.sequence + 1 }); }}>Reset view</button>
      <button type="button" onClick={() => { controller.cancel(); setPreset({ kind: "top", sequence: preset.sequence + 1 }); }}>Top view</button>
      {placing ? <><button type="button" onClick={controller.placeCenter}>Place at centre</button><button type="button" onClick={controller.cancelPlacement}>Cancel placement</button></> : null}
    </div>
    {props.placementError ? <p className="creator-placement-error" role="alert">{props.placementError}</p> : null}
    <div className="creator-scene-canvas" role="group" aria-label="Editable 3D room" aria-describedby="scene-help" tabIndex={0}
      onPointerDownCapture={pointerDown}
      onPointerMoveCapture={(event) => controller.pointerMove(event, projectPointerRef.current?.(event) ?? null)}
      onPointerUpCapture={pointerUp}
      onPointerCancel={(event) => controller.pointerCancel(event.pointerId)}
      onLostPointerCapture={(event) => controller.lostCapture(event.pointerId)}
      onPointerLeave={() => { if (!snapshot.gestureActive) controller.cancel(); }}
      onKeyDown={(event) => { if (event.key === "Enter" && event.target === event.currentTarget && !event.repeat) { event.preventDefault(); controller.placeCenter(); } }}
      onDragOver={(event) => { if (event.dataTransfer.types.includes(EQUIPMENT_DRAG_TYPE)) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } }}
      onDrop={(event) => { const id = event.dataTransfer.getData(EQUIPMENT_DRAG_TYPE); if (!id) return; event.preventDefault(); controller.dropProduct(id, projectPointerRef.current?.(event)?.point ?? null); }}>
      <SceneBoundary onFallback={props.onFallback} onFailure={controller.dispose}>
        {contextLost ? <SceneRecovery onFallback={props.onFallback} message="The graphics context was lost. Continue editing the same project in 2D." /> :
          <Canvas camera={{ position: [4.8, 4.4, 5.2], fov: 45 }} dpr={[1, 1.5]} shadows={{ type: PCFShadowMap }} fallback={<SceneRecovery onFallback={props.onFallback} />}>
            <SceneContents project={project} selectedId={selectedId} issues={issues} />
            <ScenePicking projectPointerRef={projectPointerRef} getProject={getProject} />
            <SceneGhost command={snapshot.command} project={project} />
            <SceneWallTargets project={project} active={props.activeTool === "door" || props.activeTool === "window"} />
            <SceneCameraControls room={project.room} placing={placing} gestureActive={snapshot.gestureActive} preset={preset} />
            <SceneContextLoss onContextLost={loseContext} />
          </Canvas>}
      </SceneBoundary>
    </div>
    {snapshot.command ? <p className="creator-help">Preview only — not yet saved or validated.</p> : null}
    <p className="creator-scene-status" role="status">{snapshot.status}</p>
  </section>;
}
