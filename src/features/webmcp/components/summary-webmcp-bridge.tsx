"use client";

import { useCallback } from "react";

import { useProjectStoreApi } from "@/features/creator/store/project-store-context";

import { registerSummaryTools } from "../register-summary-tools";
import { useWebMcpBridgeState } from "./use-webmcp-bridge-state";

export function SummaryWebMcpBridge() {
  const store = useProjectStoreApi();
  const register = useCallback(
    (documentValue: Document, controller: AbortController) =>
      registerSummaryTools(documentValue, controller, store),
    [store],
  );
  const state = useWebMcpBridgeState(register);

  if (state !== "unavailable") return null;

  return (
    <p
      aria-live="polite"
      className="border-b border-line bg-caution-soft px-6 py-2 text-center text-sm text-ink-muted"
      role="status"
    >
      Agent summary tools are unavailable in this browser. You can still review and export
      your project manually.
    </p>
  );
}
