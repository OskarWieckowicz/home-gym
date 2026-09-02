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

const productId = "product_loop_cable_trainer";
const product = findProductById(productId)!;
const dependencies = { resolveProduct: catalogProductResolver };
const pose = { position: { xCm: 169, zCm: 0 }, rotation: 0 as const };

function placedProject(): GymProject {
  return {
    ...createDefaultProject(),
    ...toProjectItemsAndPlacements([{ id: "placement_loop", productId, ...pose }]),
  };
}

function lowObstacle(heightCm: number): PhysicalObstacle {
  return {
    id: "obstacle_low", name: "Low object", kind: "obstacle", locked: false,
    position: { xCm: 180, zCm: 8 }, rotation: 0,
    dimensions: { widthCm: 10, depthCm: 10, heightCm },
    functionalClearance: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
  };
}

describe("Loop Wall Cable Trainer domain integration", () => {
  it("sits on the floor and still uses wall snapping with a reserved footprint", () => {
    expect(product).toMatchObject({
      placementMode: "floor", price: 700,
      dimensions: { widthCm: 62, depthCm: 28, heightCm: 205 },
      mounting: { kind: "wall", bottomHeightCm: 0, blocksFloor: true },
      requirements: { anchoring: "required", assembly: "professional" },
    });
    expect(getEffectiveRequiredHeightCm(product)).toBe(215);
    expect(searchProducts({ query: "loop wall", anchoring: "required", maxPrice: 700 })).toEqual([product]);
    expect(catalogProductResolver(productId)?.mounting).toEqual(product.mounting);
    expect(productSchema.parse(product).mounting).toEqual({
      kind: "wall", bottomHeightCm: 0, blocksFloor: true,
    });
  });

  it.each([
    [{ xCm: 200, zCm: 10 }, { xCm: 169, zCm: 0 }, 0],
    [{ xCm: 390, zCm: 160 }, { xCm: 372, zCm: 129 }, 90],
    [{ xCm: 200, zCm: 310 }, { xCm: 169, zCm: 292 }, 180],
    [{ xCm: 10, zCm: 160 }, { xCm: 0, zCm: 129 }, 270],
  ] as const)("snaps a manual floor drop at %j to its nearest wall", (point, position, rotation) => {
    const store = createProjectStore(createDefaultProject());
    const command = createPlaceProductCommand(productId, { kind: "floor", position: point }, store.getState().project);
    expect(command).toMatchObject({ ok: true, command: { payload: { productId, position, rotation } } });
    if (!command.ok) throw new Error(command.error);
    expect(store.getState().dispatch(command.command)).toMatchObject({ ok: true, changed: true });
    expect(store.getState().validation.issues.filter(({ code }) => code.startsWith("WALL_MOUNT"))).toEqual([]);
  });

  it("uses the same commands, validation and undo history through WebMCP", () => {
    const initial = { ...createDefaultProject(), obstacles: [lowObstacle(1)], budget: 699 };
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

  it.each([1, 10, 28])("blocks a %s cm obstacle against the column", (heightCm) => {
    const issues = validateProject({ ...placedProject(), obstacles: [lowObstacle(heightCm)] }, dependencies);
    expect(issues).toContainEqual(expect.objectContaining({
      code: "PHYSICAL_COLLISION", entityIds: ["obstacle_low", "placement_loop"],
    }));
  });

  it.each([false, true])("blocks a thin floor mat regardless of placement ordering (reverse=%s)", (reverse) => {
    const placements = [
      { id: "placement_loop", productId, ...pose },
      { id: "placement_mat", productId: "product_groundwork_exercise_mat", position: { xCm: 180, zCm: 20 }, rotation: 0 as const },
    ];
    const project = { ...createDefaultProject(), ...toProjectItemsAndPlacements(reverse ? placements.reverse() : placements) };
    expect(validateProject(project, dependencies)).toContainEqual(expect.objectContaining({
      code: "PHYSICAL_COLLISION", entityIds: ["placement_loop", "placement_mat"],
    }));
  });

  it("rejects suggestions above even a one-centimeter obstacle", () => {
    const suggestions = suggestPlacements({ ...createDefaultProject(), obstacles: [lowObstacle(1)] }, {
      productId, rotations: [0], region: { minXCm: 170, maxXCm: 232, minZCm: 0, maxZCm: 28 },
    }, { ...dependencies, candidateIdPrefix: "loop-collision" });
    expect(suggestions.candidates).toEqual([]);
    expect(suggestions.rejectionReasons.PHYSICAL_COLLISION).toBe(1);
  });

  it.each(["door", "window"] as const)("rejects mounting across a %s", (kind) => {
    const project: GymProject = { ...placedProject(), wallElements: [
      { id: "wall-element_opening", name: kind, kind, wall: "top", offsetCm: 169, widthCm: 62 },
    ] };
    expect(validateProject(project, dependencies)).toContainEqual(expect.objectContaining({
      code: "WALL_MOUNT_OVERLAPS_OPENING", entityIds: ["placement_loop", "wall-element_opening"],
    }));
    if (kind === "door") {
      expect(validateProject(project, dependencies)).toContainEqual(expect.objectContaining({ code: "DOOR_BLOCKED" }));
    }
  });

  it("reports off-wall positions and the explicit ceiling requirement", () => {
    const project = placedProject();
    project.placements[0].position.zCm = 10;
    project.room.heightCm = 214;
    const codes = validateProject(project, dependencies).map(({ code }) => code);
    expect(codes).toContain("WALL_MOUNT_OFF_WALL");
    expect(codes).toContain("CEILING_TOO_LOW");
  });
});
