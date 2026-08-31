import { describe, expect, it } from "vitest";
import { catalogProducts } from "./products";
import { searchProducts } from "@/features/catalog/queries/catalog";
import { productSchema } from "@/features/catalog/schemas";

const CATEGORY_SLUGS = {
  racks: ["northstar-half-rack", "harbor-squat-stands", "summit-power-cage", "summit-strength-station"],
  benches: ["arc-adjustable-bench", "pivot-flat-bench", "olympic-bench"],
  "free-weights": [
    "quarry-power-bar", "foundry-bumper-plates", "cairn-iron-plates", "delta-change-plates",
    "range-adjustable-dumbbells", "flex-studio-dumbbells", "forge-kettlebell-16kg",
  ],
  "cable-machines": ["compact-dual-pulley-station", "loop-cable-trainer"],
  "bodyweight-training": ["freestanding-dip-bars", "anchor-pullup-bar"],
  "cardio-conditioning": ["current-fold-bike", "surge-compact-treadmill", "wall-mounted-punching-bag"],
  "mobility-recovery": ["groundwork-foam-roller", "groundwork-exercise-mat", "signal-resistance-bands"],
};

describe("active equipment categories", () => {
  it.each(Object.entries(CATEGORY_SLUGS))("assigns exactly the agreed equipment to %s", (category, slugs) => {
    expect(searchProducts({ category }).map(({ slug }) => slug).sort()).toEqual([...slugs].sort());
  });

  it.each(["barbells", "plates", "dumbbells", "cardio", "accessories"])(
    "rejects the historical %s category in active product records",
    (category) => {
      expect(productSchema.safeParse({ ...catalogProducts[0], category }).success).toBe(false);
    },
  );

  it.each([
    ["Free Weights", "free-weights"],
    ["Cable Machines", "cable-machines"],
    ["Bodyweight Training", "bodyweight-training"],
    ["Cardio & Conditioning", "cardio-conditioning"],
    ["Mobility & Recovery", "mobility-recovery"],
    ["Racks & Stands", "racks"],
  ])("searches the displayed category name %s", (query, category) => {
    expect(searchProducts({ query })).toEqual(searchProducts({ category }));
  });

  it("keeps placement mode and training goals independent from the category", () => {
    const products = searchProducts({ category: "mobility-recovery" });
    expect(products.filter(({ placementMode }) => placementMode === "floor").map(({ slug }) => slug))
      .toEqual(["groundwork-exercise-mat"]);
    expect(searchProducts({ category: "mobility-recovery", trainingGoal: "strength" }).map(({ slug }) => slug))
      .toEqual(["signal-resistance-bands"]);
  });
});
