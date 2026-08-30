import { z } from "zod";

import { PLACEMENT_MODES } from "@/shared/schemas/placement-mode";
import { PRODUCT_ID_PATTERN } from "@/shared/schemas/product-id";
import {
  TRAINING_GOALS,
  trainingGoalSchema,
  type TrainingGoal,
} from "@/shared/schemas/training-goal";

export const PRODUCT_CATEGORIES = [
  "racks",
  "benches",
  "barbells",
  "plates",
  "dumbbells",
  "cardio",
  "accessories",
] as const;

export const ANCHORING_REQUIREMENTS = ["recommended", "required"] as const;
export const ANCHORING_FILTER_VALUES = [
  "none",
  ...ANCHORING_REQUIREMENTS,
] as const;
export const FLOORING_REQUIREMENTS = [
  "protective-mat",
  "level-hard-surface",
  "reinforced-floor",
] as const;
export const ASSEMBLY_REQUIREMENTS = [
  "one-person",
  "two-person",
  "professional",
] as const;

export { PRODUCT_ID_PATTERN, PLACEMENT_MODES };

const positiveInteger = z.number().int().positive();
const nonNegativeInteger = z.number().int().nonnegative();

const dimensionsSchema = z
  .object({
    widthCm: positiveInteger,
    depthCm: positiveInteger,
    heightCm: positiveInteger,
  })
  .strict();

const useZoneSchema = z
  .object({
    frontCm: nonNegativeInteger,
    backCm: nonNegativeInteger,
    leftCm: nonNegativeInteger,
    rightCm: nonNegativeInteger,
  })
  .strict();

const requirementsSchema = z
  .object({
    minimumCeilingHeightCm: positiveInteger.optional(),
    anchoring: z.enum(ANCHORING_REQUIREMENTS).optional(),
    flooring: z.enum(FLOORING_REQUIREMENTS).optional(),
    assembly: z.enum(ASSEMBLY_REQUIREMENTS).optional(),
  })
  .strict();

export const productMountingSchema = z
  .object({
    kind: z.literal("wall"),
    bottomHeightCm: positiveInteger,
    // Reserve the complete footprint for walking and collisions despite elevation.
    blocksFloor: z.boolean().optional(),
  })
  .strict();

export const productSchema = z
  .object({
    id: z.string().regex(PRODUCT_ID_PATTERN),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().trim().min(1),
    brand: z.string().trim().min(1),
    category: z.enum(PRODUCT_CATEGORIES),
    placementMode: z.enum(PLACEMENT_MODES),
    description: z.string().trim().min(1).max(240),
    price: positiveInteger,
    dimensions: dimensionsSchema,
    useZone: useZoneSchema,
    exercises: z.array(z.string().trim().min(1)).min(1),
    trainingGoals: z.array(trainingGoalSchema).min(1),
    muscleGroups: z.array(z.string().trim().min(1)).min(1),
    weightKg: z.number().positive().optional(),
    maximumLoadKg: positiveInteger.optional(),
    requirements: requirementsSchema,
    constraints: z.array(z.string().trim().min(1)).optional(),
    mounting: productMountingSchema.optional(),
  })
  .strict()
  .refine(
    ({ dimensions, requirements }) =>
      requirements.minimumCeilingHeightCm === undefined ||
      requirements.minimumCeilingHeightCm >= dimensions.heightCm,
    {
      message: "Minimum ceiling height cannot be lower than product height.",
      path: ["requirements", "minimumCeilingHeightCm"],
    },
  )
  .refine(
    ({ dimensions, requirements, mounting }) =>
      mounting === undefined ||
      requirements.minimumCeilingHeightCm === undefined ||
      requirements.minimumCeilingHeightCm >=
        mounting.bottomHeightCm + dimensions.heightCm,
    {
      message: "Minimum ceiling height cannot be lower than the mounted product top.",
      path: ["requirements", "minimumCeilingHeightCm"],
    },
  );

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type { PlacementMode } from "@/shared/schemas/placement-mode";
export type AnchoringFilter = (typeof ANCHORING_FILTER_VALUES)[number];
export type ProductMounting = z.infer<typeof productMountingSchema>;
export type EffectiveMounting = ProductMounting | { readonly kind: "floor" };
export { TRAINING_GOALS, type TrainingGoal };
export type Product = z.infer<typeof productSchema>;
