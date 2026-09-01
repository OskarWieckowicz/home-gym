// @vitest-environment jsdom

import { StrictMode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectStoreProvider } from "@/features/creator/store/project-store-context";

import { registerRoomTools } from "../register-room-tools";
import { CreatorWebMcpBridge } from "./creator-webmcp-bridge";
import { WebMcpActivityProvider } from "./webmcp-activity-context";

vi.mock("../register-room-tools", () => ({ registerRoomTools: vi.fn() }));

const registerRoomToolsMock = vi.mocked(registerRoomTools);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderBridge(node = <CreatorWebMcpBridge />) {
  return render(
    <WebMcpActivityProvider>
      <ProjectStoreProvider>{node}</ProjectStoreProvider>
    </WebMcpActivityProvider>,
  );
}

describe("CreatorWebMcpBridge", () => {
  it("renders nothing before and after successful registration", async () => {
    registerRoomToolsMock.mockResolvedValue({ status: "ready" });
    const { container } = renderBridge();

    expect(container.innerHTML).toBe("");
    await waitFor(() => expect(registerRoomToolsMock).toHaveBeenCalledOnce());
    expect(container.innerHTML).toBe("");
  });

  it.each(["unsupported", "failed"] as const)(
    "shows a non-blocking manual fallback when registration is %s",
    async (status) => {
      registerRoomToolsMock.mockResolvedValue(
        status === "failed"
          ? { status, reason: "registration-rejected" }
          : { status },
      );
      renderBridge();

      expect((await screen.findByRole("status")).textContent).toContain(
        "Agent room tools are unavailable in this browser. You can still edit the room manually.",
      );
    },
  );

  it("shows the manual fallback when a registrar unexpectedly rejects", async () => {
    registerRoomToolsMock.mockRejectedValue(new Error("broken browser API"));
    renderBridge();

    expect((await screen.findByRole("status")).textContent).toContain(
      "Agent room tools are unavailable in this browser.",
    );
  });

  it("aborts the lifecycle controller on unmount", async () => {
    let capturedController: AbortController | undefined;
    registerRoomToolsMock.mockImplementation((_document, controller) => {
      capturedController = controller;
      return new Promise(() => undefined);
    });
    const { unmount } = renderBridge();
    await waitFor(() => expect(capturedController).toBeDefined());

    unmount();
    expect(capturedController?.signal.aborted).toBe(true);
  });

  it("defers registration past the diagnostic Strict Mode remount", async () => {
    const controllers: AbortController[] = [];
    registerRoomToolsMock.mockImplementation((_document, controller) => {
      controllers.push(controller);
      return Promise.resolve({ status: "ready" });
    });

    render(
      <StrictMode>
        <WebMcpActivityProvider>
          <ProjectStoreProvider>
            <CreatorWebMcpBridge />
          </ProjectStoreProvider>
        </WebMcpActivityProvider>
      </StrictMode>,
    );
    await waitFor(() => expect(controllers).toHaveLength(1));
    expect(controllers[0].signal.aborted).toBe(false);
  });
});
