"use client";

import { useCallback } from "react";

import { useProjectStoreApi } from "@/features/creator/store/project-store-context";

import { registerRoomTools } from "../register-room-tools";
import { useWebMcpBridgeState } from "./use-webmcp-bridge-state";

export function CreatorWebMcpBridge() {
  const store = useProjectStoreApi();
  const register = useCallback(
    (documentValue: Document, controller: AbortController) =>
      registerRoomTools(documentValue, controller, store),
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
      Agent room tools are unavailable in this browser. You can still edit the room manually.
    </p>
  );
}
