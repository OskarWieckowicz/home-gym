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
): WebMcpBridgeState {
  const [state, setState] = useState<WebMcpBridgeState>("checking");

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    void register(document, controller).then(
      (result) => {
        if (!mounted || result.status === "aborted") return;
        setState(result.status === "ready" ? "ready" : "unavailable");
      },
      () => {
        if (!mounted || controller.signal.aborted) return;
        setState("unavailable");
      },
    );

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [register]);

  return state;
}
