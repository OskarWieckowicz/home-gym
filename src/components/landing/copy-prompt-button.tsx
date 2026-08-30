"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

import { buttonClassName } from "@/components/ui/button-styles";
import { STARTER_PROMPT } from "./landing-content";

export function CopyPromptButton() {
  const [status, setStatus] = useState("");
  const [copying, setCopying] = useState(false);

  async function copyPrompt() {
    setCopying(true);
    setStatus("");
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(STARTER_PROMPT);
      setStatus("Prompt copied. Paste it into your agent’s chat.");
    } catch {
      setStatus("Could not copy automatically. Select the prompt above and copy it manually.");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex justify-end">
        <button
          type="button"
          className={buttonClassName("primary", "gap-2 disabled:opacity-60")}
          onClick={copyPrompt}
          disabled={copying}
        >
          <Copy aria-hidden="true" size={16} />
          {copying ? "Copying…" : "Copy prompt"}
        </button>
      </div>
      <p role="status" aria-live="polite" aria-atomic="true" className="mt-2 min-h-10 text-sm leading-5 text-ink-muted">
        {status}
      </p>
      <noscript>Select the prompt above and copy it manually.</noscript>
    </div>
  );
}
