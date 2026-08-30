import { z } from "zod";

import { MAX_PROJECT_COMMANDS } from "@/features/project/commands/apply-project-commands";
import { projectCommandSchema } from "@/features/project/schemas/project-command";
import { placementSuggestionRequestSchema } from "@/features/project/suggestions/request-schema";

export const layoutChangesInputSchema = z.object({
  changes: z.array(projectCommandSchema).min(1).max(MAX_PROJECT_COMMANDS),
}).strict();

export const suggestPlacementsInputSchema = placementSuggestionRequestSchema;
// Both batch tools advertise this schema. Keep repeated command fields in $defs
// so the complete tool set stays within the browser's descriptor byte budget.
export const layoutChangesJsonSchema = z.toJSONSchema(layoutChangesInputSchema, { reused: "ref" });
export const suggestPlacementsJsonSchema = z.toJSONSchema(suggestPlacementsInputSchema, { io: "input" });
