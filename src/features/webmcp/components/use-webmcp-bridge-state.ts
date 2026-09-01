"use client";

import { useEffect, useState } from "react";

import type { ToolSetRegistrationResult } from "../register-tool-set";

export type WebMcpRegistration = (
  documentValue: Document,
  controller: AbortController,
) => Promise<ToolSetRegistrationResult>;

export type WebMcpBridgeState = "checking" | "ready" | "unavailable";

export function useWebMcpBridgeState(
  register: WebMcpRegistration,
  onStateChange?: (state: WebMcpBridgeState) => void,
): WebMcpBridgeState {
  const [state, setState] = useState<WebMcpBridgeState>("checking");

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    queueMicrotask(() => {
      if (!mounted) return;
      void register(document, controller).then(
        (result) => {
          if (!mounted || result.status === "aborted") return;
          const next = result.status === "ready" ? "ready" : "unavailable";
          setState(next);
          onStateChange?.(next);
        },
        () => {
          if (!mounted || controller.signal.aborted) return;
          setState("unavailable");
          onStateChange?.("unavailable");
        },
      );
    });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [onStateChange, register]);

  return state;
}
