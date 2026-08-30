import type { ProjectStore } from "@/features/creator/store/project-store";

import { createRoomWebMcpTools } from "./register-room-tools";
import { registerToolSet } from "./register-tool-set";
import type { WebMcpTool } from "./types";

const SUMMARY_TOOLS = new Set([
  "get_project_summary",
  "get_project_state",
  "validate_layout",
]);

export function createSummaryWebMcpTools(store: ProjectStore): readonly WebMcpTool[] {
  return createRoomWebMcpTools(store).filter(({ name }) => SUMMARY_TOOLS.has(name));
}

export function registerSummaryTools(
  documentValue: Document,
  controller: AbortController,
  store: ProjectStore,
) {
  return registerToolSet(documentValue, controller, createSummaryWebMcpTools(store));
}
