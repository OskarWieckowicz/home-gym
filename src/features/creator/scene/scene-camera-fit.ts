import { Vector3 } from "three";
import type { Room } from "@/features/project/schemas/project";
import { roomToScene } from "./scene-transform";

// A 6% border on each side leaves room for the perimeter and selection outlines.
const FRAME_FRACTION = 0.88;
const FIT_AZIMUTH = 12 * Math.PI / 180;
const FIT_ELEVATION = 29 * Math.PI / 180;

/** Fits the actual room corners, rather than a mostly empty bounding sphere. */
export function fitSceneCamera(room: Room, kind: "fit" | "top", fov: number, aspect: number) {
  const dimensions = roomToScene(room);
  const target = new Vector3(0, kind === "top" ? 0 : dimensions.y / 2, 0);
  const direction = kind === "top"
    ? new Vector3(0, 1, 0.0001).normalize()
    : new Vector3(Math.sin(FIT_AZIMUTH) * Math.cos(FIT_ELEVATION), Math.sin(FIT_ELEVATION), Math.cos(FIT_AZIMUTH) * Math.cos(FIT_ELEVATION));
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), direction).normalize();
  const up = new Vector3().crossVectors(direction, right).normalize();
  const verticalSlope = Math.tan(fov * Math.PI / 360) * FRAME_FRACTION;
  const horizontalSlope = verticalSlope * aspect;
  let distance = 0.5;

  for (const x of [-dimensions.x / 2, dimensions.x / 2]) {
    for (const y of [0, dimensions.y]) {
      for (const z of [-dimensions.z / 2, dimensions.z / 2]) {
        const offset = new Vector3(x, y, z).sub(target);
        const depth = offset.dot(direction);
        // Each corner must fit both frustum axes at its own perspective depth.
        distance = Math.max(distance, depth + Math.abs(offset.dot(right)) / horizontalSlope,
          depth + Math.abs(offset.dot(up)) / verticalSlope, depth + 0.02);
      }
    }
  }

  return { target, position: target.clone().addScaledVector(direction, distance), distance };
}
