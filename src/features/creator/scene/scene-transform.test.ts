import { describe, expect, it } from "vitest";
import { createDefaultProject } from "@/features/project/defaults";
import {
  equipmentBoxToScene,
  equipmentUseZoneToScene,
  obstacleToScene,
  placementCenterToScene,
  positionToScene,
  rotateDimensions,
  roomToScene,
  rotationToRadians,
  SCENE_WALL_THICKNESS_M,
  scenePointToPosition,
  WALL_OPENING_INSET_M,
  wallElementRotation,
} from "./scene-transform";

describe("scene transforms", () => {
  const room = createDefaultProject().room;
  it("converts and centers room coordinates in meters", () => {
    expect(roomToScene(room)).toEqual({ x: 4, y: 2.4, z: 3.2 });
    expect(positionToScene({ xCm: 200, zCm: 160 }, room)).toEqual({ x: 0, y: 0, z: 0 });
  });
  it.each([{ xCm: 0, zCm: 0 }, { xCm: 400, zCm: 320 }, { xCm: 57, zCm: 123 }])(
    "round-trips domain points in a non-square room without footprint centering: %o", (position) => {
      const actual = scenePointToPosition(positionToScene(position, room, 100), room);
      expect(actual.xCm).toBeCloseTo(position.xCm);
      expect(actual.zCm).toBeCloseTo(position.zCm);
    },
  );
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

  it("places equipment solids on the center of the domain footprint", () => {
    const box = equipmentBoxToScene(
      { position: { xCm: 0, zCm: 0 }, rotation: 0 },
      { widthCm: 100, depthCm: 80, heightCm: 200 },
      room,
    );
    expect(box.position).toEqual({ x: -1.5, y: 1, z: -1.2 });
    expect(box.dimensions).toEqual({ x: 1, y: 2, z: 0.8 });
    expect(box.position.x - box.dimensions.x / 2).toBeCloseTo(-2);
    expect(box.position.z - box.dimensions.z / 2).toBeCloseTo(-1.6);
  });

  it("keeps a wall-flush rotated equipment solid inside the room AABB", () => {
    const box = equipmentBoxToScene(
      { position: { xCm: 0, zCm: 0 }, rotation: 90 },
      { widthCm: 100, depthCm: 40, heightCm: 200 },
      room,
    );
    expect(box.dimensions).toEqual({ x: 0.4, y: 2, z: 1 });
    expect(box.position.x - box.dimensions.x / 2).toBeCloseTo(-2);
    expect(box.position.z - box.dimensions.z / 2).toBeCloseTo(-1.6);
  });

  it("lifts a mounted solid and asset origin while keeping the use-zone overlay on the floor", () => {
    const placement = { position: { xCm: 246, zCm: 80 }, rotation: 90 as const };
    const dimensions = { widthCm: 112, depthCm: 54, heightCm: 38 };
    const product = {
      dimensions: { widthCm: 112, depthCm: 54 },
      useZone: { frontCm: 70, backCm: 0, leftCm: 30, rightCm: 30 },
    };
    const solid = equipmentBoxToScene(placement, dimensions, room, 195);
    const origin = placementCenterToScene(placement, dimensions, room, 195);
    const overlay = equipmentUseZoneToScene(placement, product, room);

    expect(solid.position.y).toBeCloseTo(2.14);
    expect(origin.y).toBeCloseTo(1.95);
    expect(overlay.position.y).toBeCloseTo(0.006);
  });

  it("anchors generated equipment meshes at the same footprint center as the catalog solid", () => {
    const placement = { position: { xCm: 35, zCm: 50 }, rotation: 0 as const };
    const dimensions = { widthCm: 66, depthCm: 142, heightCm: 46 };
    const solid = equipmentBoxToScene(placement, dimensions, room);
    const mesh = placementCenterToScene(placement, dimensions, room);
    expect(mesh.x).toBeCloseTo(solid.position.x);
    expect(mesh.z).toBeCloseTo(solid.position.z);
    expect(mesh.y).toBe(0);
  });

  it("draws a use-zone overlay that keeps the physical gap to the wall", () => {
    const placement = { position: { xCm: 35, zCm: 20 }, rotation: 0 as const };
    const product = {
      dimensions: { widthCm: 66, depthCm: 142 },
      useZone: { frontCm: 20, backCm: 20, leftCm: 35, rightCm: 35 },
    };
    const solid = equipmentBoxToScene(placement, { ...product.dimensions, heightCm: 46 }, room);
    const overlay = equipmentUseZoneToScene(placement, product, room);
    expect(overlay.position.x - overlay.dimensions.x / 2).toBeCloseTo(-2);
    expect(solid.position.x - solid.dimensions.x / 2).toBeCloseTo(-1.65);
    expect(overlay.dimensions.x).toBeGreaterThan(solid.dimensions.x);
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

  it.each([
    ["top", { x: 0, z: 1 }],
    ["right", { x: -1, z: 0 }],
    ["bottom", { x: 0, z: -1 }],
    ["left", { x: 1, z: 0 }],
  ] as const)("faces %s openings into the room along local +Z", (wall, inward) => {
    const yaw = wallElementRotation({ wall });
    expect(Math.sin(yaw)).toBeCloseTo(inward.x);
    expect(Math.cos(yaw)).toBeCloseTo(inward.z);
  });

  it("keeps openings off the wall slab so they cannot z-fight", () => {
    expect(WALL_OPENING_INSET_M).toBeGreaterThan(SCENE_WALL_THICKNESS_M / 2);
  });
});
