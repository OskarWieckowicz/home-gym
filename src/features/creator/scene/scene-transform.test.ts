import { describe, expect, it } from "vitest";
import { createDefaultProject } from "@/features/project/defaults";
import { obstacleToScene, positionToScene, rotateDimensions, roomToScene, rotationToRadians } from "./scene-transform";

describe("scene transforms", () => {
  const room = createDefaultProject().room;
  it("converts and centers room coordinates in meters", () => {
    expect(roomToScene(room)).toEqual({ x: 4, y: 2.4, z: 3.2 });
    expect(positionToScene({ xCm: 200, zCm: 160 }, room)).toEqual({ x: 0, y: 0, z: 0 });
  });
  it("swaps width and depth for cardinal quarter turns", () => {
    const dimensions = { widthCm: 120, depthCm: 80, heightCm: 200 };
    expect(rotateDimensions(dimensions, 0)).toEqual({ x: 1.2, y: 2, z: 0.8 });
    expect(rotateDimensions(dimensions, 90)).toEqual({ x: 0.8, y: 2, z: 1.2 });
    expect(rotationToRadians(270)).toBeCloseTo((3 * Math.PI) / 2);
  });
  it("places a physical obstacle on the center of its domain footprint", () => {
    const box = obstacleToScene({ id: "obstacle_box", kind: "obstacle", name: "Box", position: { xCm: 50, zCm: 60 }, dimensions: { widthCm: 100, depthCm: 40, heightCm: 200 }, rotation: 90, locked: false }, room);
    expect(box.position).toEqual({ x: -1.3, y: 1, z: -0.5 });
    expect(box.dimensions).toEqual({ x: 0.4, y: 2, z: 1 });
  });

  it("keeps a corner obstacle flush with the room walls", () => {
    const box = obstacleToScene({
      id: "obstacle_corner",
      kind: "obstacle",
      name: "Corner",
      position: { xCm: 0, zCm: 0 },
      dimensions: { widthCm: 100, depthCm: 50, heightCm: 200 },
      rotation: 0,
      locked: false,
    }, room);
    expect(box.position.x - box.dimensions.x / 2).toBeCloseTo(-2);
    expect(box.position.z - box.dimensions.z / 2).toBeCloseTo(-1.6);
    expect(box.position.x + box.dimensions.x / 2).toBeLessThanOrEqual(2);
    expect(box.position.z + box.dimensions.z / 2).toBeLessThanOrEqual(1.6);
  });
});
