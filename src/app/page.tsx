import { LinkButton } from "@/components/ui/link-button";
import { siteLinks } from "@/lib/navigation";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Designing with an agent
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Design a home gym that actually fits your room.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink-muted">
            Give your dimensions, budget, and training goals. Pick equipment
            with an agent, place it on the plan, and see collisions and safety
            clearances checked as you go.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={siteLinks.runDemo.href}>
              {siteLinks.runDemo.label}
            </LinkButton>
            <LinkButton href={siteLinks.startEmpty.href} variant="secondary">
              {siteLinks.startEmpty.label}
            </LinkButton>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex aspect-4/3 items-center justify-center rounded-xl border border-line bg-[linear-gradient(to_right,var(--color-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] bg-[size:20px_20px] p-8 text-center text-sm text-ink-subtle">
            The 2D floor plan preview, with clearance zones and layout
            warnings, arrives with the editor.
          </div>
        </div>
      </section>
    </main>
  );
}
