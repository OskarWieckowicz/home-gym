import type { GymProject } from "@/features/project/schemas/project";
import type { PlanIssueRef } from "../plan/entity-issue-state";
import { Box, SelectionOutline, WallMarker } from "./scene-entities";
import { PlacementModel } from "./scene-equipment";
import { sceneEntityAppearance } from "./scene-entity-state";
import { obstacleToScene, roomToScene, SCENE_WALL_THICKNESS_M } from "./scene-transform";
import { ignoreSceneRaycast, SceneWalls } from "./scene-walls";
import { SCENE_ROOM_COLORS } from "./scene-presentation";
import { UnavailableZone } from "./scene-unavailable-zone";

export type SceneContentsProps = {
  readonly project: GymProject;
  readonly selectedId: string | null;
  readonly issues: readonly PlanIssueRef[];
  readonly showAllUseZones?: boolean;
  readonly presentationView?: boolean;
};

/** Visuals never own interaction. Picking uses independent domain-derived targets. */
export function SceneContents({ project, selectedId, issues, showAllUseZones = true, presentationView = false }: SceneContentsProps) {
  const room = roomToScene(project.room);
  return <>
    <color attach="background" args={[SCENE_ROOM_COLORS.background]} />
    <ambientLight intensity={1.8} />
    <directionalLight castShadow intensity={2.2} position={[4, 6, 3]} />
    <mesh raycast={ignoreSceneRaycast} position={[0, -0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[room.x + SCENE_WALL_THICKNESS_M * 2, room.z + SCENE_WALL_THICKNESS_M * 2]} />
      <meshStandardMaterial color={SCENE_ROOM_COLORS.floor} roughness={1} metalness={0} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
    </mesh>
    <SceneWalls room={project.room} />
    {project.obstacles.map((obstacle) => {
      const appearance = sceneEntityAppearance(obstacle.id, selectedId, issues, { presentationView });
      const box = obstacleToScene(obstacle, project.room);
      if (obstacle.kind === "unavailable-zone") return presentationView ? null : <UnavailableZone key={obstacle.id} box={box} appearance={appearance} />;
      return <group key={obstacle.id}>
        <Box box={box} color="#475569" appearance={appearance} />
        <SelectionOutline box={box} color={appearance.outline} />
      </group>;
    })}
    {project.wallElements.map((element) => <WallMarker appearance={sceneEntityAppearance(element.id, selectedId, issues, { presentationView })} element={element} key={element.id} project={project} />)}
    {project.placements.map((placement) => <PlacementModel appearance={sceneEntityAppearance(placement.id, selectedId, issues, { showAllUseZones, presentationView })} key={placement.id} placement={placement} project={project} />)}
  </>;
}
