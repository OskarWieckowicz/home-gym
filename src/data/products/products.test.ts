import { describe, expect, it } from "vitest";

import {
  PRODUCT_CATEGORIES,
  TRAINING_GOALS,
  productSchema,
  type ProductCategory,
} from "@/features/catalog/schemas";

import { catalogProducts } from "./products";
import { parseCatalogSeeds } from "./catalog-validation";

const EXPECTED_CATEGORY_COUNTS: Record<ProductCategory, number> = {
  racks: 4,
  benches: 3,
  "free-weights": 7,
  "cable-machines": 2,
  "bodyweight-training": 2,
  "cardio-conditioning": 3,
  "mobility-recovery": 3,
};

const ORIGINAL_IDENTITIES = [
  ["product_northstar_half_rack", "northstar-half-rack"],
  ["product_arc_adjustable_bench", "arc-adjustable-bench"],
  ["product_pivot_flat_bench", "pivot-flat-bench"],
  ["product_current_fold_bike", "current-fold-bike"],
  ["product_range_adjustable_dumbbells", "range-adjustable-dumbbells"],
  ["product_loop_cable_trainer", "loop-cable-trainer"],
] as const;

function normalized(values: string[]): string[] {
  return values.map((value) => value.trim().toLocaleLowerCase("en-US"));
}

describe("catalogProducts", () => {
  it("contains 24 schema-valid fictional products in the agreed distribution", () => {
    expect(catalogProducts).toHaveLength(24);
    expect(() => productSchema.array().parse(catalogProducts)).not.toThrow();
    expect(catalogProducts.every(({ brand }) => !/nike|adidas|rogue/i.test(brand))).toBe(true);

    const counts = Object.fromEntries(
      PRODUCT_CATEGORIES.map((category) => [
        category,
        catalogProducts.filter((product) => product.category === category).length,
      ]),
    );
    expect(counts).toEqual(EXPECTED_CATEGORY_COUNTS);
  });

  it("preserves the remaining original IDs and slugs while retiring weights", () => {
    for (const [id, slug] of ORIGINAL_IDENTITIES) {
      expect(catalogProducts.find((product) => product.id === id)?.slug).toBe(slug);
    }
    expect(catalogProducts.some(({ category }) => category === ("weights" as ProductCategory))).toBe(
      false,
    );
  });

  it("uses unique identities, names, and per-product taxonomy values", () => {
    expect(new Set(catalogProducts.map(({ id }) => id))).toHaveLength(catalogProducts.length);
    expect(new Set(catalogProducts.map(({ slug }) => slug))).toHaveLength(catalogProducts.length);
    expect(
      new Set(catalogProducts.map(({ brand, name }) => `${brand}/${name}`.toLocaleLowerCase("en-US"))),
    ).toHaveLength(catalogProducts.length);

    for (const product of catalogProducts) {
      expect(new Set(normalized(product.exercises))).toHaveLength(product.exercises.length);
      expect(new Set(normalized(product.trainingGoals))).toHaveLength(product.trainingGoals.length);
      expect(new Set(normalized(product.muscleGroups))).toHaveLength(product.muscleGroups.length);
    }
  });

  it("rejects invalid category seeds at the central parsing boundary", () => {
    const invalidSeeds = catalogProducts.map((product, index) =>
      index === 0 ? { ...product, category: "weights" } : product,
    );

    expect(() => parseCatalogSeeds(invalidSeeds)).toThrow();
  });

  it("rejects duplicate normalized values inside a product", () => {
    const invalidSeeds = catalogProducts.map((product, index) =>
      index === 0
        ? { ...product, exercises: [product.exercises[0], ` ${product.exercises[0].toUpperCase()} `] }
        : product,
    );

    expect(() => parseCatalogSeeds(invalidSeeds)).toThrow(/Exercises must be unique/);
  });

  it("declares explicit placement modes and two selection-only accessories", () => {
    expect(catalogProducts.every((product) => product.placementMode === "floor" || product.placementMode === "selection-only")).toBe(true);
    const selectionOnly = catalogProducts.filter(({ placementMode }) => placementMode === "selection-only");
    expect(selectionOnly).toEqual([
      expect.objectContaining({
        id: "product_groundwork_foam_roller",
        placementMode: "selection-only",
      }),
      expect.objectContaining({
        id: "product_signal_resistance_bands",
        placementMode: "selection-only",
      }),
    ]);
    expect(catalogProducts.filter(({ placementMode }) => placementMode === "floor")).toHaveLength(22);
  });

  it("covers every training goal across multiple equipment categories", () => {
    for (const goal of TRAINING_GOALS) {
      const categories = new Set(
        catalogProducts
          .filter(({ trainingGoals }) => trainingGoals.includes(goal))
          .map(({ category }) => category),
      );
      expect(categories.size, goal).toBeGreaterThan(1);
    }
  });

  it("supports a stable mixed strength and compact-cardio bundle below $2,500", () => {
    const bundleIds = [
      "product_northstar_half_rack",
      "product_arc_adjustable_bench",
      "product_quarry_power_bar",
      "product_cairn_iron_plates",
      "product_current_fold_bike",
    ];
    const bundle = bundleIds.map((id) => catalogProducts.find((product) => product.id === id));

    expect(bundle.every(Boolean)).toBe(true);
    expect(bundle.reduce((sum, product) => sum + (product?.price ?? 0), 0)).toBeLessThanOrEqual(2_500);
    expect(bundle.at(-1)?.dimensions.depthCm).toBeLessThan(100);
  });

  it("varies price, footprint, height, ceiling, and anchoring tradeoffs", () => {
    expect(Math.min(...catalogProducts.map(({ price }) => price))).toBeLessThan(250);
    expect(Math.max(...catalogProducts.map(({ price }) => price))).toBeGreaterThan(2_000);
    expect(new Set(catalogProducts.map(({ dimensions }) => dimensions.widthCm)).size).toBeGreaterThan(20);
    expect(catalogProducts.some(({ requirements }) => requirements.minimumCeilingHeightCm)).toBe(true);
    expect(catalogProducts.some(({ requirements }) => requirements.anchoring === "recommended")).toBe(true);
    expect(catalogProducts.some(({ requirements }) => requirements.anchoring === "required")).toBe(true);
    expect(catalogProducts.some(({ requirements }) => requirements.anchoring === undefined)).toBe(true);
  });

  it("deep-freezes every parsed product", () => {
    expect(Object.isFrozen(catalogProducts)).toBe(true);
    for (const product of catalogProducts) {
      expect(Object.isFrozen(product)).toBe(true);
      expect(Object.isFrozen(product.dimensions)).toBe(true);
      expect(Object.isFrozen(product.useZone)).toBe(true);
      expect(Object.isFrozen(product.trainingGoals)).toBe(true);
      expect(Object.isFrozen(product.requirements)).toBe(true);
    }
    expect(() => {
      catalogProducts[0].dimensions.widthCm = 1;
    }).toThrow();
  });
});
