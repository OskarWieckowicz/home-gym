import { z } from "zod";

import { placementSuggestionRequestSchema } from "@/features/project/suggestions/request-schema";

export const suggestPlacementsInputSchema = placementSuggestionRequestSchema;
export const suggestPlacementsJsonSchema = z.toJSONSchema(suggestPlacementsInputSchema, { io: "input" });
