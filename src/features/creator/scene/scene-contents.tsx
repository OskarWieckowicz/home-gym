import type { GymProject } from "@/features/project/schemas/project";
import type { PlanIssueRef } from "../plan/entity-issue-state";
import { Box, SelectionOutline, WallMarker } from "./scene-entities";
import { PlacementModel } from "./scene-equipment";
import { sceneEntityAppearance } from "./scene-entity-state";
import { obstacleToScene, roomToScene } from "./scene-transform";
import { ignoreSceneRaycast, SceneWalls } from "./scene-walls";

export type SceneContentsProps = {
  readonly project: GymProject;
  readonly selectedId: string | null;
  readonly issues: readonly PlanIssueRef[];
};

/** Visuals never own interaction. Picking uses independent domain-derived targets. */
export function SceneContents({ project, selectedId, issues }: SceneContentsProps) {
  const room = roomToScene(project.room);
  return <>
    <ambientLight intensity={1.8} />
    <directionalLight castShadow intensity={2.2} position={[4, 6, 3]} />
    <mesh raycast={ignoreSceneRaycast} position={[0, -0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[room.x, room.z]} />
      <meshStandardMaterial color="#e2e8f0" roughness={0.95} />
    </mesh>
    <SceneWalls room={project.room} />
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
