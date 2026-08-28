import { describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "@/features/project";
import { serializeProject } from "@/features/project/serialization/project-codec";

import {
  createLocalProjectStorage,
  LOCAL_PROJECT_STORAGE_KEY,
  type ProjectStorageLike,
} from "./local-project-storage";

describe("local project storage", () => {
  it("returns missing for an absent key and does not write while loading", () => {
    const storage = createStorage();

    expect(createLocalProjectStorage(storage).load()).toEqual({ status: "missing" });
    expect(storage.getItem).toHaveBeenCalledWith(LOCAL_PROJECT_STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it("loads a valid current document", () => {
    const project = createDefaultProject();
    const serialized = serializeProject(project);
    if (!serialized.success) {
      throw new Error("Expected the fixture to serialize.");
    }
    const storage = createStorage(serialized.json);

    expect(createLocalProjectStorage(storage).load()).toEqual({
      status: "loaded",
      project,
    });
  });

  it.each([
    ["corrupt", "not json", "invalid-json"],
    [
      "unsupported",
      JSON.stringify({ ...createDefaultProject(), version: 3 }),
      "unsupported-version",
    ],
  ])("contains and classifies %s stored content", (_label, json, code) => {
    const result = createLocalProjectStorage(createStorage(json)).load();

    expect(result.status).toBe("failure");
    if (result.status === "failure") {
      expect(result.error.code).toBe(code);
    }
  });

  it("contains unavailable storage access", () => {
    const adapter = createLocalProjectStorage(undefined);

    expect(adapter.load()).toMatchObject({
      status: "failure",
      error: { code: "storage-unavailable" },
    });
    expect(adapter.save(createDefaultProject())).toMatchObject({
      success: false,
      error: { code: "storage-unavailable" },
    });
    expect(adapter.clear()).toMatchObject({
      success: false,
      error: { code: "storage-unavailable" },
    });
  });

  it("contains getItem exceptions", () => {
    const storage = createStorage();
    storage.getItem.mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(createLocalProjectStorage(storage).load()).toMatchObject({
      status: "failure",
      error: { code: "read-failed" },
    });
  });

  it("contains setItem quota and write exceptions", () => {
    const storage = createStorage();
    storage.setItem.mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });

    expect(createLocalProjectStorage(storage).save(createDefaultProject())).toMatchObject({
      success: false,
      error: { code: "write-failed" },
    });
  });

  it("contains removeItem exceptions", () => {
    const storage = createStorage();
    storage.removeItem.mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(createLocalProjectStorage(storage).clear()).toMatchObject({
      success: false,
      error: { code: "clear-failed" },
    });
  });

  it("saves canonical JSON under the stable key and loads it equally", () => {
    let value: string | null = null;
    const storage: ProjectStorageLike = {
      getItem: vi.fn(() => value),
      setItem: vi.fn((_key, nextValue) => {
        value = nextValue;
      }),
      removeItem: vi.fn(() => {
        value = null;
      }),
    };
    const adapter = createLocalProjectStorage(storage);
    const project = createDefaultProject();

    expect(adapter.save(project)).toEqual({ success: true });
    expect(storage.setItem).toHaveBeenCalledWith(
      LOCAL_PROJECT_STORAGE_KEY,
      `${JSON.stringify(project, null, 2)}\n`,
    );
    expect(adapter.load()).toEqual({ status: "loaded", project });
    expect(adapter.clear()).toEqual({ success: true });
    expect(storage.removeItem).toHaveBeenCalledWith(LOCAL_PROJECT_STORAGE_KEY);
    expect(adapter.load()).toEqual({ status: "missing" });
  });

  it("does not write an invalid runtime project", () => {
    const storage = createStorage();
    const result = createLocalProjectStorage(storage).save({
      ...createDefaultProject(),
      budget: -1,
    });

    expect(result).toMatchObject({
      success: false,
      error: { code: "schema-invalid" },
    });
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

function createStorage(initialValue: string | null = null) {
  return {
    getItem: vi.fn(() => initialValue),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
}
