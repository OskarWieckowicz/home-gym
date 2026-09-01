import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, Ray, Raycaster, Vector2, Vector3 } from "three";
import { getEffectiveMounting } from "@/features/catalog/queries/catalog";
import type { GymProject } from "@/features/project/schemas/project";
import { productForPlacement } from "../placement-product";
import { equipmentBoxToScene, obstacleToScene, scenePointToPosition, wallElementToScene, type SceneBox } from "./scene-transform";
import { projectRayToFloor, projectRayToRoomWall } from "./scene-targeting";
import type { SceneProjectPointer, SceneProjection } from "./scene-editor-types";
import { ALL_SCENE_WALLS, sceneWallVisibility, type SceneWallVisibility } from "./scene-wall-visibility";

export function scenePickBoxes(project: GymProject): { id: string; box: SceneBox }[] {
  const boxes = project.obstacles.map((item) => ({ id: item.id, box: obstacleToScene(item, project.room) }));
  for (const placement of project.placements) {
    const product = productForPlacement(project, placement);
    if (!product) continue;
    const mounting = getEffectiveMounting(product);
    boxes.push({ id: placement.id, box: equipmentBoxToScene(placement, product.dimensions, project.room,
      mounting.kind === "wall" ? mounting.bottomHeightCm : 0) });
  }
  for (const element of project.wallElements) {
    const horizontal = element.wall === "top" || element.wall === "bottom";
    const position = wallElementToScene(element, project.room);
    boxes.push({ id: element.id, box: {
      position: { ...position, y: position.y + (element.kind === "door" ? -0.15 : 0.3) },
      dimensions: { x: horizontal ? element.widthCm / 100 : 0.12,
        y: element.kind === "door" ? 2.1 : 1.05, z: horizontal ? 0.12 : element.widthCm / 100 },
      rotationY: 0,
    } });
  }
  return boxes;
}

/** Only catalog/domain envelopes participate; assets, walls and overlays cannot steal a hit. */
export function pickSceneEntity(ray: Ray, project: GymProject): string | null {
  let nearest = Infinity;
  let selected: string | null = null;
  for (const { id, box } of scenePickBoxes(project)) {
    const center = new Vector3(box.position.x, box.position.y, box.position.z);
    const size = new Vector3(Math.max(0.12, box.dimensions.x), Math.max(0.025, box.dimensions.y), Math.max(0.12, box.dimensions.z));
    const hit = ray.intersectBox(new Box3().setFromCenterAndSize(center, size), new Vector3());
    if (!hit) continue;
    const distance = hit.distanceTo(ray.origin);
    if (distance < nearest) { nearest = distance; selected = id; }
  }
  return selected;
}

export function projectSceneRay(
  ray: Ray,
  project: GymProject,
  targetKind: "floor" | "wall",
  visibleWalls: SceneWallVisibility = ALL_SCENE_WALLS,
): SceneProjection {
  const hit = targetKind === "wall"
    ? projectRayToRoomWall(ray, project.room, visibleWalls)
    : projectRayToFloor(ray);
  return {
    point: hit ? scenePointToPosition(hit, project.room) : null,
    entityId: pickSceneEntity(ray, project),
  };
}

export function ScenePicking({ projectPointerRef, getProject, targetKind }: {
  readonly projectPointerRef: RefObject<SceneProjectPointer | null>;
  readonly getProject: () => GymProject;
  readonly targetKind: "floor" | "wall";
}) {
  const { camera, gl } = useThree();
  const visibleWalls = useRef(ALL_SCENE_WALLS);
  useFrame(() => { visibleWalls.current = sceneWallVisibility(camera.position, visibleWalls.current); });
  useEffect(() => {
    const raycaster = new Raycaster();
    projectPointerRef.current = (pointer) => {
      const bounds = gl.domElement.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return null;
      camera.updateMatrixWorld();
      raycaster.setFromCamera(new Vector2(
        ((pointer.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((pointer.clientY - bounds.top) / bounds.height) * 2 + 1,
      ), camera);
      const project = getProject();
      return projectSceneRay(raycaster.ray, project, targetKind, visibleWalls.current);
    };
    return () => { projectPointerRef.current = null; };
  }, [camera, gl, getProject, projectPointerRef, targetKind]);
  return null;
}
