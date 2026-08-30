// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyPromptButton } from "./copy-prompt-button";
import { STARTER_PROMPT } from "./landing-content";

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
afterEach(() => {
  cleanup();
  if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value });
}

describe("CopyPromptButton", () => {
  it("copies only on click, then announces success without navigating", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const url = location.href;
    render(<CopyPromptButton />);
    expect(writeText).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Prompt copied"));
    expect(writeText).toHaveBeenCalledExactlyOnceWith(STARTER_PROMPT);
    expect(location.href).toBe(url);
  });

  it("does not claim success while copying is pending", async () => {
    let resolve!: () => void;
    setClipboard({ writeText: () => new Promise<void>((done) => { resolve = done; }) });
    render(<CopyPromptButton />);
    fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }));
    expect(screen.getByRole("status").textContent).toBe("");
    expect((screen.getByRole("button", { name: "Copying…" }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { resolve(); });
    expect(screen.getByRole("status").textContent).toContain("Prompt copied");
  });

  it.each(["missing", "denied"])("explains manual copying when clipboard is %s", async (mode) => {
    setClipboard(mode === "missing" ? undefined : { writeText: vi.fn().mockRejectedValue(new Error("Denied")) });
    render(<CopyPromptButton />);
    fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("copy it manually"));
    expect(screen.getByRole("status").textContent).not.toContain("Prompt copied");
    expect((screen.getByRole("button", { name: "Copy prompt" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
