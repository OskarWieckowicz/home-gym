import { z } from "zod";

import { productIdSchema } from "@/shared/schemas/product-id";
import { centimetersSchema, rotationSchema } from "../schemas/geometry";
import { projectItemSchema } from "../schemas/project";

export const placementSuggestionRegionSchema = z.object({
  minXCm: centimetersSchema,
  minZCm: centimetersSchema,
  maxXCm: centimetersSchema,
  maxZCm: centimetersSchema,
}).strict().describe(
  "Hard candidate search bounds: floor placement origins stay inside the region; wall-mounted final footprints must fit inside it.",
);

export const placementSuggestionStrategySchema = z.enum([
  "balanced",
  "perimeter",
  "open-center",
]).default("balanced").describe(
  "Soft ordering preference applied only after rejection and warning penalties. Balanced preserves open space then favors the perimeter; perimeter favors walls and corners first; open-center prioritizes a contiguous central training area.",
);

const options = {
  rotations: z.array(rotationSchema).min(1).max(4).optional(),
  region: placementSuggestionRegionSchema.optional(),
  strategy: placementSuggestionStrategySchema,
  limit: z.number().int().min(1).max(10).default(3),
};

// Strict alternatives express exclusive references in both Zod and JSON Schema.
export const placementSuggestionRequestSchema = z.union([
  z.object({ productId: productIdSchema, ...options }).strict(),
  z.object({ projectItemId: projectItemSchema.shape.id, ...options }).strict(),
]);

export type PlacementSuggestionRequest = z.input<typeof placementSuggestionRequestSchema>;
export type PlacementSuggestionStrategy = z.output<typeof placementSuggestionStrategySchema>;
