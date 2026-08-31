import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { Room, Wall } from "@/features/project/schemas/project";
import { roomToScene, sceneWallSlab } from "./scene-transform";
import { ALL_SCENE_WALLS, scenePerimeterVisibility, sceneWallVisibility } from "./scene-wall-visibility";
import { SCENE_ROOM_COLORS } from "./scene-presentation";

export const ignoreSceneRaycast = () => undefined;
const WALLS: readonly Wall[] = ["top", "right", "bottom", "left"];
const PERIMETER_HEIGHT_M = 0.03;

export function SceneWalls({ room }: { readonly room: Room }) {
  const walls = useRef<Group>(null);
  const perimeter = useRef<Group>(null);
  const visibility = useRef(ALL_SCENE_WALLS);
  const size = roomToScene(room);
  useFrame(({ camera }) => {
    visibility.current = sceneWallVisibility(camera.position, visibility.current);
    const edges = scenePerimeterVisibility(visibility.current);
    if (walls.current) {
      for (const surface of walls.current.children) surface.visible = visibility.current[surface.name as Wall];
    }
    if (perimeter.current) {
      for (const surface of perimeter.current.children) surface.visible = edges[surface.name as Wall];
    }
  });
  return <>
    <group ref={walls}>
      {WALLS.map((wall) => {
        const slab = sceneWallSlab(wall, size, size.y, size.y / 2);
        return <mesh key={wall} name={wall} raycast={ignoreSceneRaycast} position={slab.position}>
          <boxGeometry args={slab.args} />
          <meshStandardMaterial color={SCENE_ROOM_COLORS.wall} roughness={0.9} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>;
      })}
    </group>
    {/* Shown only when that wall is cut away; walls are presentation, not the room boundary. */}
    <group ref={perimeter}>
      {WALLS.map((wall) => {
        const slab = sceneWallSlab(wall, size, PERIMETER_HEIGHT_M, PERIMETER_HEIGHT_M / 2);
        return <mesh key={wall} name={wall} raycast={ignoreSceneRaycast} position={slab.position} visible={false}>
          <boxGeometry args={slab.args} />
          <meshBasicMaterial color={SCENE_ROOM_COLORS.perimeter} />
        </mesh>;
      })}
    </group>
  </>;
}
