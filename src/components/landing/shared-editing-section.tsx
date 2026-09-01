import { ArrowRight, Quote } from "lucide-react";

const editingSteps = [
  {
    title: "You make a change",
    description: "Move equipment yourself.",
  },
  {
    title: "The room stays shared",
    description: "The agent reads the room as it is now.",
  },
  {
    title: "The agent continues",
    description: "It adapts the layout. Review the checks or undo.",
  },
];

export function SharedEditingSection() {
  return (
    <section aria-labelledby="shared-editing-title" className="border-t border-line py-8 sm:py-10">
      <h2 id="shared-editing-title" className="text-2xl font-bold tracking-tight sm:text-3xl">You edit. The agent continues.</h2>
      <p className="mt-3 max-w-2xl leading-7 text-ink-muted">
        Move a piece of equipment. Your agent picks up from the room as it is now.
      </p>
      <div className="mt-5 rounded-xl border border-line-strong bg-surface p-5 shadow-card sm:p-6">
        <ol className="grid gap-3 md:grid-cols-3 md:gap-8">
          {editingSteps.map((step, index) => (
            <li key={step.title} className="relative flex gap-3 rounded-md border border-line bg-surface-muted p-4 md:block">
              <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full border border-brass text-sm font-semibold text-brass-strong">{index + 1}</span>
              <div className="min-w-0 md:mt-4">
                <h3 className="font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-muted">{step.description}</p>
              </div>
              {index < editingSteps.length - 1 && (
                <ArrowRight className="absolute -right-7 top-1/2 hidden -translate-y-1/2 text-line-strong md:block" aria-hidden="true" size={22} />
              )}
            </li>
          ))}
        </ol>
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <blockquote className="flex gap-3 rounded-md border border-brand-muted bg-brand-soft p-4 font-mono text-sm leading-6">
            <Quote className="shrink-0 text-brand" aria-hidden="true" size={24} />
            <p>Keep the rack here. Adjust the rest of the layout.</p>
          </blockquote>
          <p className="max-w-md text-sm leading-6 text-ink-muted">
            One shared room model, whether you or the agent makes the change.
          </p>
        </div>
      </div>
    </section>
  );
}
