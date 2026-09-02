import { describe, expect, it } from "vitest";

import { PROJECT_VERSION, type GymProject } from "../schemas/project";
import type { ProductValidationDescriptor } from "../validation/product-validation";
import { measureSpatialQuality, prepareSpatialQuality } from "./spatial-quality";

const candidate: ProductValidationDescriptor = {
  id: "product_candidate",
  price: 1,
  dimensions: { widthCm: 10, depthCm: 10, heightCm: 10 },
  useZone: { frontCm: 10, backCm: 10, leftCm: 10, rightCm: 10 },
};
const existing: ProductValidationDescriptor = {
  id: "product_existing",
  price: 1,
  dimensions: { widthCm: 10, depthCm: 10, heightCm: 10 },
  useZone: { frontCm: 10, backCm: 0, leftCm: 10, rightCm: 0 },
};
const dependencies = {
  resolveProduct: (id: string) => [candidate, existing].find((product) => product.id === id),
};
const compactDependencies = {
  resolveProduct: (id: string) => id === candidate.id
    ? { ...candidate, useZone: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 } }
    : dependencies.resolveProduct(id),
};

function project(widthCm: number, depthCm: number): GymProject {
  return {
    version: PROJECT_VERSION,
    room: { widthCm, depthCm, heightCm: 240 },
    obstacles: [],
    wallElements: [],
    projectItems: [{ id: "project-item_candidate", productId: candidate.id }],
    placements: [],
    budget: 0,
    trainingGoals: [],
  };
}

function applyCandidate(value: GymProject, xCm: number, zCm: number): GymProject {
  return {
    ...value,
    placements: [{
      id: "placement_candidate",
      projectItemId: "project-item_candidate",
      locked: false,
      position: { xCm, zCm },
      rotation: 0,
    }],
  };
}

describe("spatial quality", () => {
  it("uses the complete candidate use zone for exact wall and corner distances", () => {
    const base = project(100, 100);
    const metrics = measureSpatialQuality(
      prepareSpatialQuality(base, dependencies),
      applyCandidate(base, 30, 40),
      dependencies,
      "placement_candidate",
    );

    expect(metrics.perimeterDistanceCm).toBe(20);
    expect(metrics.cornerDistanceCm).toBe(50);
    expect(metrics.furnitureClearanceDistanceCm).toBeNull();
  });

  it("measures avoidance from declared furniture functional footprints", () => {
    const base = project(100, 100);
    base.obstacles = [{
      id: "obstacle_furniture",
      kind: "obstacle",
      name: "Furniture",
      position: { xCm: 70, zCm: 30 },
      dimensions: { widthCm: 10, depthCm: 10, heightCm: 100 },
      functionalClearance: { frontCm: 10, backCm: 10, leftCm: 10, rightCm: 10 },
      rotation: 0,
      locked: false,
    }];
    const metrics = measureSpatialQuality(
      prepareSpatialQuality(base, dependencies),
      applyCandidate(base, 30, 30),
      dependencies,
      "placement_candidate",
    );

    // Candidate use zone ends at x=50; declared furniture clearance starts at x=60.
    expect(metrics.furnitureClearanceDistanceCm).toBe(10);
  });

  it("reserves functional zones and every equipment use zone when measuring fragmentation", () => {
    const base = project(60, 50);
    base.obstacles = [{
      id: "obstacle_partition",
      kind: "obstacle",
      name: "Partition with clearance",
      position: { xCm: 20, zCm: 10 },
      dimensions: { widthCm: 10, depthCm: 30, heightCm: 100 },
      functionalClearance: { frontCm: 10, backCm: 10, leftCm: 0, rightCm: 0 },
      rotation: 0,
      locked: false,
    }];
    base.projectItems.push({ id: "project-item_existing", productId: existing.id });
    base.placements.push({
      id: "placement_existing",
      projectItemId: "project-item_existing",
      locked: false,
      position: { xCm: 40, zCm: 30 },
      rotation: 0,
    });
    const applied = applyCandidate(base, 40, 10);
    const metrics = measureSpatialQuality(
      prepareSpatialQuality(base, dependencies),
      applied,
      dependencies,
      "placement_candidate",
    );

    // The declared clearance makes column 2 a full partition. Equipment use zones
    // reserve the right side, leaving the left 2x5 component largest. On
    // this even grid the lower-index center column is the blocked partition.
    expect(metrics.contiguousFreeAreaCells).toBe(10);
    expect(metrics.centralFreeAreaCells).toBe(0);
  });

  it("chooses the lower-index center on even grids and returns zero when it is blocked", () => {
    const even = project(40, 20);
    even.obstacles = [{
      id: "obstacle_split",
      kind: "unavailable-zone",
      name: "Split",
      position: { xCm: 20, zCm: 0 },
      dimensions: { widthCm: 10, depthCm: 20 },
      rotation: 0,
      locked: false,
    }];
    const evenMetrics = measureSpatialQuality(
      prepareSpatialQuality(even, compactDependencies),
      applyCandidate(even, 30, 0),
      compactDependencies,
      "placement_candidate",
    );
    expect(evenMetrics.contiguousFreeAreaCells).toBe(4);
    expect(evenMetrics.centralFreeAreaCells).toBe(4);

    const odd = project(70, 70);
    odd.obstacles = [{
      id: "obstacle_center",
      kind: "unavailable-zone",
      name: "Center",
      position: { xCm: 30, zCm: 30 },
      dimensions: { widthCm: 10, depthCm: 10 },
      rotation: 0,
      locked: false,
    }];
    const oddMetrics = measureSpatialQuality(
      prepareSpatialQuality(odd, compactDependencies),
      applyCandidate(odd, 10, 10),
      compactDependencies,
      "placement_candidate",
    );
    expect(oddMetrics.centralFreeAreaCells).toBe(0);
  });

  it("is deterministic across repeated calls and structured-cloned projects", () => {
    const base = project(100, 100);
    const applied = applyCandidate(base, 40, 40);
    const first = measureSpatialQuality(
      prepareSpatialQuality(base, dependencies), applied, dependencies, "placement_candidate",
    );
    const second = measureSpatialQuality(
      prepareSpatialQuality(structuredClone(base), dependencies),
      structuredClone(applied),
      dependencies,
      "placement_candidate",
    );

    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});
