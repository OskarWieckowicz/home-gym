import { describe, expect, it } from "vitest";

import { findProductById, getEffectiveRequiredHeightCm, searchProducts } from "@/features/catalog/queries/catalog";
import { productSchema } from "@/features/catalog/schemas";
import { createPlaceProductCommand } from "@/features/creator/plan/place-equipment";
import { catalogProductResolver } from "@/features/creator/store/catalog-product-resolver";
import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject, PhysicalObstacle } from "@/features/project/schemas/project";
import { suggestPlacements } from "@/features/project/suggestions/suggest-placements";
import { toProjectItemsAndPlacements } from "@/features/project/validation/test-placed-equipment";
import { validateProject } from "@/features/project/validation/validate-project";
import { createPlaceProductHandler } from "@/features/webmcp/placement-tool-handlers";

const productId = "product_wall_mounted_punching_bag";
const product = findProductById(productId)!;
const dependencies = { resolveProduct: catalogProductResolver };
const pose = { position: { xCm: 170, zCm: 0 }, rotation: 0 as const };

function placedProject(): GymProject {
  return {
    ...createDefaultProject(),
    ...toProjectItemsAndPlacements([{ id: "placement_bag", productId, ...pose }]),
  };
}

function lowObstacle(heightCm: number): PhysicalObstacle {
  return {
    id: "obstacle_low", name: "Low object", kind: "obstacle", locked: false,
    position: { xCm: 180, zCm: 30 }, rotation: 0,
    dimensions: { widthCm: 10, depthCm: 10, heightCm },
  };
}

describe("Wall-Mounted Punching Bag domain integration", () => {
  it("keeps actual hanging height separate from conservative floor reservation", () => {
    expect(product).toMatchObject({
      placementMode: "floor", price: 225,
      dimensions: { widthCm: 60, depthCm: 120, heightCm: 190 },
      mounting: { kind: "wall", bottomHeightCm: 30, blocksFloor: true },
      requirements: { anchoring: "required", assembly: "professional" },
    });
    expect(getEffectiveRequiredHeightCm(product)).toBe(230);
    expect(searchProducts({ query: "punching bag", anchoring: "required", maxPrice: 225 })).toEqual([product]);
    expect(catalogProductResolver(productId)?.mounting).toEqual(product.mounting);
    expect(productSchema.parse(product).mounting?.blocksFloor).toBe(true);
    expect(() => productSchema.parse({ ...product, mounting: { ...product.mounting, blocksFloor: "true" } })).toThrow();
    expect(findProductById("product_anchor_pullup_bar")?.mounting?.blocksFloor).toBeUndefined();
  });

  it.each([
    [{ xCm: 200, zCm: 10 }, { xCm: 170, zCm: 0 }, 0],
    [{ xCm: 390, zCm: 160 }, { xCm: 280, zCm: 130 }, 90],
    [{ xCm: 200, zCm: 310 }, { xCm: 170, zCm: 200 }, 180],
    [{ xCm: 10, zCm: 160 }, { xCm: 0, zCm: 130 }, 270],
  ] as const)("snaps a manual floor drop at %j to its nearest wall", (point, position, rotation) => {
    const store = createProjectStore(createDefaultProject());
    const command = createPlaceProductCommand(productId, { kind: "floor", position: point }, store.getState().project);
    expect(command).toMatchObject({ ok: true, command: { payload: { productId, position, rotation } } });
    if (!command.ok) throw new Error(command.error);
    expect(store.getState().dispatch(command.command)).toMatchObject({ ok: true, changed: true });
    expect(store.getState().validation.issues.filter(({ code }) => code.startsWith("WALL_MOUNT"))).toEqual([]);
  });

  it("uses the same commands, validation and undo history through WebMCP", () => {
    const initial = { ...createDefaultProject(), obstacles: [lowObstacle(1)], budget: 224 };
    const manual = createProjectStore(initial);
    const agent = createProjectStore(initial);
    manual.getState().dispatch({ type: "PRODUCT_PLACED", payload: { productId, ...pose } });
    const result = createPlaceProductHandler(agent)({ productId, ...pose });
    expect(result).toMatchObject({
      ok: true, changed: true,
      placement: { productId, mounting: product.mounting },
    });
    const codes = (store: typeof agent) => store.getState().validation.issues.map(({ code }) => code).sort();
    expect(codes(agent)).toEqual(codes(manual));
    expect(codes(agent)).toContain("PHYSICAL_COLLISION");
    expect(codes(agent)).toContain("BUDGET_EXCEEDED");
    const placed = agent.getState().project;
    expect(placed.projectItems).toHaveLength(1);
    expect(placed.placements).toHaveLength(1);
    expect(agent.getState().undo()).toBe(true);
    expect(agent.getState().project).toEqual(initial);
    expect(agent.getState().redo()).toBe(true);
    expect(agent.getState().project).toEqual(placed);
  });

  it.each([1, 29, 30, 31])("blocks a %s cm obstacle beneath the bag", (heightCm) => {
    const issues = validateProject({ ...placedProject(), obstacles: [lowObstacle(heightCm)] }, dependencies);
    expect(issues).toContainEqual(expect.objectContaining({
      code: "PHYSICAL_COLLISION", entityIds: ["obstacle_low", "placement_bag"],
    }));
  });

  it.each([false, true])("blocks a thin floor mat regardless of placement ordering (reverse=%s)", (reverse) => {
    const placements = [
      { id: "placement_bag", productId, ...pose },
      { id: "placement_mat", productId: "product_groundwork_exercise_mat", position: { xCm: 180, zCm: 20 }, rotation: 0 as const },
    ];
    const project = { ...createDefaultProject(), ...toProjectItemsAndPlacements(reverse ? placements.reverse() : placements) };
    expect(validateProject(project, dependencies)).toContainEqual(expect.objectContaining({
      code: "PHYSICAL_COLLISION", entityIds: ["placement_bag", "placement_mat"],
    }));
  });

  it("blocks a walking corridor and causes suggestion rejection without changing other mounted products", () => {
    const corridor: GymProject = {
      ...createDefaultProject(), room: { widthCm: 180, depthCm: 400, heightCm: 250 },
      wallElements: [
        { id: "wall-element_top", name: "Entry", kind: "door", wall: "top", offsetCm: 45, widthCm: 90 },
        { id: "wall-element_bottom", name: "Exit", kind: "door", wall: "bottom", offsetCm: 45, widthCm: 90 },
      ],
    };
    const placed = { ...corridor, ...toProjectItemsAndPlacements([
      { id: "placement_bag", productId, position: { xCm: 60, zCm: 170 }, rotation: 90 },
    ]) };
    expect(validateProject(placed, dependencies)).toContainEqual(expect.objectContaining({ code: "DOOR_UNREACHABLE" }));
    const overheadDependencies = {
      resolveProduct: (id: string) => {
        const found = catalogProductResolver(id);
        return id === productId && found ? { ...found, mounting: { kind: "wall" as const, bottomHeightCm: 30 } } : found;
      },
    };
    expect(validateProject(placed, overheadDependencies).some(({ code }) => code === "DOOR_UNREACHABLE")).toBe(false);
    const suggestions = suggestPlacements(corridor, {
      productId, rotations: [90], region: { minXCm: 60, maxXCm: 180, minZCm: 170, maxZCm: 230 },
    }, { ...dependencies, candidateIdPrefix: "bag-access" });
    expect(suggestions.candidates).toEqual([]);
    expect(suggestions.rejectionReasons.DOOR_UNREACHABLE).toBe(1);
  });

  it("rejects suggestions above even a one-centimeter obstacle", () => {
    const suggestions = suggestPlacements({ ...createDefaultProject(), obstacles: [lowObstacle(1)] }, {
      productId, rotations: [0], region: { minXCm: 170, maxXCm: 230, minZCm: 0, maxZCm: 120 },
    }, { ...dependencies, candidateIdPrefix: "bag-collision" });
    expect(suggestions.candidates).toEqual([]);
    expect(suggestions.rejectionReasons.PHYSICAL_COLLISION).toBe(1);
  });

  it.each(["door", "window"] as const)("rejects mounting across a %s", (kind) => {
    const project: GymProject = { ...placedProject(), wallElements: [
      { id: "wall-element_opening", name: kind, kind, wall: "top", offsetCm: 170, widthCm: 60 },
    ] };
    expect(validateProject(project, dependencies)).toContainEqual(expect.objectContaining({
      code: "WALL_MOUNT_OVERLAPS_OPENING", entityIds: ["placement_bag", "wall-element_opening"],
    }));
    if (kind === "door") {
      expect(validateProject(project, dependencies)).toContainEqual(expect.objectContaining({ code: "DOOR_BLOCKED" }));
    }
  });

  it("reports off-wall positions and the explicit ceiling requirement", () => {
    const project = placedProject();
    project.placements[0].position.zCm = 10;
    project.room.heightCm = 229;
    const codes = validateProject(project, dependencies).map(({ code }) => code);
    expect(codes).toContain("WALL_MOUNT_OFF_WALL");
    expect(codes).toContain("CEILING_TOO_LOW");
  });
});
