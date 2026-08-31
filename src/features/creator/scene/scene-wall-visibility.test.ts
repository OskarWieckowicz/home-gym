import { describe, expect, it } from "vitest";
import { ALL_SCENE_WALLS, scenePerimeterVisibility, sceneWallVisibility } from "./scene-wall-visibility";

describe("camera-relative cutaway", () => {
  it.each([
    [4, 4, ["left", "top"]], [-4, 4, ["right", "top"]],
    [-4, -4, ["right", "bottom"]], [4, -4, ["left", "bottom"]],
  ])("retains the rear walls at corner (%s, %s)", (x, z, visible) => {
    const result = sceneWallVisibility({ x: Number(x), y: 4, z: Number(z) });
    expect(Object.entries(result).filter(([, shown]) => shown).map(([wall]) => wall).sort()).toEqual((visible as string[]).sort());
  });

  it.each([
    [{ x: 0, y: 2, z: 5 }, "bottom"], [{ x: 0, y: 2, z: -5 }, "top"],
    [{ x: 5, y: 2, z: 0 }, "right"], [{ x: -5, y: 2, z: 0 }, "left"],
  ] as const)("cuts away the near wall in a straight-on view", (camera, hidden) => {
    const result = sceneWallVisibility(camera);
    expect(result[hidden]).toBe(false);
    expect(Object.values(result).filter(Boolean)).toHaveLength(3);
  });

  const cameraAt = (degrees: number, radius = 5) => ({
    x: radius * Math.sin(degrees * Math.PI / 180), y: 2,
    z: radius * Math.cos(degrees * Math.PI / 180),
  });

  it.each([0, 90, 180, 270])("keeps only the front wall hidden near axis %s, from either orbit direction", (axis) => {
    for (const direction of [-1, 1]) {
      const corner = sceneWallVisibility(cameraAt(axis + direction * 45));
      expect(Object.values(corner).filter(Boolean)).toHaveLength(2);
      const frontal = sceneWallVisibility(cameraAt(axis + direction * 15), corner);
      expect(frontal).toEqual(sceneWallVisibility(cameraAt(axis)));
      expect(Object.values(frontal).filter(Boolean)).toHaveLength(3);
      expect(sceneWallVisibility(cameraAt(axis), frontal)).toEqual(frontal);
      expect(sceneWallVisibility(cameraAt(axis - direction * 15), frontal)).toEqual(frontal);
    }
  });

  it.each([0, 90, 180, 270])("uses a 25-degree hide and 20-degree return threshold around axis %s", (axis) => {
    for (const direction of [-1, 1]) {
      const front = sceneWallVisibility(cameraAt(axis));
      const before = sceneWallVisibility(cameraAt(axis + direction * 24), front);
      expect(before).toEqual(front);
      const hidden = sceneWallVisibility(cameraAt(axis + direction * 26), before);
      expect(Object.values(hidden).filter(Boolean)).toHaveLength(2);
      expect(sceneWallVisibility(cameraAt(axis + direction * 21), hidden)).toEqual(hidden);
      expect(sceneWallVisibility(cameraAt(axis + direction * 19), hidden)).toEqual(front);
    }
  });

  it("uses angles independently of horizontal camera distance", () => {
    for (const angle of [0, 15, 24, 26, 45, 90, 180, 270]) {
      expect(sceneWallVisibility(cameraAt(angle, 2))).toEqual(sceneWallVisibility(cameraAt(angle, 20)));
    }
  });

  it("hides full walls at top view with a separate stable exit threshold", () => {
    const top = sceneWallVisibility({ x: 0, y: 8, z: 0.0001 });
    expect(Object.values(top).every((visible) => !visible)).toBe(true);
    expect(sceneWallVisibility({ x: 1.5, y: 8, z: 0 }, top)).toEqual(top);
    expect(sceneWallVisibility({ x: 2, y: 8, z: 0 }, top).left).toBe(true);
  });

  it("does not mutate camera or previous presentation state", () => {
    const camera = Object.freeze({ x: 4, y: 5, z: 3 });
    const previous = Object.freeze({ ...ALL_SCENE_WALLS });
    sceneWallVisibility(camera, previous);
    expect(previous).toEqual(ALL_SCENE_WALLS);
    expect(camera).toEqual({ x: 4, y: 5, z: 3 });
  });
});

describe("floor-perimeter stand-in", () => {
  it("keeps a perimeter slab only where its wall is cut away", () => {
    const walls = { top: true, right: false, bottom: true, left: false };
    expect(scenePerimeterVisibility(walls)).toEqual({ top: false, right: true, bottom: false, left: true });
    expect(scenePerimeterVisibility(ALL_SCENE_WALLS)).toEqual({ top: false, right: false, bottom: false, left: false });
    expect(scenePerimeterVisibility({ top: false, right: false, bottom: false, left: false })).toEqual(ALL_SCENE_WALLS);
  });
});
