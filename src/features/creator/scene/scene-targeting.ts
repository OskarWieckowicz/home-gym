import type { Room, Wall } from "@/features/project/schemas/project";

import type { PlacementTarget } from "../plan/placement-target";
import { snapCentimeters } from "../plan/plan-transform";
import { scenePointToPosition, type SceneVector3 } from "./scene-transform";

/** A renderer-neutral ray, so targeting stays testable without Three.js. */
export type SceneRay = { readonly origin: SceneVector3; readonly direction: SceneVector3 };

export function projectRayToFloor(ray: SceneRay, heightM = 0): SceneVector3 | null {
  if (Math.abs(ray.direction.y) < 1e-8) return null;
  const distance = (heightM - ray.origin.y) / ray.direction.y;
  if (!Number.isFinite(distance) || distance < 0) return null;
  const point = {
    x: ray.origin.x + distance * ray.direction.x,
    y: heightM,
    z: ray.origin.z + distance * ray.direction.z,
  };
  return Object.values(point).every(Number.isFinite) ? point : null;
}

type VisibleSceneWalls = Readonly<Record<Wall, boolean>>;

/** Project onto the first visible vertical room boundary hit within the wall height. */
export function projectRayToRoomWall(
  ray: SceneRay,
  room: Pick<Room, "widthCm" | "depthCm" | "heightCm">,
  visibleWalls: VisibleSceneWalls,
): SceneVector3 | null {
  const halfWidthM = room.widthCm / 200;
  const halfDepthM = room.depthCm / 200;
  const heightM = room.heightCm / 100;
  const epsilon = 1e-8;
  const boundaries = [
    { wall: "top", axis: "z", value: -halfDepthM, crossLimit: halfWidthM },
    { wall: "right", axis: "x", value: halfWidthM, crossLimit: halfDepthM },
    { wall: "bottom", axis: "z", value: halfDepthM, crossLimit: halfWidthM },
    { wall: "left", axis: "x", value: -halfWidthM, crossLimit: halfDepthM },
  ] as const;
  let nearest: { readonly distance: number; readonly point: SceneVector3 } | null = null;

  for (const boundary of boundaries) {
    if (!visibleWalls[boundary.wall]) continue;
    const direction = ray.direction[boundary.axis];
    if (Math.abs(direction) < epsilon) continue;
    const distance = (boundary.value - ray.origin[boundary.axis]) / direction;
    if (!Number.isFinite(distance) || distance < 0) continue;
    const point = {
      x: ray.origin.x + distance * ray.direction.x,
      y: ray.origin.y + distance * ray.direction.y,
      z: ray.origin.z + distance * ray.direction.z,
    };
    const cross = boundary.axis === "x" ? point.z : point.x;
    if (!Object.values(point).every(Number.isFinite)
      || point.y < -epsilon || point.y > heightM + epsilon
      || cross < -boundary.crossLimit - epsilon || cross > boundary.crossLimit + epsilon) continue;
    if (!nearest || distance < nearest.distance) nearest = { distance, point };
  }

  return nearest?.point ?? null;
}

export function getScenePlacementTarget(
  point: Pick<SceneVector3, "x" | "z"> | null,
  room: Pick<Room, "widthCm" | "depthCm">,
  kind: "floor" | "wall",
  wallToleranceCm = 25,
): PlacementTarget | null {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.z)) return null;
  const position = scenePointToPosition(point, room);
  const { xCm, zCm } = position;
  if (kind === "floor") {
    if (xCm <= 0 || xCm >= room.widthCm || zCm <= 0 || zCm >= room.depthCm) return null;
    return { kind, position: { xCm: snapCentimeters(xCm), zCm: snapCentimeters(zCm) } };
  }
  if (xCm < -wallToleranceCm || xCm > room.widthCm + wallToleranceCm
    || zCm < -wallToleranceCm || zCm > room.depthCm + wallToleranceCm) return null;
  const candidates: { wall: Wall; distance: number; offsetCm: number; lengthCm: number }[] = [
    { wall: "top", distance: Math.abs(zCm), offsetCm: xCm, lengthCm: room.widthCm },
    { wall: "right", distance: Math.abs(room.widthCm - xCm), offsetCm: zCm, lengthCm: room.depthCm },
    { wall: "bottom", distance: Math.abs(room.depthCm - zCm), offsetCm: xCm, lengthCm: room.widthCm },
    { wall: "left", distance: Math.abs(xCm), offsetCm: zCm, lengthCm: room.depthCm },
  ];
  const nearest = candidates.reduce((best, candidate) => candidate.distance < best.distance ? candidate : best);
  if (nearest.distance > wallToleranceCm || nearest.offsetCm < 0 || nearest.offsetCm > nearest.lengthCm) return null;
  return { kind, wall: nearest.wall, offsetCm: snapCentimeters(nearest.offsetCm) };
}
