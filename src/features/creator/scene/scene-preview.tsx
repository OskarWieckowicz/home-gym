"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useCallback, useEffect, useLayoutEffect, useState, type PointerEvent } from "react";
import { PCFShadowMap } from "three";
import { EQUIPMENT_DRAG_TYPE } from "../components/equipment-catalog-panel";
import { SceneZoneLegend } from "../components/scene-zone-legend";
import { SceneBoundary, SceneContextLoss, SceneRecovery } from "./scene-boundary";
import { SceneCameraControls, type SceneCameraPreset } from "./scene-camera-controls";
import { SceneContents } from "./scene-contents";
import { SceneGhost, SceneWallTargets } from "./scene-ghost";
import { ScenePicking } from "./scene-picking";
import { projectVisualAssetSources } from "./scene-preload";
import { useSceneEditing } from "./use-scene-editing";
import type { SceneEditorProps } from "./scene-editor-types";

export type ScenePreviewProps = SceneEditorProps;
const INITIAL_PRESET: SceneCameraPreset = { kind: "fit", sequence: 0 };

export function ScenePreview(props: ScenePreviewProps) {
  const { project, selectedId, issues, store, presentationView = false } = props;
  const preset = props.cameraPreset ?? INITIAL_PRESET;
  const [contextLost, setContextLost] = useState(false);
  const placing = !presentationView && Boolean(props.activeTool || props.activeProductId || props.activeProjectItemId);
  const { controller, projectPointerRef, snapshot } = useSceneEditing(store, props);
  const getProject = useCallback(() => store.getState().project, [store]);
  const loseContext = useCallback(() => { controller.dispose(); setContextLost(true); }, [controller]);
  useLayoutEffect(() => { controller.cancel(); }, [controller, preset.kind, preset.sequence, presentationView]);

  useEffect(() => {
    for (const src of projectVisualAssetSources(project)) useGLTF.preload(src);
  }, [project]);

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (presentationView) return;
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
    if (presentationView) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const inside = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    controller.pointerUp(event, projectPointerRef.current?.(event) ?? null, inside);
  }

  return <section className="creator-scene-shell" aria-labelledby="scene-title">
    <h2 id="scene-title" className="visually-hidden">{presentationView ? "3D room presentation" : "3D room editor"}</h2>
    {placing ? <div className="creator-scene-controls" role="group" aria-label="Placement controls">
      <span>Choose a floor or highlighted wall edge.</span>
      <button type="button" onClick={controller.placeCenter}>Place at centre</button>
      <button type="button" onClick={controller.cancelPlacement}>Cancel placement</button>
    </div> : null}
    {props.placementError ? <p className="creator-placement-error" role="alert">{props.placementError}</p> : null}
    <div className="creator-scene-canvas" role="group" aria-label={presentationView ? "3D room presentation view" : "Editable 3D room"} aria-describedby="scene-help" tabIndex={0}
      onPointerDownCapture={pointerDown}
      onPointerMoveCapture={(event) => !presentationView && controller.pointerMove(event, projectPointerRef.current?.(event) ?? null)}
      onPointerUpCapture={pointerUp}
      onPointerCancel={(event) => controller.pointerCancel(event.pointerId)}
      onLostPointerCapture={(event) => controller.lostCapture(event.pointerId)}
      onPointerLeave={() => { if (!snapshot.gestureActive) controller.cancel(); }}
      onKeyDown={(event) => { if (!presentationView && event.key === "Enter" && event.target === event.currentTarget && !event.repeat) { event.preventDefault(); controller.placeCenter(); } }}
      onDragOver={(event) => { if (!presentationView && event.dataTransfer.types.includes(EQUIPMENT_DRAG_TYPE)) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } }}
      onDrop={(event) => { if (presentationView) return; const id = event.dataTransfer.getData(EQUIPMENT_DRAG_TYPE); if (!id) return; event.preventDefault(); controller.dropProduct(id, projectPointerRef.current?.(event)?.point ?? null); }}>
      <SceneBoundary onFallback={props.onFallback} onFailure={controller.dispose}>
        {contextLost ? <SceneRecovery onFallback={props.onFallback} message="The graphics context was lost. Continue editing the same project in 2D." /> :
          <Canvas camera={{ position: [4.8, 4.4, 5.2], fov: 45 }} dpr={[1, 1.5]} shadows={{ type: PCFShadowMap }} fallback={<SceneRecovery onFallback={props.onFallback} />}>
            <SceneContents project={project} selectedId={selectedId} issues={issues} showAllUseZones={props.showAllUseZones ?? false} presentationView={presentationView} />
            <ScenePicking projectPointerRef={projectPointerRef} getProject={getProject} />
            {!presentationView ? <SceneGhost command={snapshot.command} project={project} /> : null}
            {!presentationView ? <SceneWallTargets project={project} active={props.activeTool === "door" || props.activeTool === "window"} /> : null}
            <SceneCameraControls room={project.room} placing={placing} gestureActive={snapshot.gestureActive} preset={preset} />
            <SceneContextLoss onContextLost={loseContext} />
          </Canvas>}
      </SceneBoundary>
    </div>
    {presentationView ? <p className="creator-scene-help">Presentation view · Zones and highlights hidden. Layout checks remain in the panel.</p> : <SceneZoneLegend showAll={props.showAllUseZones ?? false} />}
    <p id="scene-help" className="creator-scene-help">{presentationView ? "Drag to orbit · Scroll to zoom" : placing
      ? "Enter places at the centre · Escape cancels"
      : "Click to select · Drag selected item to move · Drag elsewhere to orbit · Scroll to zoom"}</p>
    <p className={snapshot.status === "Change saved. Undo is available." ? "visually-hidden" : "creator-scene-status"} role="status">{snapshot.status}</p>
  </section>;
}
