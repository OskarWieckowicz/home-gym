// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { WebMcpExecutionEvent } from "../execution-activity";
import {
  WebMcpActivityProvider,
  useWebMcpActivityRecorder,
} from "./webmcp-activity-context";
import { WebMcpActivityPanel, WebMcpActivityTrigger } from "./webmcp-activity-panel";

function RecorderProbe({ onReady }: {
  readonly onReady: (recorder: ReturnType<typeof useWebMcpActivityRecorder>) => void;
}) {
  const recorder = useWebMcpActivityRecorder();
  useEffect(() => onReady(recorder), [onReady, recorder]);
  return null;
}

function renderActivity() {
  const capture = vi.fn();
  const view = render(
    <WebMcpActivityProvider>
      <WebMcpActivityTrigger />
      <WebMcpActivityPanel />
      <RecorderProbe onReady={capture} />
    </WebMcpActivityProvider>,
  );
  return {
    ...view,
    recorder: () => capture.mock.lastCall?.[0] as ReturnType<typeof useWebMcpActivityRecorder>,
  };
}

function started(executionId: string, toolName = "get_project_state"): WebMcpExecutionEvent {
  return {
    executionId,
    phase: "started",
    toolName,
    toolTitle: "Get current room project state",
    readOnly: true,
    startedAt: "2026-09-01T10:00:00.000Z",
    input: { json: JSON.stringify({ includeValidation: true }), truncated: false },
  };
}

function returned(
  executionId: string,
  applicationOutcome: "success" | "error" = "success",
): WebMcpExecutionEvent {
  return {
    ...started(executionId),
    phase: "returned",
    finishedAt: "2026-09-01T10:00:00.012Z",
    durationMs: 12,
    result: {
      json: JSON.stringify(applicationOutcome === "success"
        ? { ok: true, revision: 3 }
        : { ok: false, error: { code: "INVALID_INPUT" } }),
      truncated: false,
    },
    applicationOutcome,
  };
}

afterEach(() => cleanup());

describe("WebMCP activity inspector", () => {
  it("shows registration state, unread activity, payload, result and restores trigger focus", () => {
    const view = renderActivity();
    expect(screen.getByRole("button", { name: "WebMCP activity, Checking" })).toBeTruthy();

    act(() => {
      view.recorder().setRegistrationState("ready");
      view.recorder().observeExecution(started("call-1"));
      view.recorder().observeExecution(returned("call-1"));
    });

    const trigger = screen.getByRole("button", {
      name: "WebMCP activity, Ready, 1 new calls",
    });
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("heading", { name: "WebMCP activity" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close WebMCP activity" }));
    fireEvent.click(screen.getByRole("button", { name: /get_project_state/ }));
    expect(screen.getByText("Returned in 12 ms")).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Input payload" })).getByText(/includeValidation/)).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Returned result" })).getByText(/revision/)).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("heading", { name: "WebMCP activity" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("distinguishes a fulfilled tool error and clears the session log", () => {
    const view = renderActivity();
    act(() => {
      view.recorder().observeExecution(started("call-error", "configure_room"));
      view.recorder().observeExecution(returned("call-error", "error"));
    });
    fireEvent.click(screen.getByRole("button", { name: /WebMCP activity/ }));
    fireEvent.click(screen.getByRole("button", { name: /configure_room/ }));

    expect(screen.getAllByText("Tool error").length).toBeGreaterThan(0);
    expect(screen.getByText(/INVALID_INPUT/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear WebMCP activity" }));
    expect(screen.getByRole("heading", { name: "No calls yet" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear WebMCP activity" })).toHaveProperty("disabled", true);
  });

  it("retains only the latest 50 calls and caps the unread count", () => {
    const view = renderActivity();
    act(() => {
      for (let index = 0; index < 51; index += 1) {
        view.recorder().observeExecution(started(`call-${index}`, `tool-${index}`));
      }
    });

    fireEvent.click(screen.getByRole("button", { name: /50 new calls/ }));
    const list = screen.getByRole("list", { name: "Recent WebMCP calls" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(50);
    expect(within(list).getByRole("button", { name: /tool-50/ })).toBeTruthy();
    expect(within(list).queryByText("tool-0")).toBeNull();
  });
});
