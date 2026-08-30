"use client";

import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { createDefaultProject } from "@/features/project/defaults";
import {
  decodeProjectJson,
  serializeProject,
} from "@/features/project/serialization/project-codec";

import { useProjectPersistence } from "../persistence/project-persistence-boundary";
import { useProjectStore } from "../store/project-store-context";
import { EditorPopover } from "./editor-popover";

export const PROJECT_IMPORT_MAX_BYTES = 1024 * 1024;
export const PROJECT_EXPORT_FILENAME = "home-gym-project-v4.json";

export function ProjectFileActions() {
  const inputRef = useRef<HTMLInputElement>(null);
  const importGeneration = useRef(0);
  const [message, setMessage] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);
  const project = useProjectStore((state) => state.project);
  const replaceProject = useProjectStore((state) => state.replaceProject);
  const persistence = useProjectPersistence();

  function exportProject() {
    const serialized = serializeProject(project);
    if (!serialized.success) {
      setMessage({ kind: "error", text: serialized.error.message });
      return;
    }

    const objectUrl = URL.createObjectURL(
      new Blob([serialized.json], { type: "application/json;charset=utf-8" }),
    );
    try {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = PROJECT_EXPORT_FILENAME;
      link.click();
      setMessage({ kind: "success", text: "Project exported." });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function importProject(event: ChangeEvent<HTMLInputElement>) {
    const generation = importGeneration.current + 1;
    importGeneration.current = generation;
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    if (file.size > PROJECT_IMPORT_MAX_BYTES) {
      setMessage({
        kind: "error",
        text: "The project file is too large. Choose a JSON file up to 1 MB.",
      });
      return;
    }

    let json: string;
    try {
      json = await file.text();
    } catch {
      if (generation !== importGeneration.current) return;
      setMessage({ kind: "error", text: "The project file could not be read." });
      return;
    }

    if (generation !== importGeneration.current) return;

    const decoded = decodeProjectJson(json);
    if (!decoded.success) {
      setMessage({ kind: "error", text: decoded.error.message });
      return;
    }

    const result = replaceProject(decoded.project);
    setMessage(
      result.ok
        ? {
            kind: "success",
            text: result.changed ? "Project imported." : "This project is already open.",
          }
        : { kind: "error", text: result.error.message },
    );
  }

  function resetProject() {
    if (!window.confirm("Reset this project to the default room? You can undo the reset.")) {
      return;
    }

    importGeneration.current += 1;
    const result = replaceProject(createDefaultProject());
    if (!result.ok) {
      setMessage({ kind: "error", text: result.error.message });
      return;
    }
    const cleared =
      !result.changed && persistence?.status.kind === "invalid-saved-project"
        ? persistence.clearStoredProject()
        : undefined;
    setMessage({
      kind: !result.changed && cleared === false ? "error" : "success",
      text: result.changed
        ? "Project reset. Undo is available."
        : cleared === true
          ? "Saved project cleared."
          : cleared === false
            ? "The project is already at default, but saved data could not be cleared."
            : "The project is already at default.",
    });
  }

  return (
    <div className="creator-file-actions">
      <EditorPopover label="Project">
      <div aria-label="Project file actions" className="creator-file-action-buttons" role="group">
        <button onClick={exportProject} type="button">
          <Download aria-hidden="true" size={17} /> Export
        </button>
        <button onClick={() => inputRef.current?.click()} type="button">
          <Upload aria-hidden="true" size={17} /> Import
        </button>
        <input
          accept="application/json,.json"
          aria-label="Choose project JSON to import"
          className="visually-hidden"
          onChange={importProject}
          ref={inputRef}
          tabIndex={-1}
          type="file"
        />
        <button className="creator-danger" onClick={resetProject} type="button">
          <RotateCcw aria-hidden="true" size={17} /> Reset
        </button>
      </div>
      </EditorPopover>
      {message ? (
        <p
          className={message.kind === "error" ? "creator-file-error" : "creator-file-message"}
          role={message.kind === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
