// @vitest-environment jsdom

import { StrictMode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { registerCatalogTools } from "../register-catalog-tools";
import { CatalogWebMcpBridge } from "./catalog-webmcp-bridge";

vi.mock("../register-catalog-tools", () => ({
  registerCatalogTools: vi.fn(),
}));

const registerCatalogToolsMock = vi.mocked(registerCatalogTools);

afterEach(() => {
  cleanup();
});

describe("CatalogWebMcpBridge", () => {
  it("renders nothing before and after successful registration", async () => {
    registerCatalogToolsMock.mockResolvedValue({ status: "ready" });
    const { container } = render(<CatalogWebMcpBridge />);

    expect(container.innerHTML).toBe("");
    await waitFor(() => expect(registerCatalogToolsMock).toHaveBeenCalledOnce());
    expect(container.innerHTML).toBe("");
  });

  it.each(["unsupported", "failed"] as const)(
    "shows a non-blocking manual fallback when registration is %s",
    async (status) => {
      registerCatalogToolsMock.mockResolvedValue(
        status === "failed"
          ? { status, reason: "registration-rejected" }
          : { status },
      );
      render(<CatalogWebMcpBridge />);

      expect((await screen.findByRole("status")).textContent).toContain(
        "Agent catalog tools are unavailable in this browser. You can still browse and filter manually.",
      );
    },
  );

  it("aborts the lifecycle controller on unmount", async () => {
    let capturedController: AbortController | undefined;
    registerCatalogToolsMock.mockImplementation((_document, controller) => {
      capturedController = controller;
      return new Promise(() => undefined);
    });
    const { unmount } = render(<CatalogWebMcpBridge />);
    await waitFor(() => expect(capturedController).toBeDefined());

    unmount();
    expect(capturedController?.signal.aborted).toBe(true);
  });

  it("owns separate controllers across a Strict Mode remount", async () => {
    const controllers: AbortController[] = [];
    registerCatalogToolsMock.mockImplementation((_document, controller) => {
      controllers.push(controller);
      return Promise.resolve({ status: "ready" });
    });

    render(
      <StrictMode>
        <CatalogWebMcpBridge />
      </StrictMode>,
    );
    await waitFor(() => expect(controllers).toHaveLength(2));
    expect(controllers[0].signal.aborted).toBe(true);
    expect(controllers[1].signal.aborted).toBe(false);
  });
});
