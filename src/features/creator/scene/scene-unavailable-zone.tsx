import { Line } from "@react-three/drei";
import { useMemo } from "react";
import type { SceneEntityAppearance } from "./scene-entity-state";
import { floorHatchSegments, floorRectanglePoints } from "./scene-floor-overlay";
import type { SceneBox } from "./scene-transform";
import { ignoreSceneRaycast } from "./scene-walls";

export function UnavailableZone({ box, appearance }: {
  readonly box: SceneBox;
  readonly appearance: SceneEntityAppearance;
}) {
  const { x, z } = box.dimensions;
  const hatch = useMemo(() => floorHatchSegments({ x, y: 0, z }), [x, z]);
  const color = appearance.issue ? appearance.color : "#596365";
  return <group position={[box.position.x, 0.018, box.position.z]} rotation={[0, box.rotationY, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} raycast={ignoreSceneRaycast}>
      <planeGeometry args={[x, z]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} />
    </mesh>
    <Line points={hatch} segments color={color} lineWidth={1} transparent opacity={0.55}
      depthWrite={false} toneMapped={false} raycast={ignoreSceneRaycast} />
    <Line points={floorRectanglePoints(box.dimensions)} color={appearance.outline ?? color}
      lineWidth={appearance.outline ? 2 : 1} depthWrite={false} toneMapped={false} raycast={ignoreSceneRaycast} />
  </group>;
}
