"use client";

import { useEffect, useId, useRef } from "react";

import type { CreatorStartMode } from "@/lib/navigation";

export function ReplaceProjectDialog({ mode, onResolve }: {
  readonly mode: CreatorStartMode;
  readonly onResolve: (replace: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    cancelRef.current?.focus();
    return () => dialog.close();
  }, []);

  return <dialog ref={dialogRef} className="creator-settings-dialog"
    aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={(event) => { event.preventDefault(); onResolve(false); }}
    onClose={(event) => {
      // Ignore the queued close event from Strict Mode's effect cleanup/reopen.
      if (!event.currentTarget.open) onResolve(false);
    }}
    onKeyDown={(event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onResolve(false);
    }}>
    <div className="creator-settings-heading"><h2 id={titleId}>Replace your saved project?</h2></div>
    <p className="creator-help" id={descriptionId}>
      {mode === "demo" ? "Opening the sample" : "Starting a new project"} will replace the project saved in this browser.
      This cannot be undone. Keep your project to continue editing or export a copy first.
    </p>
    <div className="creator-form-actions">
      <button ref={cancelRef} type="button" onClick={() => onResolve(false)}>
        Keep my project
      </button>
      <button className="creator-primary" type="button" onClick={() => onResolve(true)}>
        {mode === "demo" ? "Replace with sample" : "Replace with new project"}
      </button>
    </div>
  </dialog>;
}
