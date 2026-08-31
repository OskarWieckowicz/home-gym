import { Quote } from "lucide-react";
import Image from "next/image";

const editingSteps = [
  "Move equipment yourself.",
  "The agent reads your change and adapts the layout.",
  "Review the checks. Undo any change.",
];

export function SharedEditingSection() {
  return (
    <section aria-labelledby="shared-editing-title" className="border-t border-line py-8 sm:py-10">
      <h2 id="shared-editing-title" className="text-2xl font-bold tracking-tight sm:text-3xl">You edit. The agent continues.</h2>
      <p className="mt-3 max-w-2xl leading-7 text-ink-muted">
        Move a piece of equipment. Your agent picks up from the room as it is now.
      </p>
      <div className="mt-5 grid items-center gap-5 md:grid-cols-2 lg:gap-12">
        <Image
          src="/images/landing/shared-editing.webp"
          alt="The real top-down editor with one piece of equipment selected for manual editing."
          width={1040}
          height={780}
          sizes="(min-width: 1280px) 580px, (min-width: 768px) 47vw, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
          loading="lazy"
          className="h-auto w-full rounded-xl border border-line bg-canvas"
        />
        <div>
          <ol className="space-y-3">
            {editingSteps.map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-sm leading-6">
                <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full border border-brand text-brand">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <blockquote className="mt-5 flex gap-3 rounded-xl border border-brand-muted bg-brand-soft p-4 font-mono text-sm leading-6">
            <Quote className="shrink-0 text-brand" aria-hidden="true" size={24} />
            <p>Keep the rack here. Adjust the rest of the layout.</p>
          </blockquote>
          <p className="mt-4 text-sm leading-6 text-ink-muted">
            One shared room model, whether you or the agent makes the change.
          </p>
        </div>
      </div>
    </section>
  );
}
