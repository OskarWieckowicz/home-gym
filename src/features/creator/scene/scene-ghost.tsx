import { getEffectiveMounting } from "@/features/catalog/queries/catalog";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import type { Product } from "@/features/catalog/schemas/product";
import type { GymProject, WallElement } from "@/features/project/schemas/project";
import type { ProjectCommand } from "@/features/project/schemas/project-command";
import { productForPlacement } from "../placement-product";
import { equipmentBoxToScene, equipmentUseZoneToScene, obstacleToScene, wallElementToScene, type PlacementPose, type SceneBox } from "./scene-transform";
import { SelectionOutline } from "./scene-entities";

function wallGhost(element: WallElement, project: GymProject): SceneBox[] {
  const horizontal = element.wall === "top" || element.wall === "bottom";
  const position = wallElementToScene(element, project.room);
  const dimensions = { x: horizontal ? element.widthCm / 100 : 0.08, y: 0.04, z: horizontal ? 0.08 : element.widthCm / 100 };
  return [{ position: { ...position, y: 0.04 }, dimensions, rotationY: 0 },
    { position, dimensions: { ...dimensions, y: project.room.heightCm / 100 }, rotationY: 0 }];
}

type CommandOf<Type extends ProjectCommand["type"]> = Extract<ProjectCommand, { type: Type }>;

function obstacleUpdateGhost(command: CommandOf<"OBSTACLE_UPDATED">, project: GymProject): SceneBox[] {
  const obstacle = project.obstacles.find((item) => item.id === command.payload.obstacleId);
  if (!obstacle) return [];
  const position = command.payload.patch.position ?? obstacle.position;
  return [obstacleToScene({ ...obstacle, position }, project.room)];
}

function wallUpdateGhost(command: CommandOf<"WALL_ELEMENT_UPDATED">, project: GymProject): SceneBox[] {
  const element = project.wallElements.find((item) => item.id === command.payload.wallElementId);
  return element ? wallGhost({ ...element, ...command.payload.patch }, project) : [];
}

function equipmentGhost(product: Product | null | undefined, pose: PlacementPose, project: GymProject): SceneBox[] {
  if (!product) return [];
  const mounting = getEffectiveMounting(product);
  const bottomHeightCm = mounting.kind === "wall" ? mounting.bottomHeightCm : 0;
  return [equipmentBoxToScene(pose, product.dimensions, project.room, bottomHeightCm),
    equipmentUseZoneToScene(pose, product, project.room)];
}

function projectItemGhost(command: CommandOf<"PROJECT_ITEM_PLACED">, project: GymProject): SceneBox[] {
  const item = project.projectItems.find((item) => item.id === command.payload.projectItemId);
  return equipmentGhost(findProjectProductById(item?.productId ?? ""), command.payload, project);
}

function placementUpdateGhost(command: CommandOf<"PLACEMENT_UPDATED">, project: GymProject): SceneBox[] {
  const placement = project.placements.find((item) => item.id === command.payload.placementId);
  if (!placement) return [];
  return equipmentGhost(productForPlacement(project, placement), { ...placement, ...command.payload.patch }, project);
}

/** Read the candidate command directly; no speculative project/store or asset geometry. */
export function sceneCommandGhost(command: ProjectCommand, project: GymProject): SceneBox[] {
  switch (command.type) {
    case "OBSTACLE_ADDED": return [obstacleToScene({ ...command.payload, id: "preview" }, project.room)];
    case "OBSTACLE_UPDATED": return obstacleUpdateGhost(command, project);
    case "WALL_ELEMENT_ADDED": return wallGhost({ ...command.payload, id: "preview" }, project);
    case "WALL_ELEMENT_UPDATED": return wallUpdateGhost(command, project);
    case "PRODUCT_PLACED": return equipmentGhost(findProjectProductById(command.payload.productId), command.payload, project);
    case "PROJECT_ITEM_PLACED": return projectItemGhost(command, project);
    case "PLACEMENT_UPDATED": return placementUpdateGhost(command, project);
    default: return [];
  }
}

export function SceneGhost({ command, project }: { readonly command: ProjectCommand | null; readonly project: GymProject }) {
  return command && sceneCommandGhost(command, project).map((box, index) =>
    <SelectionOutline key={index} box={box} color="#7c3aed" />);
}

export function SceneWallTargets({ project, active }: { readonly project: GymProject; readonly active: boolean }) {
  if (!active) return null;
  return (["top", "right", "bottom", "left"] as const).map((wall) => {
    const horizontal = wall === "top" || wall === "bottom";
    const sign = wall === "top" || wall === "left" ? -1 : 1;
    return <mesh key={wall} position={[horizontal ? 0 : sign * project.room.widthCm / 200, 0.025, horizontal ? sign * project.room.depthCm / 200 : 0]}>
      <boxGeometry args={horizontal ? [project.room.widthCm / 100, 0.04, 0.18] : [0.18, 0.04, project.room.depthCm / 100]} />
      <meshBasicMaterial color="#7c3aed" transparent opacity={0.6} depthWrite={false} />
    </mesh>;
  });
}
