import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { siteLinks } from "@/lib/navigation";

import { CopyPromptButton } from "./copy-prompt-button";
import { STARTER_PROMPT } from "./landing-content";
import { ProjectEntryNote } from "./landing-actions";

const guideLinkClass = "rounded-sm text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

function AgentSetupGuide() {
  return (
    <details className="mt-4 text-sm leading-6 text-ink-muted">
      <summary className="w-fit cursor-pointer rounded-sm font-medium text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
        Agent setup guide
      </summary>
      <div className="mt-4 space-y-3 rounded-xl border border-brand-muted bg-surface p-4">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            Copy the starter prompt. Open this website in a WebMCP-capable agent
            environment, such as the built-in desktop browser in ChatGPT Work or Codex.
            Follow the <a className={guideLinkClass} href="https://learn.chatgpt.com/docs/webmcp">official site tools guide</a> for current setup and availability.
          </li>
          <li>
            Choose <Link className={guideLinkClass} href={siteLinks.startEmpty.href}>Start planning</Link> in
            that browser. To edit manually, choose Room → Room dimensions and
            apply your measurements; use Room → Project settings for budget and
            goals. The agent can also configure the room while you keep editing.
          </li>
          <li>
            Keep that creator tab open and paste the prompt into the external
            agent&apos;s chat in the same session. Ask it to use the tools on that
            page. It can gather room details, goals and budget together, or ask
            for what is missing.
          </li>
        </ol>
        <ProjectEntryNote />
        <p>
          Tools become available in the creator, not on this landing page.
          There is no in-app chatbot, and opening a project does not launch an agent.
        </p>
        <p>
          For local tool inspection in Chrome, see the{" "}
          <a className={guideLinkClass} href="https://developer.chrome.com/docs/ai/webmcp">official WebMCP setup instructions</a>{" "}
          for the testing flag, browser restart and Model Context Tool Inspector.
          The inspector is a development tool, not a built-in planning agent.
        </p>
      </div>
    </details>
  );
}

export function AgentGuide() {
  return (
    <section id="agent-guide" aria-labelledby="agent-guide-title" className="grid scroll-mt-32 gap-7 rounded-2xl border border-brand-muted bg-linear-to-br from-brand-soft to-canvas p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:p-10">
      <div>
        <h2 id="agent-guide-title" className="text-2xl font-bold tracking-tight sm:text-3xl">Let your agent guide you.</h2>
        <p className="mt-4 max-w-sm leading-7 text-ink-muted">
          You don&apos;t need all the answers upfront. Start a conversation and let
          the agent ask for what&apos;s missing.
        </p>
        <MessageCircle className="mt-6 text-brand" size={54} strokeWidth={1.25} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Starter prompt</p>
          <blockquote className="mt-3 select-text font-mono text-sm leading-6 text-ink" aria-label="Starter prompt">
            {STARTER_PROMPT}
          </blockquote>
          <CopyPromptButton />
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          Open the creator in a WebMCP-capable environment and paste this into your agent&apos;s chat.
        </p>
        <AgentSetupGuide />
        <p className="mt-4 text-xs leading-5 text-ink-subtle">
          Prefer to work manually? The editor works without an agent.
        </p>
      </div>
    </section>
  );
}
