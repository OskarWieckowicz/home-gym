import { z } from "zod";

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

export const PRODUCT_ID_PATTERN = /^product_[a-z0-9]+(?:_[a-z0-9]+)*$/;

const positiveInteger = z.number().int().positive();
const nonNegativeInteger = z.number().int().nonnegative();

const dimensionsSchema = z
  .object({
    widthCm: positiveInteger,
    depthCm: positiveInteger,
    heightCm: positiveInteger,
  })
  .strict();

const clearanceSchema = z
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

export const productSchema = z
  .object({
    id: z.string().regex(PRODUCT_ID_PATTERN),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().trim().min(1),
    brand: z.string().trim().min(1),
    category: z.enum(PRODUCT_CATEGORIES),
    description: z.string().trim().min(1).max(240),
    price: positiveInteger,
    dimensions: dimensionsSchema,
    clearance: clearanceSchema,
    exercises: z.array(z.string().trim().min(1)).min(1),
    trainingGoals: z.array(trainingGoalSchema).min(1),
    muscleGroups: z.array(z.string().trim().min(1)).min(1),
    weightKg: z.number().positive().optional(),
    maximumLoadKg: positiveInteger.optional(),
    requirements: requirementsSchema,
    constraints: z.array(z.string().trim().min(1)).optional(),
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
  );

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type AnchoringFilter = (typeof ANCHORING_FILTER_VALUES)[number];
export { TRAINING_GOALS, type TrainingGoal };
export type Product = z.infer<typeof productSchema>;
