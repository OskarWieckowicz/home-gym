import { describe, expect, it } from "vitest";
import { catalogProducts } from "@/data/products";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";
import { sceneSelectionBox } from "./scene-selection-box";
import { WALL_OPENING_INSET_M } from "./scene-transform";

function placedProject(productId: string, rotation: 0 | 90 | 180 | 270 = 0): GymProject {
  return { ...createDefaultProject(),
    projectItems: [{ id: "project-item_focus", productId }],
    placements: [{ locked: false, id: "placement_focus", projectItemId: "project-item_focus", position: { xCm: 30, zCm: 40 }, rotation }],
  };
}

describe("selected entity camera envelope", () => {
  it.each([0, 90, 180, 270] as const)("uses the equipment solid, not its use zone or asset, at %s degrees", (rotation) => {
    const product = catalogProducts.find(({ id }) => id === "product_northstar_half_rack")!;
    const project = placedProject(product.id, rotation);
    const before = structuredClone(project);
    const box = sceneSelectionBox(project, "placement_focus")!;
    const quarterTurn = rotation === 90 || rotation === 270;
    const width = (quarterTurn ? product.dimensions.depthCm : product.dimensions.widthCm) / 100;
    const depth = (quarterTurn ? product.dimensions.widthCm : product.dimensions.depthCm) / 100;
    expect(box.dimensions).toEqual({ x: width, y: product.dimensions.heightCm / 100, z: depth });
    expect(box.position.x).toBeCloseTo(-2 + 0.3 + width / 2);
    expect(box.position.z).toBeCloseTo(-1.6 + 0.4 + depth / 2);
    expect(box.position.y).toBeCloseTo(box.dimensions.y / 2);
    expect(project).toEqual(before);
  });

  it("centers mounted equipment at its raised physical envelope", () => {
    const product = catalogProducts.find(({ id }) => id === "product_anchor_pullup_bar")!;
    const project = placedProject(product.id, 90);
    const box = sceneSelectionBox(project, "placement_focus")!;
    expect(product.mounting?.kind).toBe("wall");
    if (product.mounting?.kind !== "wall") throw new Error("Expected a wall-mounted fixture.");
    expect(box.position.y - box.dimensions.y / 2).toBeCloseTo(product.mounting.bottomHeightCm / 100);
  });

  it("resolves existing legacy purchases through the project catalog", () => {
    const project = placedProject("product_foundry_wall_rack");
    expect(sceneSelectionBox(project, "placement_focus")?.dimensions.y).toBeGreaterThan(1);
    // A missing or unrecognized ID must never fabricate a focus target.
    expect(sceneSelectionBox(project, "placement_missing")).toBeNull();
    const unknown = placedProject("product_nonexistent");
    expect(sceneSelectionBox(unknown, "placement_focus")).toBeNull();
  });

  it("has no focus target for unplaced purchases, accessories, or empty selection", () => {
    const project = { ...placedProject("product_groundwork_foam_roller"), placements: [] };
    expect(sceneSelectionBox(project, "project-item_focus")).toBeNull();
    expect(sceneSelectionBox(project, null)).toBeNull();
    expect(sceneSelectionBox(project, "placement_removed")).toBeNull();
  });

  it("frames rotated obstacles and flat unavailable zones at their domain extents", () => {
    const project: GymProject = { ...createDefaultProject(), obstacles: [
      { id: "obstacle_solid", name: "Solid", kind: "obstacle", locked: false, rotation: 90,
        position: { xCm: 20, zCm: 30 }, dimensions: { widthCm: 100, depthCm: 40, heightCm: 150 } },
      { id: "obstacle_zone", name: "Zone", kind: "unavailable-zone", locked: false, rotation: 90,
        position: { xCm: 200, zCm: 180 }, dimensions: { widthCm: 60, depthCm: 70 } },
    ] };
    const solid = sceneSelectionBox(project, "obstacle_solid")!;
    const zone = sceneSelectionBox(project, "obstacle_zone")!;
    expect(solid.dimensions).toEqual({ x: 0.4, y: 1.5, z: 1 });
    expect(solid.position).toEqual({ x: -1.6, y: 0.75, z: -0.8 });
    expect(zone.dimensions.x).toBeCloseTo(0.7);
    expect(zone.dimensions.z).toBeCloseTo(0.6);
    expect(Math.abs(zone.position.y)).toBeLessThan(0.01);
    expect(zone.dimensions.y).toBeLessThan(0.025);
  });

  it.each((["top", "right", "bottom", "left"] as const).flatMap((wall) =>
    (["door", "window"] as const).map((kind) => ({ wall, kind }))),
  )("includes the displayed $kind frame and inward inset on the $wall wall", ({ wall, kind }) => {
    const project: GymProject = { ...createDefaultProject(), wallElements: [{
      id: "wall-element_focus", name: "Opening", kind, wall, offsetCm: 60, widthCm: 90,
    }] };
    const box = sceneSelectionBox(project, "wall-element_focus")!;
    expect(box.dimensions.x).toBeGreaterThan(0.99);
    expect(box.dimensions.y).toBeGreaterThan(kind === "door" ? 2.18 : 1.12);
    expect(box.position.y).toBeCloseTo(1.2 + (kind === "door" ? -0.15 : 0.3));
    const inset = WALL_OPENING_INSET_M + 0.03;
    if (wall === "top") expect(box.position.z).toBeCloseTo(-1.6 + inset);
    if (wall === "right") expect(box.position.x).toBeCloseTo(2 - inset);
    if (wall === "bottom") expect(box.position.z).toBeCloseTo(1.6 - inset);
    if (wall === "left") expect(box.position.x).toBeCloseTo(-2 + inset);
  });
});
