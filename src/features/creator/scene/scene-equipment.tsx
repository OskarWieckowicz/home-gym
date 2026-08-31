import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import { AssetBoundary } from "./scene-asset-boundary";
import { getEffectiveMounting } from "@/features/catalog/queries/catalog";
import type { GymProject, Placement } from "@/features/project/schemas/project";
import { productForPlacement } from "../placement-product";
import { Box, SelectionOutline } from "./scene-entities";
import { UseZoneOverlay } from "./scene-use-zone";
import type { SceneEntityAppearance } from "./scene-entity-state";
import { equipmentBoxToScene, equipmentUseZoneToScene, placementCenterToScene } from "./scene-transform";
import { equipmentVisualRotation } from "./visual-orientation";
import { getVisualAsset } from "./visual-assets";

function mountBottomHeightCm(project: GymProject, placement: Placement): number {
  const product = productForPlacement(project, placement);
  if (!product) return 0;
  const mounting = getEffectiveMounting(product);
  return mounting.kind === "wall" ? mounting.bottomHeightCm : 0;
}

function EquipmentAsset({ placement, project }: { readonly placement: Placement; readonly project: GymProject }) {
  const product = productForPlacement(project, placement);
  const asset = product ? getVisualAsset(product.id) : undefined;
  const { scene } = useGLTF(asset?.src ?? "");
  const cloned = useMemo(() => scene.clone(), [scene]);
  if (!asset || !product) throw new Error("Invalid visual asset mapping.");
  const position = placementCenterToScene(
    placement,
    product.dimensions,
    project.room,
    mountBottomHeightCm(project, placement),
  );
  // Keep the asset's -Z front aligned with the domain front and its use zone.
  return <primitive object={cloned} position={[position.x, position.y, position.z]} rotation={[0, (equipmentVisualRotation(placement.rotation) * Math.PI) / 180, 0]} scale={asset.scale} />;
}

export function PlacementModel({ placement, project, appearance }: { readonly placement: Placement; readonly project: GymProject; readonly appearance: SceneEntityAppearance }) {
  const product = productForPlacement(project, placement);
  if (!product) return null;
  const box = equipmentBoxToScene(placement, product.dimensions, project.room, mountBottomHeightCm(project, placement));
  const fallback = <Box box={box} color={appearance.color} appearance={appearance} />;
  return <group>
    {appearance.useZoneVisible ? <UseZoneOverlay box={equipmentUseZoneToScene(placement, product, project.room)} appearance={appearance} /> : null}
    <SelectionOutline box={box} color={appearance.outline} />
    {getVisualAsset(product.id) ? <AssetBoundary fallback={fallback}><Suspense fallback={fallback}><EquipmentAsset placement={placement} project={project} /></Suspense></AssetBoundary> : fallback}
  </group>;
}
