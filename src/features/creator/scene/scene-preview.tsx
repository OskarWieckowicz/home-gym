"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import { PCFShadowMap } from "three";
import type { GymProject } from "@/features/project/schemas/project";
import type { PlanIssueRef } from "../plan/entity-issue-state";
import { Box, SelectionOutline, WallMarker } from "./scene-entities";
import { PlacementModel } from "./scene-equipment";
import { sceneEntityAppearance } from "./scene-entity-state";
import { projectVisualAssetSources } from "./scene-preload";
import { obstacleToScene, roomToScene } from "./scene-transform";

const WALL_OPACITY = 0.32;
const FLOOR_RENDER_OFFSET = -0.003;

export type ScenePreviewProps = {
  readonly project: GymProject;
  readonly selectedId: string | null;
  readonly issues: readonly PlanIssueRef[];
};

function SceneContents({ project, selectedId, issues }: ScenePreviewProps) {
  const room = roomToScene(project.room);
  return <>
    <ambientLight intensity={1.8} />
    <directionalLight castShadow intensity={2.2} position={[4, 6, 3]} />
    <mesh position={[0, FLOOR_RENDER_OFFSET, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[room.x, room.z]} />
      <meshStandardMaterial color="#e2e8f0" roughness={0.95} />
    </mesh>
    <mesh position={[0, room.y / 2, -room.z / 2]}><boxGeometry args={[room.x, room.y, 0.06]} /><meshStandardMaterial color="#cbd5e1" transparent opacity={WALL_OPACITY} depthWrite={false} /></mesh>
    <mesh position={[0, room.y / 2, room.z / 2]}><boxGeometry args={[room.x, room.y, 0.06]} /><meshStandardMaterial color="#cbd5e1" transparent opacity={WALL_OPACITY} depthWrite={false} /></mesh>
    <mesh position={[-room.x / 2, room.y / 2, 0]}><boxGeometry args={[0.06, room.y, room.z]} /><meshStandardMaterial color="#cbd5e1" transparent opacity={WALL_OPACITY} depthWrite={false} /></mesh>
    <mesh position={[room.x / 2, room.y / 2, 0]}><boxGeometry args={[0.06, room.y, room.z]} /><meshStandardMaterial color="#cbd5e1" transparent opacity={WALL_OPACITY} depthWrite={false} /></mesh>
    {project.obstacles.map((obstacle) => {
      const appearance = sceneEntityAppearance(obstacle.id, selectedId, issues);
      const box = obstacleToScene(obstacle, project.room);
      return <group key={obstacle.id}>
        <Box box={box} color={obstacle.kind === "obstacle" ? "#475569" : "#f59e0b"} opacity={obstacle.kind === "obstacle" ? 1 : 0.35} appearance={appearance} />
        <SelectionOutline box={box} color={appearance.outline} />
      </group>;
    })}
    {project.wallElements.map((element) => <WallMarker appearance={sceneEntityAppearance(element.id, selectedId, issues)} element={element} key={element.id} project={project} />)}
    {project.placements.map((placement) => <PlacementModel appearance={sceneEntityAppearance(placement.id, selectedId, issues)} key={placement.id} placement={placement} project={project} />)}
  </>;
}

export function ScenePreview({ project, selectedId, issues }: ScenePreviewProps) {
  useEffect(() => {
    for (const src of projectVisualAssetSources(project)) useGLTF.preload(src);
  }, [project]);
  return <section className="creator-scene-shell" aria-labelledby="scene-title">
    <div className="creator-plan-heading"><div><h2 id="scene-title">3D room preview</h2><p>Read-only spatial review. Orbit and zoom to inspect the shared room.</p></div><span>{project.room.widthCm} × {project.room.depthCm} cm</span></div>
    <div className="creator-scene-canvas" role="img" aria-label="Navigable 3D room preview">
      <Canvas camera={{ position: [4.8, 4.4, 5.2], fov: 45 }} dpr={[1, 1.5]} shadows={{ type: PCFShadowMap }}>
        <SceneContents project={project} selectedId={selectedId} issues={issues} />
        <OrbitControls enablePan={false} minDistance={2} maxDistance={12} target={[0, 0.8, 0]} />
      </Canvas>
    </div>
  </section>;
}
