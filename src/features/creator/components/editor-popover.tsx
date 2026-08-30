"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Disclosure of native controls, not an ARIA menu with missing arrow behavior. */
export function EditorPopover({ label, children, icon }: {
  readonly label: string; readonly children: ReactNode; readonly icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return <div className="editor-popover" ref={root} onKeyDown={(event) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation(); setOpen(false); trigger.current?.focus();
    }
  }} onBlur={(event) => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button type="button" ref={trigger} aria-expanded={open} aria-controls={id}
      aria-label={label} onClick={() => setOpen((value) => !value)}>{icon ?? label}</button>
    <div id={id} className="editor-popover-content" hidden={!open}>{children}</div>
  </div>;
}
