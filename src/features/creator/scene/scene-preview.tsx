"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Component, Suspense, useMemo, type ErrorInfo, type ReactNode } from "react";
import { PCFShadowMap } from "three";
import type { GymProject, Placement } from "@/features/project/schemas/project";
import { findProductById, getEffectiveMounting } from "@/features/catalog/queries/catalog";
import { getVisualAsset } from "./visual-assets";
import {
  equipmentBoxToScene,
  equipmentUseZoneToScene,
  obstacleToScene,
  placementCenterToScene,
  roomToScene,
  wallElementRotation,
  wallElementToScene,
  type SceneBox,
} from "./scene-transform";

const WALL_OPACITY = 0.32;
const FLOOR_RENDER_OFFSET = -0.003;

type ScenePreviewProps = { readonly project: GymProject };
type AssetBoundaryProps = { readonly fallback: ReactNode; readonly children: ReactNode };
type AssetBoundaryState = { readonly failed: boolean };

class AssetBoundary extends Component<AssetBoundaryProps, AssetBoundaryState> {
  state: AssetBoundaryState = { failed: false };
  static getDerivedStateFromError(): AssetBoundaryState { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.warn("3D asset failed; using catalog solid.", error, info.componentStack); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Box({ box, color, opacity = 1 }: { readonly box: SceneBox; readonly color: string; readonly opacity?: number }) {
  return <mesh position={[box.position.x, box.position.y, box.position.z]} rotation={[0, box.rotationY, 0]}>
    <boxGeometry args={[box.dimensions.x, box.dimensions.y, box.dimensions.z]} />
    <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.8} depthWrite={opacity >= 1} />
  </mesh>;
}

function UseZoneOverlay({ box }: { readonly box: SceneBox }) {
  return <mesh position={[box.position.x, box.position.y, box.position.z]} renderOrder={1}>
    <boxGeometry args={[box.dimensions.x, box.dimensions.y, box.dimensions.z]} />
    <meshBasicMaterial color="#3b82f6" depthWrite={false} opacity={0.22} transparent />
  </mesh>;
}

function mountBottomHeightCm(productId: string): number {
  const product = findProductById(productId);
  if (!product) return 0;
  const mounting = getEffectiveMounting(product);
  return mounting.kind === "wall" ? mounting.bottomHeightCm : 0;
}

function EquipmentAsset({ placement, project }: { readonly placement: Placement; readonly project: GymProject }) {
  const asset = getVisualAsset(placement.productId);
  const { scene } = useGLTF(asset?.src ?? "");
  const cloned = useMemo(() => scene.clone(), [scene]);
  const dimensions = findProductById(placement.productId)?.dimensions;
  if (!asset || !dimensions) throw new Error("Invalid visual asset mapping.");
  const position = placementCenterToScene(
    placement,
    dimensions,
    project.room,
    mountBottomHeightCm(placement.productId),
  );
  // The GLB is authored with a floor pivot at the envelope center and negative-Z forward.
  return <primitive object={cloned} position={[position.x, position.y, position.z]} rotation={[0, (placement.rotation * Math.PI) / 180, 0]} scale={asset.scale} />;
}

function PlacementModel({ placement, project }: { readonly placement: Placement; readonly project: GymProject }) {
  const product = findProductById(placement.productId);
  if (!product) return null;
  const fallback = <Box box={equipmentBoxToScene(placement, product.dimensions, project.room, mountBottomHeightCm(product.id))} color="#64748b" />;
  return <group>
    <UseZoneOverlay box={equipmentUseZoneToScene(placement, product, project.room)} />
    {getVisualAsset(placement.productId) ? <AssetBoundary fallback={fallback}><Suspense fallback={fallback}><EquipmentAsset placement={placement} project={project} /></Suspense></AssetBoundary> : fallback}
  </group>;
}

function WallMarker({ element, project }: { readonly element: GymProject["wallElements"][number]; readonly project: GymProject }) {
  const position = wallElementToScene(element, project.room);
  const width = element.widthCm / 100;
  const rotation = wallElementRotation(element);
  if (element.kind === "door") {
    const height = 2.1;
    return <group position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, -0.15, 0]} castShadow><boxGeometry args={[width, height, 0.035]} /><meshStandardMaterial color="#9a5a32" transparent opacity={0.72} /></mesh>
      <mesh position={[-width / 2, -0.15, 0.025]}><boxGeometry args={[0.045, height + 0.08, 0.06]} /><meshStandardMaterial color="#78350f" /></mesh>
      <mesh position={[width / 2, -0.15, 0.025]}><boxGeometry args={[0.045, height + 0.08, 0.06]} /><meshStandardMaterial color="#78350f" /></mesh>
      <mesh position={[0, height / 2 - 0.045, 0.025]}><boxGeometry args={[width + 0.08, 0.045, 0.06]} /><meshStandardMaterial color="#78350f" /></mesh>
      <mesh position={[width * 0.3, -0.15, 0.055]}><sphereGeometry args={[0.035, 12, 8]} /><meshStandardMaterial color="#fbbf24" metalness={0.7} /></mesh>
    </group>;
  }
  const height = 1.05;
  return <group position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
    <mesh position={[0, 0.3, 0]}><boxGeometry args={[width, height, 0.025]} /><meshStandardMaterial color="#67e8f9" transparent opacity={0.42} roughness={0.15} /></mesh>
    <mesh position={[-width / 2, 0.3, 0.025]}><boxGeometry args={[0.035, height + 0.06, 0.055]} /><meshStandardMaterial color="#475569" metalness={0.55} /></mesh>
    <mesh position={[width / 2, 0.3, 0.025]}><boxGeometry args={[0.035, height + 0.06, 0.055]} /><meshStandardMaterial color="#475569" metalness={0.55} /></mesh>
    <mesh position={[0, 0.3 + height / 2, 0.025]}><boxGeometry args={[width + 0.07, 0.035, 0.055]} /><meshStandardMaterial color="#475569" metalness={0.55} /></mesh>
    <mesh position={[0, 0.3 - height / 2, 0.025]}><boxGeometry args={[width + 0.07, 0.035, 0.055]} /><meshStandardMaterial color="#475569" metalness={0.55} /></mesh>
  </group>;
}

function SceneContents({ project }: ScenePreviewProps) {
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
    {project.obstacles.map((obstacle) => <Box key={obstacle.id} box={obstacleToScene(obstacle, project.room)} color={obstacle.kind === "obstacle" ? "#475569" : "#f59e0b"} opacity={obstacle.kind === "obstacle" ? 1 : 0.35} />)}
    {project.wallElements.map((element) => <WallMarker element={element} key={element.id} project={project} />)}
    {project.placements.map((placement) => <PlacementModel key={placement.id} placement={placement} project={project} />)}
  </>;
}

export function ScenePreview({ project }: ScenePreviewProps) {
  return <section className="creator-scene-shell" aria-labelledby="scene-title">
    <div className="creator-plan-heading"><div><h2 id="scene-title">3D room preview</h2><p>Read-only spatial review. Orbit and zoom to inspect the shared room.</p></div><span>{project.room.widthCm} × {project.room.depthCm} cm</span></div>
    <div className="creator-scene-canvas" role="img" aria-label="Navigable 3D room preview">
      <Canvas camera={{ position: [4.8, 4.4, 5.2], fov: 45 }} dpr={[1, 1.5]} shadows={{ type: PCFShadowMap }}>
        <SceneContents project={project} />
        <OrbitControls enablePan={false} minDistance={2} maxDistance={12} target={[0, 0.8, 0]} />
      </Canvas>
    </div>
  </section>;
}

useGLTF.preload("/assets/squat-rack.glb");
