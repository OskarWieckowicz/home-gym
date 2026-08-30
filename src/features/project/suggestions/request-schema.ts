import { z } from "zod";

import { productIdSchema } from "@/shared/schemas/product-id";
import { centimetersSchema, rotationSchema } from "../schemas/geometry";
import { projectItemSchema } from "../schemas/project";

export const placementSuggestionRegionSchema = z.object({
  minXCm: centimetersSchema,
  minZCm: centimetersSchema,
  maxXCm: centimetersSchema,
  maxZCm: centimetersSchema,
}).strict();

const options = {
  rotations: z.array(rotationSchema).min(1).max(4).optional(),
  region: placementSuggestionRegionSchema.optional(),
  limit: z.number().int().min(1).max(10).default(3),
};

// Strict alternatives express exclusive references in both Zod and JSON Schema.
export const placementSuggestionRequestSchema = z.union([
  z.object({ productId: productIdSchema, ...options }).strict(),
  z.object({ projectItemId: projectItemSchema.shape.id, ...options }).strict(),
]);

export type PlacementSuggestionRequest = z.input<typeof placementSuggestionRequestSchema>;
