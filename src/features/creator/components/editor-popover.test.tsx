// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorPopover } from "./editor-popover";

afterEach(cleanup);

describe("EditorPopover", () => {
  it("starts collapsed, exposes native controls and restores focus with Escape", () => {
    const action = vi.fn();
    render(<EditorPopover label="Project"><button onClick={action}>Export</button></EditorPopover>);
    const trigger = screen.getByRole("button", { name: "Project" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "Export" })).toBeNull();
    fireEvent.click(trigger);
    const control = screen.getByRole("button", { name: "Export" });
    expect(control.closest("div")?.id).toBe(trigger.getAttribute("aria-controls"));
    control.focus();
    fireEvent.click(control);
    expect(action).toHaveBeenCalledOnce();
    fireEvent.keyDown(control, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on an outside pointer or focus move, not on internal focus", () => {
    render(<><EditorPopover label="Camera views"><button>Top view</button></EditorPopover><button>Outside</button></>);
    const trigger = screen.getByRole("button", { name: "Camera views" });
    const outside = screen.getByRole("button", { name: "Outside" });
    fireEvent.click(trigger);
    const control = screen.getByRole("button", { name: "Top view" });
    fireEvent.blur(trigger, { relatedTarget: control });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.blur(control, { relatedTarget: outside });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    fireEvent.pointerDown(outside);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
