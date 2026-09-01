import type { z } from "zod";

import type { ProjectStore } from "@/features/creator/store/project-store";
import { PlacementSuggestionError } from "@/features/project/suggestions/candidate-generation";

import { suggestPlacementsInputSchema } from "./batch-tool-schemas";
import { createRoomToolError } from "./room-tool-results";
import { mapRoomToolInputIssues } from "./room-tool-schemas";
import type { WebMcpExecuteOptions } from "./types";

function validatedHandler<T>(
  tool: "suggest_placements",
  schema: z.ZodType<T>,
  execute: (input: T) => unknown,
) {
  return (input: unknown, options?: WebMcpExecuteOptions) => {
    if (options?.signal?.aborted) {
      return createRoomToolError(tool, "EXECUTION_FAILED", "Tool execution was cancelled.");
    }
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return createRoomToolError(tool, "INVALID_INPUT", "Tool input is invalid.",
        mapRoomToolInputIssues(parsed.error));
    }
    try {
      return execute(parsed.data);
    } catch (error) {
      if (error instanceof PlacementSuggestionError) {
        return createRoomToolError(tool, error.code, error.message);
      }
      return createRoomToolError(tool, "EXECUTION_FAILED", "Tool execution could not be completed.");
    }
  };
}

export function createSuggestPlacementsHandler(store: ProjectStore) {
  return validatedHandler("suggest_placements", suggestPlacementsInputSchema, (input) => {
    const state = store.getState();
    return {
      ok: true,
      tool: "suggest_placements",
      revision: state.revision,
      ...state.suggestPlacements(input),
    };
  });
}
