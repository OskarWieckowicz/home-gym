import { Spherical, Vector3 } from "three";
import type { Room } from "@/features/project/schemas/project";
import { roomToScene, type SceneBox, type SceneVector3 } from "./scene-transform";

// Room framing leaves 6% on each edge; focused items get more surrounding context.
const ROOM_FRAME_FRACTION = 0.88;
const SELECTION_FRAME_FRACTION = 0.72;
const FIT_AZIMUTH = 12 * Math.PI / 180;
const FIT_ELEVATION = 29 * Math.PI / 180;
const WORLD_UP = new Vector3(0, 1, 0);

type ViewCorner = { readonly x: number; readonly y: number; readonly depth: number };
type FrameOptions = { readonly fov: number; readonly aspect: number; readonly fraction: number };

function initialDirection() {
  return new Vector3(Math.sin(FIT_AZIMUTH) * Math.cos(FIT_ELEVATION), Math.sin(FIT_ELEVATION),
    Math.cos(FIT_AZIMUTH) * Math.cos(FIT_ELEVATION));
}

function boxOffsets(box: SceneBox) {
  const corners: Vector3[] = [];
  for (const x of [-box.dimensions.x / 2, box.dimensions.x / 2]) {
    for (const y of [-box.dimensions.y / 2, box.dimensions.y / 2]) {
      for (const z of [-box.dimensions.z / 2, box.dimensions.z / 2]) {
        corners.push(new Vector3(x, y, z).applyAxisAngle(WORLD_UP, box.rotationY));
      }
    }
  }
  return corners;
}

/** Minimum distance where all corners share a feasible camera offset on this axis. */
function axisFitDistance(corners: readonly ViewCorner[], axis: "x" | "y", slope: number) {
  const lower = Math.max(...corners.map((corner) => corner[axis] + slope * corner.depth));
  const upper = Math.min(...corners.map((corner) => corner[axis] - slope * corner.depth));
  return (lower - upper) / (2 * slope);
}

/** Center the perspective silhouette, not the box's world-space midpoint. */
function centeredAxisOffset(corners: readonly ViewCorner[], axis: "x" | "y", distance: number) {
  let low = Math.min(...corners.map((corner) => corner[axis]));
  let high = Math.max(...corners.map((corner) => corner[axis]));
  for (let step = 0; step < 40; step += 1) {
    const midpoint = (low + high) / 2;
    const projected = corners.map((corner) => (corner[axis] - midpoint) / (distance - corner.depth));
    if (Math.min(...projected) + Math.max(...projected) > 0) low = midpoint;
    else high = midpoint;
  }
  return (low + high) / 2;
}

function fitBox(box: SceneBox, direction: Vector3, options: FrameOptions) {
  const right = new Vector3().crossVectors(WORLD_UP, direction).normalize();
  const up = new Vector3().crossVectors(direction, right).normalize();
  const corners = boxOffsets(box).map((corner) => ({
    x: corner.dot(right), y: corner.dot(up), depth: corner.dot(direction),
  }));
  const verticalSlope = Math.tan(options.fov * Math.PI / 360) * options.fraction;
  const horizontalSlope = verticalSlope * options.aspect;
  const distance = Math.max(0.5, Math.max(...corners.map(({ depth }) => depth)) + 0.06,
    axisFitDistance(corners, "x", horizontalSlope), axisFitDistance(corners, "y", verticalSlope));
  const target = new Vector3(box.position.x, box.position.y, box.position.z)
    .addScaledVector(right, centeredAxisOffset(corners, "x", distance))
    .addScaledVector(up, centeredAxisOffset(corners, "y", distance));
  return { target, position: target.clone().addScaledVector(direction, distance), distance };
}

/** Fits and centers all room corners while preserving the chosen viewing direction. */
export function fitSceneCamera(room: Room, kind: "fit" | "top", fov: number, aspect: number) {
  const dimensions = roomToScene(room);
  const direction = kind === "top" ? new Vector3(0, 1, 0.0001).normalize() : initialDirection();
  return fitBox({ position: { x: 0, y: dimensions.y / 2, z: 0 }, dimensions, rotationY: 0 },
    direction, { fov, aspect, fraction: ROOM_FRAME_FRACTION });
}

/** Explicit focus retains an existing usable orbit; it never reads rendered mesh bounds. */
export function fitSceneSelection(box: SceneBox, fov: number, aspect: number, currentDirection: SceneVector3) {
  const direction = new Vector3(currentDirection.x, currentDirection.y, currentDirection.z);
  if (!Number.isFinite(direction.lengthSq()) || direction.lengthSq() < 0.000001) direction.copy(initialDirection());
  const orbit = new Spherical().setFromVector3(direction);
  orbit.radius = 1;
  orbit.phi = Math.max(0.0001, Math.min(Math.PI / 2 - 0.05, orbit.phi));
  direction.setFromSpherical(orbit);
  return fitBox(box, direction, { fov, aspect, fraction: SELECTION_FRAME_FRACTION });
}
