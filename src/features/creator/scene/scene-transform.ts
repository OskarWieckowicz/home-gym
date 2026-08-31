import { createEquipmentFootprints, type ProductGeometryDescriptor } from "@/features/geometry/equipment-footprints";
import { createRectangleFootprint, type RectangleFootprint } from "@/features/geometry/rectangles";
import type { Dimensions as Dimensions3D, Rotation } from "@/features/project/schemas/geometry";
import type { Obstacle, Room, Wall, WallElement } from "@/features/project/schemas/project";

export type SceneVector3 = { readonly x: number; readonly y: number; readonly z: number };
export type SceneBox = { readonly position: SceneVector3; readonly dimensions: SceneVector3; readonly rotationY: number };
export type PlacementPose = {
  readonly position: { readonly xCm: number; readonly zCm: number };
  readonly rotation: Rotation;
};

const CM_TO_M = 0.01;
const FLOOR_OVERLAY_THICKNESS_M = 0.012;
const USE_ZONE_HEIGHT_CM = 0.6;

export function centimetersToMeters(valueCm: number): number {
  return valueCm * CM_TO_M;
}

export function rotationToRadians(rotation: 0 | 90 | 180 | 270): number {
  return (rotation * Math.PI) / 180;
}

export function rotateDimensions(dimensions: Dimensions3D, rotation: 0 | 90 | 180 | 270): SceneVector3 {
  const quarterTurn = rotation === 90 || rotation === 270;
  return {
    x: centimetersToMeters(quarterTurn ? dimensions.depthCm : dimensions.widthCm),
    y: centimetersToMeters(dimensions.heightCm),
    z: centimetersToMeters(quarterTurn ? dimensions.widthCm : dimensions.depthCm),
  };
}

export function roomToScene(room: Room): SceneVector3 {
  return {
    x: centimetersToMeters(room.widthCm),
    y: centimetersToMeters(room.heightCm),
    z: centimetersToMeters(room.depthCm),
  };
}

export function positionToScene(position: { xCm: number; zCm: number }, room: Room, heightCm = 0): SceneVector3 {
  return {
    x: centimetersToMeters(position.xCm - room.widthCm / 2),
    y: centimetersToMeters(heightCm),
    z: centimetersToMeters(position.zCm - room.depthCm / 2),
  };
}

/** Inverse of positionToScene; returns the pointer coordinate, never an entity min-corner. */
export function scenePointToPosition(
  point: Pick<SceneVector3, "x" | "z">,
  room: Pick<Room, "widthCm" | "depthCm">,
): { xCm: number; zCm: number } {
  return {
    xCm: point.x / CM_TO_M + room.widthCm / 2,
    zCm: point.z / CM_TO_M + room.depthCm / 2,
  };
}

function footprintCenter(footprint: Pick<RectangleFootprint, "minX" | "minZ" | "widthCm" | "depthCm">) {
  return { xCm: footprint.minX + footprint.widthCm / 2, zCm: footprint.minZ + footprint.depthCm / 2 };
}

export function footprintCenterToScene(
  footprint: Pick<RectangleFootprint, "minX" | "minZ" | "widthCm" | "depthCm">,
  room: Room,
  heightCm = 0,
): SceneVector3 {
  return positionToScene(footprintCenter(footprint), room, heightCm);
}

export function placementCenterToScene(
  placement: PlacementPose,
  dimensions: Pick<Dimensions3D, "widthCm" | "depthCm">,
  room: Room,
  heightCm = 0,
): SceneVector3 {
  return footprintCenterToScene(
    createRectangleFootprint(placement.position, dimensions, placement.rotation),
    room,
    heightCm,
  );
}

export function equipmentBoxToScene(
  placement: PlacementPose,
  dimensions: Dimensions3D,
  room: Room,
  bottomHeightCm = 0,
): SceneBox {
  return {
    position: placementCenterToScene(
      placement,
      dimensions,
      room,
      bottomHeightCm + dimensions.heightCm / 2,
    ),
    dimensions: rotateDimensions(dimensions, placement.rotation),
    rotationY: 0,
  };
}

export function equipmentUseZoneToScene(
  placement: PlacementPose,
  product: ProductGeometryDescriptor,
  room: Room,
): SceneBox {
  const { useZone } = createEquipmentFootprints(placement, product);
  return {
    position: footprintCenterToScene(useZone, room, USE_ZONE_HEIGHT_CM),
    dimensions: {
      x: centimetersToMeters(useZone.widthCm),
      y: FLOOR_OVERLAY_THICKNESS_M,
      z: centimetersToMeters(useZone.depthCm),
    },
    rotationY: 0,
  };
}

export function obstacleToScene(obstacle: Obstacle, room: Room): SceneBox {
  const footprint = createRectangleFootprint(obstacle.position, obstacle.dimensions, obstacle.rotation);
  const dimensions = obstacle.kind === "obstacle"
    ? rotateDimensions(obstacle.dimensions, obstacle.rotation)
    : { x: centimetersToMeters(footprint.widthCm), y: FLOOR_OVERLAY_THICKNESS_M, z: centimetersToMeters(footprint.depthCm) };
  return {
    // Domain position is the min-corner; Three.js boxGeometry is centered on mesh.position.
    position: footprintCenterToScene(
      footprint,
      room,
      obstacle.kind === "obstacle" ? obstacle.dimensions.heightCm / 2 : 0.006,
    ),
    dimensions,
    // Dimensions are already rotated above, so the renderer must not rotate the box again.
    rotationY: 0,
  };
}

/** Presentation slab used by SceneWalls; sits entirely outside the room AABB. */
export const SCENE_WALL_THICKNESS_M = 0.035;
/** Local +Z after wallElementRotation; half the 4 cm door leaf plus a gap from the inner face. */
export const WALL_OPENING_INSET_M = 0.023;

/** Inner face on the room AABB; length covers outer corners. */
export function sceneWallSlab(
  wall: Wall,
  size: { readonly x: number; readonly y: number; readonly z: number },
  height: number,
  y: number,
): { readonly position: [number, number, number]; readonly args: [number, number, number] } {
  const horizontal = wall === "top" || wall === "bottom";
  const sign = wall === "top" || wall === "left" ? -1 : 1;
  const offset = SCENE_WALL_THICKNESS_M / 2;
  return {
    position: [
      horizontal ? 0 : sign * (size.x / 2 + offset),
      y,
      horizontal ? sign * (size.z / 2 + offset) : 0,
    ],
    args: horizontal
      ? [size.x + SCENE_WALL_THICKNESS_M * 2, height, SCENE_WALL_THICKNESS_M]
      : [SCENE_WALL_THICKNESS_M, height, size.z + SCENE_WALL_THICKNESS_M * 2],
  };
}

export function wallElementToScene(element: WallElement, room: Room): SceneVector3 {
  const offset = element.offsetCm + element.widthCm / 2;
  switch (element.wall) {
    case "top": return positionToScene({ xCm: offset, zCm: 0 }, room, room.heightCm / 2);
    case "right": return positionToScene({ xCm: room.widthCm, zCm: offset }, room, room.heightCm / 2);
    case "bottom": return positionToScene({ xCm: offset, zCm: room.depthCm }, room, room.heightCm / 2);
    case "left": return positionToScene({ xCm: 0, zCm: offset }, room, room.heightCm / 2);
  }
}

/** Yaw so local +Z faces the room interior on every wall. */
export function wallElementRotation(element: Pick<WallElement, "wall">): number {
  switch (element.wall) {
    case "top": return 0;
    case "right": return -Math.PI / 2;
    case "bottom": return Math.PI;
    case "left": return Math.PI / 2;
  }
}
