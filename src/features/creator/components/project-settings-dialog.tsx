"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { ProjectSettingsForm } from "./project-settings-form";

export type SettingsDialogRequest = {
  readonly initialFocus: "budget" | "goals";
  readonly returnFocus: HTMLButtonElement;
};

export function ProjectSettingsDialog({ initialFocus, returnFocus, onClose }: SettingsDialogRequest & {
  readonly onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLInputElement>(initialFocus === "budget" ? "input[name=budget]" : "input[name=trainingGoals]")?.focus();
    return () => {
      dialog.close();
      if (returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, [initialFocus, returnFocus]);

  return <dialog aria-labelledby={titleId} className="creator-settings-dialog" ref={dialogRef}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClose={(event) => {
      // A queued close event from Strict Mode cleanup must not close a reopened dialog.
      if (!event.currentTarget.open) onClose();
    }}
    onKeyDown={(event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }}>
    <div className="creator-settings-heading">
      <h2 id={titleId}>Project settings</h2>
      <button aria-label="Close project settings" onClick={onClose} type="button"><X aria-hidden="true" size={20} /></button>
    </div>
    <p className="creator-help">Set your budget and the training goals for this project.</p>
    <ProjectSettingsForm onCancel={onClose} onSaved={onClose} />
  </dialog>;
}
