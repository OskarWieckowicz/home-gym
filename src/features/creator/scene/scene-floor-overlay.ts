import type { SceneVector3 } from "./scene-transform";

type Point = [number, number, number];
const LINE_LIFT_M = 0.003;

export function floorRectanglePoints({ x, z }: SceneVector3): Point[] {
  return [[-x / 2, LINE_LIFT_M, -z / 2], [x / 2, LINE_LIFT_M, -z / 2],
    [x / 2, LINE_LIFT_M, z / 2], [-x / 2, LINE_LIFT_M, z / 2], [-x / 2, LINE_LIFT_M, -z / 2]];
}

/** Clip each diagonal to the rectangle; these strokes never define blocked geometry. */
export function floorHatchSegments({ x, z }: SceneVector3): Point[] {
  const points: Point[] = [];
  const halfWidth = x / 2;
  const halfDepth = z / 2;
  const step = 0.3 * Math.SQRT2;
  const extent = halfWidth + halfDepth;
  for (let offset = Math.ceil(-extent / step) * step; offset < extent; offset += step) {
    const start = Math.max(-halfDepth, -halfWidth - offset);
    const end = Math.min(halfDepth, halfWidth - offset);
    if (end > start) points.push([start + offset, LINE_LIFT_M, start], [end + offset, LINE_LIFT_M, end]);
  }
  return points;
}
