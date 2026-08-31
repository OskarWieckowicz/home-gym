import { describe, expect, it } from "vitest";
import { Ray, Vector3 } from "three";
import { catalogProducts } from "@/data/products";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject, Wall } from "@/features/project/schemas/project";
import { createProjectStore } from "../store/project-store";
import { pickSceneEntity, scenePickBoxes } from "./scene-picking";
import { positionToScene } from "./scene-transform";

function downward(project: GymProject, xCm: number, zCm: number) {
  const point = positionToScene({ xCm, zCm }, project.room, 600);
  return new Ray(new Vector3(point.x, point.y, point.z), new Vector3(0, -1, 0));
}

describe("asset-independent scene picking", () => {
  it("does not invent floor, wall, lighting, or use-zone picks", () => {
    const project = createDefaultProject();
    expect(scenePickBoxes(project)).toEqual([]);
    expect(pickSceneEntity(downward(project, 200, 160), project)).toBeNull();
    expect(pickSceneEntity(downward(project, 0, 160), project)).toBeNull();
  });

  it.each([0, 90, 180, 270] as const)("uses quarter-turn domain bounds for equipment (%s°), without loaded meshes", (rotation) => {
    const store = createProjectStore(createDefaultProject());
    const result = store.getState().dispatch({ type: "PRODUCT_PLACED", payload: {
      productId: "product_northstar_half_rack", position: { xCm: 30, zCm: 40 }, rotation,
    } });
    expect(result.ok).toBe(true);
    const project = store.getState().project;
    const boxes = scenePickBoxes(project);
    expect(boxes).toHaveLength(1);
    const [{ id, box }] = boxes;
    expect(id).toBe(project.placements[0].id);
    expect(box.rotationY).toBe(0);
    const product = catalogProducts.find((product) => product.id === "product_northstar_half_rack")!;
    const quarter = rotation === 90 || rotation === 270;
    expect(box.dimensions.x).toBeCloseTo((quarter ? product.dimensions.depthCm : product.dimensions.widthCm) / 100);
    expect(box.dimensions.z).toBeCloseTo((quarter ? product.dimensions.widthCm : product.dimensions.depthCm) / 100);
    const ray = new Ray(new Vector3(box.position.x, 6, box.position.z), new Vector3(0, -1, 0));
    expect(pickSceneEntity(ray, project)).toBe(id);
    // Immediately outside the solid, even if within its use-zone overlay, is not equipment.
    ray.origin.x = box.position.x + box.dimensions.x / 2 + 0.02;
    expect(pickSceneEntity(ray, project)).toBeNull();
  });

  it("exposes a selectable unavailable zone independently of a physical obstacle", () => {
    const project: GymProject = { ...createDefaultProject(), obstacles: [
      { id: "obstacle_solid", name: "Solid", kind: "obstacle", locked: false, rotation: 90,
        position: { xCm: 20, zCm: 30 }, dimensions: { widthCm: 100, depthCm: 40, heightCm: 150 } },
      { id: "obstacle_zone", name: "Zone", kind: "unavailable-zone", locked: false, rotation: 0,
        position: { xCm: 200, zCm: 180 }, dimensions: { widthCm: 60, depthCm: 70 } },
    ] };
    expect(scenePickBoxes(project).map((entry) => entry.id)).toEqual(["obstacle_solid", "obstacle_zone"]);
    expect(pickSceneEntity(downward(project, 40, 100), project)).toBe("obstacle_solid");
    expect(pickSceneEntity(downward(project, 70, 50), project)).toBeNull();
    expect(pickSceneEntity(downward(project, 230, 215), project)).toBe("obstacle_zone");
  });

  it("chooses the nearest overlapping physical envelope, not an underlying zone", () => {
    const project: GymProject = { ...createDefaultProject(), obstacles: [
      { id: "obstacle_zone", name: "Zone", kind: "unavailable-zone", locked: false, rotation: 0,
        position: { xCm: 40, zCm: 40 }, dimensions: { widthCm: 120, depthCm: 100 } },
      { id: "obstacle_solid", name: "Solid", kind: "obstacle", locked: false, rotation: 0,
        position: { xCm: 60, zCm: 60 }, dimensions: { widthCm: 50, depthCm: 40, heightCm: 100 } },
    ] };
    expect(pickSceneEntity(downward(project, 80, 80), project)).toBe("obstacle_solid");
    expect(pickSceneEntity(downward(project, 130, 80), project)).toBe("obstacle_zone");
  });

  it.each(((["top", "right", "bottom", "left"] as const).flatMap((wall) =>
    (["door", "window"] as const).map((kind) => ({ wall, kind })))),
  )("retains $kind selection on the $wall wall independently of cutaway rendering", ({ wall, kind }) => {
    const project: GymProject = { ...createDefaultProject(), wallElements: [{
      id: "wall-element_opening", name: "Opening", kind, wall, offsetCm: 60, widthCm: 90,
    }] };
    const [entry] = scenePickBoxes(project);
    const { x, y, z } = entry.box.position;
    const directions: Record<Wall, Vector3> = {
      top: new Vector3(0, 0, -1), right: new Vector3(1, 0, 0),
      bottom: new Vector3(0, 0, 1), left: new Vector3(-1, 0, 0),
    };
    const direction = directions[wall];
    const origin = new Vector3(x, y, z).addScaledVector(direction, -2);
    expect(pickSceneEntity(new Ray(origin, direction), project)).toBe("wall-element_opening");
    expect(project.wallElements).toHaveLength(1);
  });

  it("lifts wall-mounted pick bounds by domain mounting height", () => {
    const product = catalogProducts.find((product) => product.id === "product_anchor_pullup_bar")!;
    expect(product).toBeDefined();
    const store = createProjectStore(createDefaultProject());
    expect(store.getState().dispatch({ type: "PRODUCT_PLACED", payload: {
      productId: product.id, position: { xCm: 80, zCm: 0 }, rotation: 0,
    } }).ok).toBe(true);
    const project = store.getState().project;
    const [{ id, box }] = scenePickBoxes(project);
    if (product.mounting?.kind !== "wall") throw new Error("Expected a mounted catalog product.");
    expect(box.position.y - box.dimensions.y / 2).toBeCloseTo(product.mounting.bottomHeightCm / 100);
    const ray = new Ray(new Vector3(box.position.x, box.position.y, 4), new Vector3(0, 0, -1));
    expect(pickSceneEntity(ray, project)).toBe(id);
    ray.origin.y = 0.1;
    expect(pickSceneEntity(ray, project)).toBeNull();
  });
});
