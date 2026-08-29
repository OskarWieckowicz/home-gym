import type { Dimensions as Dimensions3D } from "@/features/project/schemas/geometry";
import type { Obstacle, Room, WallElement } from "@/features/project/schemas/project";

export type SceneVector3 = { readonly x: number; readonly y: number; readonly z: number };
export type SceneBox = { readonly position: SceneVector3; readonly dimensions: SceneVector3; readonly rotationY: number };

const CM_TO_M = 0.01;

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

export function obstacleToScene(obstacle: Obstacle, room: Room): SceneBox {
  const quarterTurn = obstacle.rotation === 90 || obstacle.rotation === 270;
  const dimensions = obstacle.kind === "obstacle"
    ? rotateDimensions(obstacle.dimensions, obstacle.rotation)
    : { x: centimetersToMeters(quarterTurn ? obstacle.dimensions.depthCm : obstacle.dimensions.widthCm), y: 0.012, z: centimetersToMeters(quarterTurn ? obstacle.dimensions.widthCm : obstacle.dimensions.depthCm) };
  return {
    position: positionToScene(obstacle.position, room, obstacle.kind === "obstacle" ? obstacle.dimensions.heightCm / 2 : 0.006),
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
