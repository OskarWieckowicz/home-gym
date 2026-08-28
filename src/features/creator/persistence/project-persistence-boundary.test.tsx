// @vitest-environment jsdom

import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreatorEditor } from "../components/creator-editor";
import { createDefaultProject } from "@/features/project/defaults";
import { serializeProject } from "@/features/project/serialization/project-codec";

import {
  createLocalProjectStorage,
  type ProjectStorageLike,
} from "./local-project-storage";

afterEach(cleanup);

describe("ProjectPersistenceBoundary", () => {
  it("renders the same loading shell during server rendering", () => {
    const html = renderToString(
      <CreatorEditor persistence storage={createLocalProjectStorage(undefined)} />,
    );

    expect(html).toContain("Loading saved project");
    expect(html).not.toContain("Untitled room");
  });

  it("restores a saved project as revision-zero baseline without an initialization write", async () => {
    const restored = { ...createDefaultProject(), budget: 12_500 };
    const memory = createMemoryStorage(projectJson(restored));

    render(<CreatorEditor persistence storage={memory.adapter} />);

    expect(await screen.findByText("Saved locally.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty(
      "disabled",
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "Project settings" }));
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "12500",
    );
    expect(memory.storage.setItem).not.toHaveBeenCalled();
  });

  it("saves only real project-reference changes and restores the result on remount", async () => {
    const memory = createMemoryStorage();
    const first = render(<CreatorEditor persistence storage={memory.adapter} />);
    await screen.findByText("Local saving ready.");

    fireEvent.click(screen.getByRole("button", { name: "Project settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
    expect(memory.storage.setItem).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Budget" }), {
      target: { value: "13500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply settings" }));
    expect(memory.storage.setItem).toHaveBeenCalledOnce();
    expect(await screen.findByText("Saved locally.")).toBeTruthy();

    first.unmount();
    render(<CreatorEditor persistence storage={memory.adapter} />);
    await screen.findByText("Saved locally.");
    fireEvent.click(screen.getByRole("button", { name: "Project settings" }));
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "13500",
    );
  });

  it("keeps corrupt and unavailable storage non-blocking without repairing it on load", async () => {
    const corrupt = createMemoryStorage("not json");
    const first = render(<CreatorEditor persistence storage={corrupt.adapter} />);

    expect(await screen.findByText(/saved project is invalid/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Untitled room" })).toBeTruthy();
    expect(corrupt.storage.setItem).not.toHaveBeenCalled();
    expect(corrupt.storage.removeItem).not.toHaveBeenCalled();

    first.unmount();
    render(
      <CreatorEditor
        persistence
        storage={createLocalProjectStorage(undefined)}
      />,
    );
    expect(await screen.findByText(/local saving is unavailable/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply room" })).toBeTruthy();
  });

  it("reports write failure while retaining in-memory editing and history", async () => {
    const raw = createMemoryStorage();
    raw.storage.setItem.mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    render(<CreatorEditor persistence storage={raw.adapter} />);
    await screen.findByText("Local saving ready.");

    fireEvent.change(screen.getByRole("spinbutton", { name: "Width (cm)" }), {
      target: { value: "450" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply room" }));

    expect(await screen.findByText(/latest project could not be saved/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("keeps one active autosave subscription across a Strict Mode remount", async () => {
    const memory = createMemoryStorage();
    render(
      <StrictMode>
        <CreatorEditor persistence storage={memory.adapter} />
      </StrictMode>,
    );
    await screen.findByText("Local saving ready.");
    expect(memory.storage.setItem).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Width (cm)" }), {
      target: { value: "425" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply room" }));

    await waitFor(() => expect(memory.storage.setItem).toHaveBeenCalledOnce());
  });
});

function projectJson(project: ReturnType<typeof createDefaultProject>): string {
  const serialized = serializeProject(project);
  if (!serialized.success) throw new Error("Invalid project fixture.");
  return serialized.json;
}

function createMemoryStorage(initialValue: string | null = null) {
  let value = initialValue;
  const storage = {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => {
      value = nextValue;
    }),
    removeItem: vi.fn(() => {
      value = null;
    }),
  } satisfies ProjectStorageLike;
  return { storage, adapter: createLocalProjectStorage(storage) };
}
