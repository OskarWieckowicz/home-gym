// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { STARTER_PROMPT } from "@/components/landing/landing-content";
import Home from "./page";

afterEach(cleanup);

describe("process-first landing", () => {
  it("explains the complete process before technology, in the approved order", () => {
    const { container } = render(<Home />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "What to buy. Where it fits.",
    );
    expect(Array.from(container.querySelectorAll("h2"), (h) => h.textContent)).toEqual([
      "From an empty room to your home gym.",
      "Let your agent guide you.",
      "You edit. The agent continues.",
      "AI plans. The application checks.",
      "Ready to plan your space?",
    ]);
    const process = container.querySelector("#how-it-works")!;
    expect(Array.from(process.querySelectorAll("h3"), (h) => h.textContent)).toEqual([
      "Create your room", "Set your goals and budget", "Choose and arrange equipment",
    ]);
    expect(container.querySelectorAll("main > section, main > div > section").length).toBe(6);
    expect(container.querySelector("#agent-guide")).not.toBeNull();
    expect(screen.queryByText("The sample project")).toBeNull();
    expect(screen.queryByText("Try it in a few minutes.")).toBeNull();
  });

  it("keeps new, demo and resume destinations distinct", () => {
    render(<Home />);
    for (const link of screen.getAllByRole("link", { name: "Start planning" })) {
      expect(link.getAttribute("href")).toBe("/creator?start=new");
    }
    for (const link of screen.getAllByRole("link", { name: "Explore sample project" })) {
      expect(link.getAttribute("href")).toBe("/creator?start=demo");
    }
    expect(screen.getAllByRole("link", { name: "Open creator" }).every(
      (link) => link.getAttribute("href") === "/creator",
    )).toBe(true);
    expect(screen.getAllByText(/replace.*saved project/i).length).toBeGreaterThan(0);
  });

  it("renders a selectable from-scratch prompt and honest agent/photo instructions", () => {
    const { container } = render(<Home />);
    const guide = container.querySelector("#agent-guide")!;
    expect(within(guide as HTMLElement).getByText(STARTER_PROMPT)).toBeTruthy();
    expect(within(guide as HTMLElement).getByRole("button", { name: "Copy prompt" })).toBeTruthy();
    expect(guide.querySelector("details summary")?.textContent).toContain("Agent setup guide");
    expect(guide.textContent).toContain("agent");
    expect(screen.getByText(/reference measurements and review the model/)).toBeTruthy();
    expect(guide.querySelector('a[href="https://learn.chatgpt.com/docs/webmcp"]')).not.toBeNull();
    expect(guide.textContent).toContain("replaces your saved project");
    expect(guide.textContent).toContain("Room → Room dimensions");
    expect(guide.textContent).toContain("Project → Settings");
    expect(guide.textContent).not.toContain("Room → Project settings");
    const mobileGuide = screen.getByRole("navigation", { name: "Planning guide" });
    expect(within(mobileGuide).getByRole("link", { name: "Agent guide" }).getAttribute("href"))
      .toBe("/#agent-guide");
    expect(within(mobileGuide).getByRole("link", { name: "How it works" }).getAttribute("href"))
      .toBe("/#how-it-works");
  });

  it("reserves image dimensions and loads only the hero eagerly", () => {
    render(<Home />);
    const images = screen.getAllByRole("img") as HTMLImageElement[];
    expect(images).toHaveLength(5);
    expect(images[0].getAttribute("loading")).toBe("eager");
    expect(images[0].getAttribute("fetchpriority")).toBe("high");
    for (const img of images) {
      expect(img.getAttribute("width")).toBe("1040");
      expect(img.getAttribute("height")).toBe("780");
      expect(img.getAttribute("sizes")).toBeTruthy();
      expect(img.alt).not.toBe("");
    }
    expect(images.slice(1).every((img) => img.getAttribute("loading") === "lazy")).toBe(true);
  });
});
