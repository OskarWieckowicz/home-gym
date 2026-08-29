import { HeroPlanSketch } from "@/components/landing/hero-plan-sketch";
import { Card } from "@/components/ui/card";
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
            with an agent, place it on the plan, and see collisions and use
            zones checked as you go.
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
        <Card className="p-4">
          <HeroPlanSketch />
          <p className="mt-3 rounded-lg bg-caution-soft px-3 py-2 text-sm text-caution">
            Bench use zone is tight against the rack — the kind of warning the
            planner will raise.
          </p>
        </Card>
      </section>
    </main>
  );
}
