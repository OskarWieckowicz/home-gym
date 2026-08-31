import { Line } from "@react-three/drei";
import type { SceneEntityAppearance } from "./scene-entity-state";
import { floorRectanglePoints } from "./scene-floor-overlay";
import type { SceneBox } from "./scene-transform";
import { ignoreSceneRaycast } from "./scene-walls";

export function UseZoneOverlay({ box, appearance }: {
  readonly box: SceneBox;
  readonly appearance: SceneEntityAppearance;
}) {
  return <group position={[box.position.x, box.position.y + box.dimensions.y / 2, box.position.z]} rotation={[0, box.rotationY, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={1} raycast={ignoreSceneRaycast}>
      <planeGeometry args={[box.dimensions.x, box.dimensions.z]} />
      <meshBasicMaterial color={appearance.overlayColor} depthWrite={false} opacity={appearance.opacity} transparent />
    </mesh>
    <Line points={floorRectanglePoints(box.dimensions)} color={appearance.overlayColor} lineWidth={1} dashed dashSize={0.12} gapSize={0.08}
      transparent opacity={0.8} depthWrite={false} toneMapped={false} raycast={ignoreSceneRaycast} />
  </group>;
}
