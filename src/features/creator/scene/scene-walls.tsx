import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { Room, Wall } from "@/features/project/schemas/project";
import { roomToScene, SCENE_WALL_THICKNESS_M } from "./scene-transform";
import { ALL_SCENE_WALLS, sceneWallVisibility } from "./scene-wall-visibility";

export const ignoreSceneRaycast = () => undefined;
const WALLS: readonly Wall[] = ["top", "right", "bottom", "left"];

export function SceneWalls({ room }: { readonly room: Room }) {
  const group = useRef<Group>(null);
  const visibility = useRef(ALL_SCENE_WALLS);
  const size = roomToScene(room);
  useFrame(({ camera }) => {
    visibility.current = sceneWallVisibility(camera.position, visibility.current);
    if (group.current) {
      for (const surface of group.current.children) {
        surface.visible = visibility.current[surface.name as Wall];
      }
    }
  });
  return <>
    <group ref={group}>
      {WALLS.map((wall) => {
        const horizontal = wall === "top" || wall === "bottom";
        const sign = wall === "top" || wall === "left" ? -1 : 1;
        return <mesh key={wall} name={wall} raycast={ignoreSceneRaycast}
          position={[horizontal ? 0 : sign * size.x / 2, size.y / 2, horizontal ? sign * size.z / 2 : 0]}>
          <boxGeometry args={horizontal ? [size.x, size.y, SCENE_WALL_THICKNESS_M] : [SCENE_WALL_THICKNESS_M, size.y, size.z]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
        </mesh>;
      })}
    </group>
    {/* Always retained, including top-down: walls are presentation, not the room boundary. */}
    {WALLS.map((wall) => {
      const horizontal = wall === "top" || wall === "bottom";
      const sign = wall === "top" || wall === "left" ? -1 : 1;
      return <mesh key={wall} raycast={ignoreSceneRaycast}
        position={[horizontal ? 0 : sign * size.x / 2, 0.015, horizontal ? sign * size.z / 2 : 0]}>
        <boxGeometry args={horizontal ? [size.x, 0.03, SCENE_WALL_THICKNESS_M] : [SCENE_WALL_THICKNESS_M, 0.03, size.z]} />
        <meshBasicMaterial color="#64748b" />
      </mesh>;
    })}
  </>;
}
