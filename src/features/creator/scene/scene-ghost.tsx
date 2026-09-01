import { getEffectiveMounting } from "@/features/catalog/queries/catalog";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import type { Product } from "@/features/catalog/schemas/product";
import type { GymProject, Wall, WallElement } from "@/features/project/schemas/project";
import type { ProjectCommand } from "@/features/project/schemas/project-command";
import { productForPlacement } from "../placement-product";
import { equipmentBoxToScene, equipmentUseZoneToScene, obstacleToScene, roomToScene, sceneWallSlab, wallElementToScene, type PlacementPose, type SceneBox } from "./scene-transform";
import { SelectionOutline } from "./scene-entities";
import { ignoreSceneRaycast } from "./scene-walls";
import { ALL_SCENE_WALLS, sceneWallVisibility } from "./scene-wall-visibility";

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

function equipmentGhost(product: Pick<Product, "dimensions" | "useZone" | "mounting"> | null | undefined, pose: PlacementPose, project: GymProject): SceneBox[] {
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

const WALLS = ["top", "right", "bottom", "left"] as const;

export function sceneWallTargetBoxes(project: GymProject) {
  const size = roomToScene(project.room);
  return WALLS.map((wall) => {
    const slab = sceneWallSlab(wall, size, size.y, size.y / 2);
    return { wall, position: slab.position, dimensions: slab.args };
  });
}

export function SceneWallTargets({ project, active }: { readonly project: GymProject; readonly active: boolean }) {
  const targets = useRef<Group>(null);
  const visibleWalls = useRef(ALL_SCENE_WALLS);
  useFrame(({ camera }) => {
    visibleWalls.current = sceneWallVisibility(camera.position, visibleWalls.current);
    if (!targets.current) return;
    for (const surface of targets.current.children) surface.visible = visibleWalls.current[surface.name as Wall];
  });
  if (!active) return null;
  return <group ref={targets}>{sceneWallTargetBoxes(project).map(({ wall, position, dimensions }) =>
    <mesh key={wall} name={wall} raycast={ignoreSceneRaycast} position={position}>
      <boxGeometry args={dimensions} />
      <meshBasicMaterial color="#7c3aed" transparent opacity={0.14} depthWrite={false}
        polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>)}</group>;
}
