// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createLocalProjectStorage } from "../persistence/local-project-storage";
import { createDefaultProject } from "@/features/project/defaults";
import { serializeProject } from "@/features/project/serialization/project-codec";

import { CreatorEditor } from "./creator-editor";
import { PROJECT_IMPORT_MAX_BYTES } from "./project-file-actions";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function openProjectActions() {
  const trigger = screen.getByRole("button", { name: "Project" });
  if (trigger.getAttribute("aria-expanded") !== "true") fireEvent.click(trigger);
}

function chooseImportInput() {
  openProjectActions();
  fireEvent.click(screen.getByRole("button", { name: "Import" }));
  return screen.getByLabelText("Choose project JSON to import");
}

function openProjectSettings() {
  fireEvent.click(screen.getByRole("tab", { name: "Room" }));
  fireEvent.click(screen.getByRole("button", { name: "Project settings" }));
}

describe("ProjectFileActions", () => {
  it("exports the canonical project and revokes its object URL", () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:project");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const project = { ...createDefaultProject(), budget: 12_500 };
    render(<CreatorEditor initialProject={project} />);

    openProjectActions();
    fireEvent.click(screen.getByRole("button", { name: /Export/ }));

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:project");
    expect(screen.getByText("Project exported.").getAttribute("role")).toBe("status");
  });

  it("imports a validated project through one undoable replacement", async () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    const imported = { ...createDefaultProject(), budget: 18_000 };
    const file = jsonFile(projectJson(imported));

    fireEvent.change(chooseImportInput(), {
      target: { files: [file] },
    });

    expect(await screen.findByText("Project imported.")).toBeTruthy();
    openProjectSettings();
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "18000",
    );
    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "10000",
    );
  });

  it("rejects invalid and oversized imports without changing history", async () => {
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    const input = chooseImportInput();

    fireEvent.change(input, { target: { files: [jsonFile("not json")] } });
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "The project file is not valid JSON.",
    );
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty(
      "disabled",
      true,
    );

    const text = vi.fn(async () => "{}");
    fireEvent.change(input, {
      target: { files: [{ name: "huge.json", size: PROJECT_IMPORT_MAX_BYTES + 1, text }] },
    });
    expect(await screen.findByText(/file is too large/i)).toBeTruthy();
    expect(text).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("confirms reset and keeps it undoable", () => {
    const confirm = vi.spyOn(window, "confirm");
    render(
      <CreatorEditor
        initialProject={{ ...createDefaultProject(), budget: 14_000 }}
      />,
    );

    confirm.mockReturnValueOnce(false);
    openProjectActions();
    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));
    openProjectSettings();
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "14000",
    );

    confirm.mockReturnValueOnce(true);
    openProjectActions();
    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "10000",
    );
    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "14000",
    );
  });
});

describe("persistent reset edge cases", () => {
  it("can explicitly clear corrupt storage when reset is a project no-op", async () => {
    const removeItem = vi.fn();
    const adapter = createLocalProjectStorage({
      getItem: vi.fn(() => "not json"),
      setItem: vi.fn(),
      removeItem,
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<CreatorEditor persistence storage={adapter} />);
    await screen.findByText(/saved project is invalid/i);

    openProjectActions();
    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));

    expect(removeItem).toHaveBeenCalledOnce();
    expect(await screen.findByText("Saved project cleared.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Undo/ })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("keeps a valid default save when reset is a no-op with a custom fallback", async () => {
    let saved: string | null = projectJson(createDefaultProject());
    const removeItem = vi.fn(() => {
      saved = null;
    });
    const adapter = createLocalProjectStorage({
      getItem: vi.fn(() => saved),
      setItem: vi.fn((_key, value) => {
        saved = value;
      }),
      removeItem,
    });
    const fallback = { ...createDefaultProject(), budget: 14_000 };
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const first = render(
      <CreatorEditor initialProject={fallback} persistence storage={adapter} />,
    );
    await screen.findByText("Saved locally.");

    openProjectActions();
    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));
    expect(removeItem).not.toHaveBeenCalled();
    first.unmount();

    render(<CreatorEditor initialProject={fallback} persistence storage={adapter} />);
    await screen.findByText("Saved locally.");
    openProjectSettings();
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "10000",
    );
  });

  it("retains the previous durable snapshot when reset autosave fails", async () => {
    const previous = { ...createDefaultProject(), budget: 16_000 };
    const serialized = serializeProject(previous);
    if (!serialized.success) throw new Error("Invalid project fixture.");
    const removeItem = vi.fn();
    const adapter = createLocalProjectStorage({
      getItem: vi.fn(() => serialized.json),
      setItem: vi.fn(() => {
        throw new DOMException("quota", "QuotaExceededError");
      }),
      removeItem,
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<CreatorEditor persistence storage={adapter} />);
    await screen.findByText("Saved locally.");

    openProjectActions();
    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));

    expect(removeItem).not.toHaveBeenCalled();
    expect(await screen.findByText(/latest project could not be saved/i)).toBeTruthy();
    openProjectSettings();
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "10000",
    );
    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "16000",
    );
  });
});

describe("concurrent project file actions", () => {
  it("lets a newer import win when an older file read finishes last", async () => {
    let resolveOlder: ((json: string) => void) | undefined;
    const older = {
      name: "older.json",
      size: 100,
      text: vi.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveOlder = resolve;
          }),
      ),
    };
    const newerProject = { ...createDefaultProject(), budget: 19_000 };
    render(<CreatorEditor initialProject={createDefaultProject()} />);
    const input = chooseImportInput();

    fireEvent.change(input, { target: { files: [older] } });
    fireEvent.change(input, {
      target: { files: [jsonFile(projectJson(newerProject))] },
    });
    await screen.findByText("Project imported.");
    await act(async () => resolveOlder?.(projectJson({ ...createDefaultProject(), budget: 17_000 })));

    openProjectSettings();
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "19000",
    );
  });

  it("does not let a pending import overwrite a confirmed reset", async () => {
    let resolveImport: ((json: string) => void) | undefined;
    const pending = {
      name: "pending.json",
      size: 100,
      text: vi.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveImport = resolve;
          }),
      ),
    };
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <CreatorEditor
        initialProject={{ ...createDefaultProject(), budget: 14_000 }}
      />,
    );

    fireEvent.change(chooseImportInput(), {
      target: { files: [pending] },
    });
    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));
    await act(async () => resolveImport?.(projectJson({ ...createDefaultProject(), budget: 20_000 })));

    openProjectSettings();
    expect(screen.getByRole("spinbutton", { name: "Budget" })).toHaveProperty(
      "value",
      "10000",
    );
  });
});

function projectJson(project: ReturnType<typeof createDefaultProject>): string {
  const serialized = serializeProject(project);
  if (!serialized.success) throw new Error("Invalid project fixture.");
  return serialized.json;
}

function jsonFile(json: string) {
  return {
    name: "project.json",
    size: new TextEncoder().encode(json).byteLength,
    text: vi.fn(async () => json),
  };
}
