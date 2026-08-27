import {
  PRODUCT_CATEGORIES,
  productSchema,
  type Product,
} from "@/features/catalog/schemas";

const productSeeds = [
  {
    id: "product_northstar_half_rack",
    slug: "northstar-half-rack",
    name: "Northstar Half Rack",
    brand: "Forgewell",
    category: "racks",
    description: "A compact half rack for squats, presses, and pull-ups in a dedicated strength corner.",
    price: 3499,
    dimensions: { widthCm: 122, depthCm: 130, heightCm: 215 },
    clearance: { frontCm: 120, backCm: 15, leftCm: 60, rightCm: 60 },
    exercises: ["back squat", "bench press", "pull-up"],
    trainingGoals: ["strength", "muscle-gain"],
    muscleGroups: ["legs", "chest", "back"],
    weightKg: 86,
    maximumLoadKg: 320,
    requirements: {
      minimumCeilingHeightCm: 230,
      anchoring: "recommended",
      flooring: "protective-mat",
      assembly: "two-person",
    },
    constraints: ["Check ceiling clearance before pull-ups."],
  },
  {
    id: "product_foundry_wall_rack",
    slug: "foundry-wall-rack",
    name: "Foundry Folding Wall Rack",
    brand: "Forgewell",
    category: "racks",
    description: "A folding rack that preserves floor space when a shared room is not being used for training.",
    price: 2899,
    dimensions: { widthCm: 124, depthCm: 62, heightCm: 218 },
    clearance: { frontCm: 140, backCm: 0, leftCm: 55, rightCm: 55 },
    exercises: ["front squat", "overhead press", "rack pull"],
    trainingGoals: ["strength", "general-fitness"],
    muscleGroups: ["legs", "shoulders", "back"],
    weightKg: 58,
    maximumLoadKg: 250,
    requirements: {
      minimumCeilingHeightCm: 228,
      anchoring: "required",
      flooring: "level-hard-surface",
      assembly: "professional",
    },
    constraints: ["Mount only to a structurally suitable wall."],
  },
  {
    id: "product_arc_adjustable_bench",
    slug: "arc-adjustable-bench",
    name: "Arc Adjustable Bench",
    brand: "Morrow Athletics",
    category: "benches",
    description: "A wheeled incline bench with a narrow stored footprint and seven backrest positions.",
    price: 1299,
    dimensions: { widthCm: 66, depthCm: 142, heightCm: 46 },
    clearance: { frontCm: 35, backCm: 35, leftCm: 55, rightCm: 55 },
    exercises: ["bench press", "incline press", "seated curl"],
    trainingGoals: ["strength", "muscle-gain"],
    muscleGroups: ["chest", "shoulders", "arms"],
    weightKg: 31.5,
    maximumLoadKg: 280,
    requirements: { flooring: "level-hard-surface", assembly: "one-person" },
  },
  {
    id: "product_pivot_flat_bench",
    slug: "pivot-flat-bench",
    name: "Pivot Flat Bench",
    brand: "Morrow Athletics",
    category: "benches",
    description: "A stable flat bench sized for dumbbell work and easy upright storage after a session.",
    price: 749,
    dimensions: { widthCm: 58, depthCm: 124, heightCm: 44 },
    clearance: { frontCm: 30, backCm: 30, leftCm: 65, rightCm: 65 },
    exercises: ["dumbbell press", "split squat", "hip thrust"],
    trainingGoals: ["muscle-gain", "general-fitness"],
    muscleGroups: ["chest", "legs", "glutes"],
    weightKg: 18,
    maximumLoadKg: 220,
    requirements: { flooring: "protective-mat", assembly: "one-person" },
  },
  {
    id: "product_current_fold_bike",
    slug: "current-fold-bike",
    name: "Current Fold Bike",
    brand: "Tempo Harbor",
    category: "cardio",
    description: "A quiet folding exercise bike for compact rooms and low-impact conditioning sessions.",
    price: 1699,
    dimensions: { widthCm: 53, depthCm: 98, heightCm: 118 },
    clearance: { frontCm: 45, backCm: 45, leftCm: 35, rightCm: 35 },
    exercises: ["indoor cycling", "interval cycling"],
    trainingGoals: ["conditioning", "general-fitness"],
    muscleGroups: ["legs", "glutes"],
    weightKg: 24.5,
    maximumLoadKg: 130,
    requirements: { flooring: "level-hard-surface", assembly: "one-person" },
    constraints: ["Leave the folding path clear after use."],
  },
  {
    id: "product_rill_compact_rower",
    slug: "rill-compact-rower",
    name: "Rill Compact Rower",
    brand: "Tempo Harbor",
    category: "cardio",
    description: "An upright-storing magnetic rower for full-body conditioning without a permanent long footprint.",
    price: 2399,
    dimensions: { widthCm: 58, depthCm: 184, heightCm: 72 },
    clearance: { frontCm: 60, backCm: 50, leftCm: 35, rightCm: 35 },
    exercises: ["indoor rowing", "rowing intervals"],
    trainingGoals: ["conditioning", "general-fitness"],
    muscleGroups: ["back", "legs", "arms"],
    weightKg: 32,
    maximumLoadKg: 140,
    requirements: { flooring: "level-hard-surface", assembly: "two-person" },
    constraints: ["Use the upright storage latch only on a level floor."],
  },
  {
    id: "product_ironvale_barbell_set",
    slug: "ironvale-barbell-set",
    name: "Ironvale Barbell Set",
    brand: "Kiln Strength",
    category: "weights",
    description: "A 20 kg barbell with 100 kg of bumper plates for foundational strength training.",
    price: 2199,
    dimensions: { widthCm: 220, depthCm: 45, heightCm: 45 },
    clearance: { frontCm: 90, backCm: 90, leftCm: 45, rightCm: 45 },
    exercises: ["deadlift", "back squat", "overhead press"],
    trainingGoals: ["strength", "muscle-gain"],
    muscleGroups: ["legs", "back", "shoulders"],
    weightKg: 120,
    maximumLoadKg: 250,
    requirements: { flooring: "reinforced-floor", assembly: "one-person" },
    constraints: ["Do not drop plates on an unprotected residential floor."],
  },
  {
    id: "product_range_adjustable_dumbbells",
    slug: "range-adjustable-dumbbells",
    name: "Range Adjustable Dumbbells",
    brand: "Kiln Strength",
    category: "weights",
    description: "A space-saving dumbbell pair adjustable from 4 kg to 24 kg per hand.",
    price: 1799,
    dimensions: { widthCm: 48, depthCm: 54, heightCm: 62 },
    clearance: { frontCm: 70, backCm: 20, leftCm: 70, rightCm: 70 },
    exercises: ["goblet squat", "dumbbell row", "shoulder press"],
    trainingGoals: ["strength", "muscle-gain", "general-fitness"],
    muscleGroups: ["legs", "back", "shoulders", "arms"],
    weightKg: 52,
    requirements: { flooring: "protective-mat", assembly: "one-person" },
  },
  {
    id: "product_loop_cable_trainer",
    slug: "loop-cable-trainer",
    name: "Loop Wall Cable Trainer",
    brand: "Lithe Works",
    category: "accessories",
    description: "A slim wall-mounted cable station for accessory strength work and controlled mobility drills.",
    price: 2799,
    dimensions: { widthCm: 62, depthCm: 28, heightCm: 205 },
    clearance: { frontCm: 180, backCm: 0, leftCm: 70, rightCm: 70 },
    exercises: ["cable row", "triceps pressdown", "face pull"],
    trainingGoals: ["muscle-gain", "mobility"],
    muscleGroups: ["back", "arms", "shoulders"],
    weightKg: 74,
    maximumLoadKg: 90,
    requirements: {
      minimumCeilingHeightCm: 215,
      anchoring: "required",
      flooring: "level-hard-surface",
      assembly: "professional",
    },
    constraints: ["Mount only to a load-bearing structure."],
  },
  {
    id: "product_groundwork_mobility_kit",
    slug: "groundwork-mobility-kit",
    name: "Groundwork Mobility Kit",
    brand: "Lithe Works",
    category: "accessories",
    description: "A mat, foam roller, and resistance-band set for warm-ups, recovery, and mobility practice.",
    price: 399,
    dimensions: { widthCm: 22, depthCm: 66, heightCm: 22 },
    clearance: { frontCm: 100, backCm: 100, leftCm: 70, rightCm: 70 },
    exercises: ["band pull-apart", "foam rolling", "mobility flow"],
    trainingGoals: ["mobility", "general-fitness"],
    muscleGroups: ["full body"],
    weightKg: 4.2,
    requirements: { flooring: "protective-mat" },
  },
] satisfies unknown[];

const parsedProducts = productSchema.array().parse(productSeeds);

function assertCatalogInvariants(products: Product[]): void {
  const ids = new Set(products.map(({ id }) => id));
  const slugs = new Set(products.map(({ slug }) => slug));

  if (ids.size !== products.length) throw new Error("Catalog product IDs must be unique.");
  if (slugs.size !== products.length) throw new Error("Catalog product slugs must be unique.");

  const representedCategories = new Set(products.map(({ category }) => category));
  for (const category of PRODUCT_CATEGORIES) {
    if (!representedCategories.has(category)) {
      throw new Error(`Catalog must include the ${category} category.`);
    }
  }
}

assertCatalogInvariants(parsedProducts);

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nestedValue of Object.values(value)) {
      deepFreeze(nestedValue);
    }
    Object.freeze(value);
  }

  return value;
}

export const catalogProducts: readonly Product[] = deepFreeze(parsedProducts);
