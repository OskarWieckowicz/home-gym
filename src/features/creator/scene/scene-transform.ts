import { createEquipmentFootprints, type ProductGeometryDescriptor } from "@/features/geometry/equipment-footprints";
import { createRectangleFootprint, type RectangleFootprint } from "@/features/geometry/rectangles";
import type { Dimensions as Dimensions3D, Rotation } from "@/features/project/schemas/geometry";
import type { Obstacle, Room, WallElement } from "@/features/project/schemas/project";

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
): SceneBox {
  return {
    position: placementCenterToScene(placement, dimensions, room, dimensions.heightCm / 2),
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

export function wallElementToScene(element: WallElement, room: Room): SceneVector3 {
  const offset = element.offsetCm + element.widthCm / 2;
  switch (element.wall) {
    case "top": return positionToScene({ xCm: offset, zCm: 0 }, room, room.heightCm / 2);
    case "right": return positionToScene({ xCm: room.widthCm, zCm: offset }, room, room.heightCm / 2);
    case "bottom": return positionToScene({ xCm: offset, zCm: room.depthCm }, room, room.heightCm / 2);
    case "left": return positionToScene({ xCm: 0, zCm: offset }, room, room.heightCm / 2);
  }
}

export function wallElementRotation(element: WallElement): number {
  return element.wall === "left" || element.wall === "right" ? Math.PI / 2 : 0;
}
