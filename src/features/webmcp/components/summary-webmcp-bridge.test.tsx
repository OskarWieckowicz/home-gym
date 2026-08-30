// @vitest-environment jsdom

import { StrictMode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectStoreProvider } from "@/features/creator/store/project-store-context";

import { registerSummaryTools } from "../register-summary-tools";
import { SummaryWebMcpBridge } from "./summary-webmcp-bridge";

vi.mock("../register-summary-tools", () => ({ registerSummaryTools: vi.fn() }));
const registerMock = vi.mocked(registerSummaryTools);

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("SummaryWebMcpBridge", () => {
  it("registers once in Strict Mode and aborts the shared lifecycle without mutating the store", async () => {
    registerMock.mockResolvedValue({ status: "ready" });
    const { container, unmount } = render(
      <StrictMode><ProjectStoreProvider><SummaryWebMcpBridge /></ProjectStoreProvider></StrictMode>,
    );
    await waitFor(() => expect(registerMock).toHaveBeenCalledOnce());
    const [, controller, store] = registerMock.mock.calls[0];
    expect(controller.signal.aborted).toBe(false);
    const state = store.getState();
    expect(container.innerHTML).toBe("");
    unmount();
    expect(controller.signal.aborted).toBe(true);
    expect(store.getState()).toBe(state);
    expect(state).toMatchObject({ revision: 0, canUndo: false, canRedo: false });
  });

  it.each(["unsupported", "failed"] as const)("keeps the summary usable when %s", async (status) => {
    registerMock.mockResolvedValue(status === "failed"
      ? { status, reason: "registration-rejected" } : { status });
    render(<ProjectStoreProvider><SummaryWebMcpBridge /></ProjectStoreProvider>);
    expect((await screen.findByRole("status")).textContent).toContain(
      "You can still review and export your project manually.",
    );
  });

  it("ignores a pending registration result after unmount", async () => {
    let resolve: ((value: { status: "ready" }) => void) | undefined;
    registerMock.mockImplementation(() => new Promise((complete) => { resolve = complete; }));
    const { unmount } = render(<ProjectStoreProvider><SummaryWebMcpBridge /></ProjectStoreProvider>);
    await waitFor(() => expect(resolve).toBeDefined());
    unmount();
    resolve?.({ status: "ready" });
    expect(registerMock.mock.calls[0][1].signal.aborted).toBe(true);
  });
});
