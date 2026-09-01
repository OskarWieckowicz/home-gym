import { LandingActions, ProjectEntryNote } from "./landing-actions";

export function LandingClosing() {
  return (
    <section aria-labelledby="landing-closing-title" className="mb-10 rounded-xl border border-line-strong bg-surface-muted px-5 py-6 shadow-card sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <h2 id="landing-closing-title" className="text-2xl font-bold tracking-tight">Ready to plan your space?</h2>
        <LandingActions />
      </div>
      <div className="mt-4"><ProjectEntryNote /></div>
    </section>
  );
}
