import type { z } from "zod";

import type { ProjectStore } from "@/features/creator/store/project-store";
import type { BatchCommandFailure } from "@/features/project/commands/apply-project-commands";
import { scoreCandidate } from "@/features/project/suggestions/candidate-scoring";
import { PlacementSuggestionError } from "@/features/project/suggestions/candidate-generation";

import { layoutChangesInputSchema, suggestPlacementsInputSchema } from "./batch-tool-schemas";
import {
  createRoomToolError,
  serializeMutationBase,
  serializeValidation,
  type RoomToolName,
} from "./room-tool-results";
import { mapRoomToolInputIssues } from "./room-tool-schemas";
import type { WebMcpExecuteOptions } from "./types";

type BatchToolName = Extract<RoomToolName,
  "suggest_placements" | "evaluate_layout_changes" | "apply_layout_changes">;

function validatedHandler<T>(
  tool: BatchToolName,
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

function batchFailure(tool: BatchToolName, result: BatchCommandFailure) {
  return {
    ...createRoomToolError(tool, result.error.code, result.error.message),
    applies: false,
    index: result.error.index,
    commandType: result.error.commandType,
    ...(result.analysis ? { validation: serializeValidation(result.analysis) } : {}),
    ...(result.reasons ? { reasons: [...result.reasons] } : {}),
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

export function createEvaluateLayoutChangesHandler(store: ProjectStore) {
  return validatedHandler("evaluate_layout_changes", layoutChangesInputSchema, ({ changes }) => {
    const state = store.getState();
    const { result } = state.previewBatch(changes);
    if (!result.ok) return {
      ...batchFailure("evaluate_layout_changes", result),
      revision: state.revision,
      validation: null,
      delta: null,
    };
    const scoring = scoreCandidate(result.analysis);
    return {
      ok: true,
      tool: "evaluate_layout_changes",
      revision: state.revision,
      applies: !scoring.rejected,
      index: null,
      reasons: scoring.reasons,
      score: scoring.score,
      validation: serializeValidation(result.analysis),
      delta: {
        errorCount: result.analysis.errorCount - state.validation.errorCount,
        warningCount: result.analysis.warningCount - state.validation.warningCount,
      },
      outcomes: result.outcomes,
    };
  });
}

export function createApplyLayoutChangesHandler(store: ProjectStore) {
  return validatedHandler("apply_layout_changes", layoutChangesInputSchema, ({ changes }) => {
    const result = store.getState().dispatchBatch(changes);
    if (!result.ok) return batchFailure("apply_layout_changes", result);
    return {
      ...serializeMutationBase("apply_layout_changes", result),
      validation: serializeValidation(result.analysis),
      outcomes: result.outcomes,
    };
  });
}
