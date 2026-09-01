"use client";

import { Braces, Check, Clipboard, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { WebMcpJsonSnapshot } from "../execution-activity";
import { useWebMcpActivity, type WebMcpActivityEntry } from "./webmcp-activity-context";

const PANEL_ID = "creator-webmcp-activity";
const TRIGGER_ID = "creator-webmcp-activity-trigger";

const REGISTRATION_LABELS = {
  checking: "Checking",
  ready: "Ready",
  unavailable: "Unavailable",
} as const;

function executionLabel(entry: WebMcpActivityEntry) {
  if (entry.phase === "started") return "Running";
  if (entry.phase === "threw") return "Exception";
  if (entry.applicationOutcome === "error") return "Tool error";
  return "Returned";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function CopyJsonButton({ label, value }: { readonly label: string; readonly value: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  const buttonLabel = state === "copied" ? `Copied ${label}` : `Copy ${label}`;
  return (
    <button aria-label={buttonLabel} className="webmcp-copy-action" onClick={copy} type="button">
      {state === "copied" ? <Check aria-hidden="true" size={14} /> : <Clipboard aria-hidden="true" size={14} />}
      {state === "failed" ? "Copy unavailable" : state === "copied" ? "Copied" : "Copy"}
    </button>
  );
}

function JsonSnapshot({ label, snapshot }: { readonly label: string; readonly snapshot: WebMcpJsonSnapshot }) {
  return (
    <section className="webmcp-json-section" aria-label={label}>
      <div className="webmcp-json-heading">
        <h4>{label}</h4>
        <CopyJsonButton label={label.toLowerCase()} value={snapshot.json} />
      </div>
      <pre tabIndex={0}><code>{snapshot.json}</code></pre>
      {snapshot.truncated ? <p className="webmcp-truncation">Display truncated at 128 KiB.</p> : null}
    </section>
  );
}

function ActivityListItem({ entry, selected, onSelect }: {
  readonly entry: WebMcpActivityEntry;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const label = executionLabel(entry);
  return (
    <li>
      <button aria-pressed={selected} className="webmcp-activity-row" onClick={onSelect} type="button">
        <span className="webmcp-activity-row-heading">
          <strong>{entry.toolName}</strong>
        </span>
        <span className="webmcp-activity-row-footer">
          <span className={`webmcp-call-status is-${entry.phase} is-${entry.applicationOutcome ?? "unknown"}`}>
            {label}
          </span>
          <span className="webmcp-activity-row-meta">
            {entry.readOnly ? "READ" : "WRITE"} · {formatTime(entry.startedAt)}
            {entry.durationMs === undefined ? "" : ` · ${Math.round(entry.durationMs)} ms`}
          </span>
        </span>
      </button>
    </li>
  );
}

function ActivityDetail({ entry }: { readonly entry: WebMcpActivityEntry }) {
  return (
    <article className="webmcp-activity-detail">
      <header>
        <p>{entry.readOnly ? "Read-only tool" : "State-changing tool"}</p>
        <h3>{entry.toolTitle ?? entry.toolName}</h3>
        {entry.toolTitle ? <code>{entry.toolName}</code> : null}
        <p className="webmcp-detail-status">
          {executionLabel(entry)}
          {entry.durationMs === undefined ? "" : ` in ${Math.round(entry.durationMs)} ms`}
        </p>
      </header>
      <JsonSnapshot label="Input payload" snapshot={entry.input} />
      {entry.result ? <JsonSnapshot label="Returned result" snapshot={entry.result} /> : null}
      {entry.error ? <JsonSnapshot label="Thrown error" snapshot={entry.error} /> : null}
      {entry.phase === "started" ? <p className="creator-help">Waiting for the tool to return…</p> : null}
    </article>
  );
}

export function WebMcpActivityTrigger() {
  const activity = useWebMcpActivity();
  const status = REGISTRATION_LABELS[activity.registrationState];
  const unread = activity.unreadCount > 0 ? `, ${activity.unreadCount} new calls` : "";

  return (
    <button
      aria-controls={PANEL_ID}
      aria-expanded={activity.open}
      aria-label={`WebMCP activity, ${status}${unread}`}
      className="webmcp-activity-trigger"
      id={TRIGGER_ID}
      onClick={activity.open ? activity.closePanel : activity.openPanel}
      type="button"
    >
      <Braces aria-hidden="true" size={17} />
      <span className="webmcp-trigger-label">WebMCP activity</span>
      <span aria-hidden="true" className={`webmcp-registration-state is-${activity.registrationState}`}>
        {status}
      </span>
      {activity.unreadCount > 0 ? (
        <span aria-hidden="true" className="webmcp-unread-count">{activity.unreadCount}</span>
      ) : null}
    </button>
  );
}

export function WebMcpActivityPanel() {
  const activity = useWebMcpActivity();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selected = activity.entries.find((entry) => entry.executionId === activity.selectedId)
    ?? activity.entries[0];
  const closeAndRestoreFocus = useCallback(() => {
    activity.closePanel();
    document.getElementById(TRIGGER_ID)?.focus({ preventScroll: true });
  }, [activity]);

  useEffect(() => {
    if (!activity.open) return;
    closeButtonRef.current?.focus({ preventScroll: true });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      closeAndRestoreFocus();
    };
    document.addEventListener("keydown", closeOnEscape, true);
    return () => document.removeEventListener("keydown", closeOnEscape, true);
  }, [activity.open, closeAndRestoreFocus]);

  if (!activity.open) return null;

  return (
    <aside aria-labelledby="webmcp-activity-title" className="webmcp-activity-panel" id={PANEL_ID}>
      <header className="webmcp-activity-panel-heading">
        <div>
          <p className="creator-eyebrow">Application-side trace</p>
          <h2 id="webmcp-activity-title">WebMCP activity</h2>
          <p>
            {REGISTRATION_LABELS[activity.registrationState]} · {activity.entries.length} recent calls
          </p>
        </div>
        <div className="webmcp-panel-actions">
          <button aria-label="Clear WebMCP activity" disabled={activity.entries.length === 0}
            onClick={activity.clearEntries} type="button">
            <Trash2 aria-hidden="true" size={16} /> Clear
          </button>
          <button aria-label="Close WebMCP activity" onClick={closeAndRestoreFocus} ref={closeButtonRef} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </div>
      </header>
      <p className="webmcp-activity-explainer">
        Shows inputs and returned values from tools executed on this open creator page. It does not expose the host&apos;s internal transport.
      </p>
      {activity.entries.length === 0 ? (
        <div className="webmcp-activity-empty">
          <Braces aria-hidden="true" size={28} />
          <h3>No calls yet</h3>
          <p>Calls appear when an agent or browser inspector executes a registered WebMCP tool on this page.</p>
        </div>
      ) : (
        <div className="webmcp-activity-content">
          <ol aria-label="Recent WebMCP calls" className="webmcp-activity-list">
            {activity.entries.map((entry) => (
              <ActivityListItem
                entry={entry}
                key={entry.executionId}
                onSelect={() => activity.selectEntry(entry.executionId)}
                selected={entry.executionId === selected?.executionId}
              />
            ))}
          </ol>
          {selected ? <ActivityDetail entry={selected} /> : null}
        </div>
      )}
    </aside>
  );
}
