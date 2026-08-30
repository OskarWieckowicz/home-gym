"use client";

import { Canvas } from "@react-three/fiber";
import { PCFShadowMap } from "three";
import { SceneBoundary, SceneContextLoss, SceneRecovery } from "@/features/creator/scene/scene-boundary";
import { SceneCameraControls } from "@/features/creator/scene/scene-camera-controls";
import { SceneContents, type SceneContentsProps } from "@/features/creator/scene/scene-contents";

export function SummaryScene({ project, issues, onFallback }: Omit<SceneContentsProps, "selectedId"> & {
  readonly onFallback: () => void;
}) {
  return <div className="summary-scene" role="group" aria-label="Read-only 3D room layout">
    <SceneBoundary onFallback={onFallback} onFailure={onFallback}>
      <Canvas camera={{ position: [4.8, 4.4, 5.2], fov: 45 }} dpr={[1, 1.5]}
        shadows={{ type: PCFShadowMap }} fallback={<SceneRecovery onFallback={onFallback} />}>
        <SceneContents project={project} issues={issues} selectedId={null} />
        <SceneCameraControls room={project.room} placing={false} gestureActive={false} preset={{ kind: "fit", sequence: 0 }} />
        <SceneContextLoss onContextLost={onFallback} />
      </Canvas>
    </SceneBoundary>
  </div>;
}
