import { ArrowRight, Braces, ClipboardList, ShieldCheck } from "lucide-react";

const stages = [
  { title: "Read the room", description: "The agent reads your current room, goals and budget.", icon: ClipboardList },
  { title: "Edit through WebMCP", description: "Tool changes appear directly in your project, with shared undo and redo.", icon: Braces },
  { title: "Check geometry and budget", description: "The app checks collisions, exercise clearance and total cost.", icon: ShieldCheck },
];

export function WebMcpExplainer() {
  return (
    <section aria-labelledby="webmcp-title" className="border-t border-line py-10 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Powered by WebMCP</p>
      <h2 id="webmcp-title" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">AI plans. The application checks.</h2>
      <ol className="mt-7 grid gap-6 lg:grid-cols-3">
        {stages.map(({ title, description, icon: Icon }, index) => (
          <li key={title} className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-brand-muted bg-brand-soft text-brand">
              <Icon size={27} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
            </div>
            {index < stages.length - 1 && <ArrowRight size={22} aria-hidden="true" className="mt-4 hidden shrink-0 text-slate-400 lg:block" />}
          </li>
        ))}
      </ol>
      <p className="mx-auto mt-8 max-w-2xl text-sm leading-6 text-ink-muted lg:text-center">
        The agent works with the current project. The app checks collisions,
        exercise clearance, and cost. The agent interprets the results and helps
        you weigh the trade-offs.
      </p>
    </section>
  );
}
