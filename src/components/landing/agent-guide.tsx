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
            Copy the starter prompt. Open this website in your agent&apos;s WebMCP-capable browser.
            Follow the <a className={guideLinkClass} href="https://learn.chatgpt.com/docs/webmcp">official site tools guide</a> for supported environments and setup.
          </li>
          <li>
            Choose <Link className={guideLinkClass} href={siteLinks.startEmpty.href}>Start planning</Link> for
            a new room. You&apos;ll be asked before replacing a saved project.
          </li>
          <li>
            Paste the prompt into the external agent&apos;s chat.
            Keep the creator tab open in that same session, and ask the agent to
            use its tools.
          </li>
        </ol>
        <ProjectEntryNote />
        <p>
          Tools become available in the creator, not on this landing page.
          Opening a project does not launch an agent.
        </p>
        <p>
          To edit manually, use Room → Room dimensions for measurements and
          Project → Settings for budget and training goals.
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
    <section id="agent-guide" aria-labelledby="agent-guide-title" className="grid scroll-mt-24 gap-5 rounded-2xl border border-line bg-canvas p-5 sm:gap-7 sm:p-8 lg:scroll-mt-28 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
      <div>
        <h2 id="agent-guide-title" className="text-2xl font-bold tracking-tight sm:text-3xl">Let your agent guide you.</h2>
        <p className="mt-3 max-w-sm leading-7 text-ink-muted">
          Start a conversation. Your agent asks for the room details, training
          goals and budget it needs.
        </p>
        <p className="mt-3 max-w-sm text-sm leading-6 text-ink-muted">
          Use your external agent on the open creator page. There is no in-app chatbot.
        </p>
        <AgentSetupGuide />
        <MessageCircle className="mt-5 hidden text-brand lg:block" size={44} strokeWidth={1.25} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Starter prompt</p>
          <blockquote className="mt-3 whitespace-pre-wrap select-text font-mono text-sm leading-6 text-ink" aria-label="Starter prompt">
            {STARTER_PROMPT}
          </blockquote>
          <CopyPromptButton />
        </div>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          Paste this into your agent&apos;s chat while the creator is open.
        </p>
      </div>
    </section>
  );
}
