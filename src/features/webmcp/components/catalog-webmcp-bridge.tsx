"use client";

import { registerCatalogTools } from "../register-catalog-tools";
import { useWebMcpBridgeState } from "./use-webmcp-bridge-state";

export function CatalogWebMcpBridge() {
  const state = useWebMcpBridgeState(registerCatalogTools);

  if (state !== "unavailable") return null;

  return (
    <p
      aria-live="polite"
      className="border-b border-line bg-caution-soft px-6 py-2 text-center text-sm text-ink-muted"
      role="status"
    >
      Agent catalog tools are unavailable in this browser. You can still browse and filter
      manually.
    </p>
  );
}
