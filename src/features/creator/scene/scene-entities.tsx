import type { GymProject } from "@/features/project/schemas/project";
import type { SceneEntityAppearance } from "./scene-entity-state";
import { wallElementRotation, wallElementToScene, type SceneBox } from "./scene-transform";

export function SelectionOutline({ box, color }: { readonly box: SceneBox; readonly color: string | null }) {
  if (!color) return null;
  return <mesh position={[box.position.x, box.position.y, box.position.z]} rotation={[0, box.rotationY, 0]} renderOrder={2}>
    <boxGeometry args={[box.dimensions.x + 0.015, box.dimensions.y + 0.015, box.dimensions.z + 0.015]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} toneMapped={false} wireframe depthWrite={false} />
  </mesh>;
}

export function Box({ box, color, opacity = 1, appearance }: {
  readonly box: SceneBox;
  readonly color: string;
  readonly opacity?: number;
  readonly appearance: SceneEntityAppearance;
}) {
  return <mesh position={[box.position.x, box.position.y, box.position.z]} rotation={[0, box.rotationY, 0]}>
      <boxGeometry args={[box.dimensions.x, box.dimensions.y, box.dimensions.z]} />
      <meshStandardMaterial color={appearance.issue ? appearance.color : color} emissive={appearance.emissive} emissiveIntensity={0.2} transparent={opacity < 1} opacity={opacity} roughness={0.8} depthWrite={opacity >= 1} />
  </mesh>;
}

export function UseZoneOverlay({ box, appearance }: { readonly box: SceneBox; readonly appearance: SceneEntityAppearance }) {
  return <mesh position={[box.position.x, box.position.y, box.position.z]} renderOrder={1}>
    <boxGeometry args={[box.dimensions.x, box.dimensions.y, box.dimensions.z]} />
    <meshBasicMaterial color={appearance.overlayColor} depthWrite={false} opacity={appearance.opacity} transparent />
  </mesh>;
}

export function WallMarker({ element, project, appearance }: { readonly element: GymProject["wallElements"][number]; readonly project: GymProject; readonly appearance: SceneEntityAppearance }) {
  const position = wallElementToScene(element, project.room);
  const width = element.widthCm / 100;
  const rotation = wallElementRotation(element);
  const isDoor = element.kind === "door";
  const outlineBox: SceneBox = {
    position: { x: 0, y: isDoor ? -0.15 : 0.3, z: 0.025 },
    dimensions: { x: width + 0.09, y: isDoor ? 2.18 : 1.12, z: 0.09 },
    rotationY: 0,
  };
  if (isDoor) {
    const height = 2.1;
    return <group position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, -0.15, 0]} castShadow><boxGeometry args={[width, height, 0.035]} /><meshStandardMaterial color={appearance.issue ? appearance.color : "#9a5a32"} emissive={appearance.emissive} emissiveIntensity={0.2} transparent opacity={0.72} /></mesh>
      <mesh position={[-width / 2, -0.15, 0.025]}><boxGeometry args={[0.045, height + 0.08, 0.06]} /><meshStandardMaterial color="#78350f" /></mesh>
      <mesh position={[width / 2, -0.15, 0.025]}><boxGeometry args={[0.045, height + 0.08, 0.06]} /><meshStandardMaterial color="#78350f" /></mesh>
      <mesh position={[0, height / 2 - 0.045, 0.025]}><boxGeometry args={[width + 0.08, 0.045, 0.06]} /><meshStandardMaterial color="#78350f" /></mesh>
      <mesh position={[width * 0.3, -0.15, 0.055]}><sphereGeometry args={[0.035, 12, 8]} /><meshStandardMaterial color="#fbbf24" metalness={0.7} /></mesh>
      <SelectionOutline box={outlineBox} color={appearance.outline} />
    </group>;
  }
  const height = 1.05;
  return <group position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
    <mesh position={[0, 0.3, 0]}><boxGeometry args={[width, height, 0.025]} /><meshStandardMaterial color={appearance.issue ? appearance.color : "#67e8f9"} emissive={appearance.emissive} emissiveIntensity={0.2} transparent opacity={0.42} roughness={0.15} /></mesh>
    <mesh position={[-width / 2, 0.3, 0.025]}><boxGeometry args={[0.035, height + 0.06, 0.055]} /><meshStandardMaterial color="#475569" metalness={0.55} /></mesh>
    <mesh position={[width / 2, 0.3, 0.025]}><boxGeometry args={[0.035, height + 0.06, 0.055]} /><meshStandardMaterial color="#475569" metalness={0.55} /></mesh>
    <mesh position={[0, 0.3 + height / 2, 0.025]}><boxGeometry args={[width + 0.07, 0.035, 0.055]} /><meshStandardMaterial color="#475569" metalness={0.55} /></mesh>
    <mesh position={[0, 0.3 - height / 2, 0.025]}><boxGeometry args={[width + 0.07, 0.035, 0.055]} /><meshStandardMaterial color="#475569" metalness={0.55} /></mesh>
    <SelectionOutline box={outlineBox} color={appearance.outline} />
  </group>;
}
