"use client";

import { useEffect, useState } from "react";

import { registerCatalogTools } from "../register-catalog-tools";

type BridgeState = "checking" | "ready" | "unavailable";

export function CatalogWebMcpBridge() {
  const [state, setState] = useState<BridgeState>("checking");

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    void registerCatalogTools(document, controller).then((result) => {
      if (!mounted || result.status === "aborted") return;
      setState(result.status === "ready" ? "ready" : "unavailable");
    });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

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
