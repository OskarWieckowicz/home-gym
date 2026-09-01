import Image from "next/image";
import Link from "next/link";

import { LandingActions, ProjectEntryNote } from "./landing-actions";

export function LandingHero() {
  return (
    <section aria-labelledby="landing-title" className="border-b border-line bg-linear-to-b from-canvas to-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10 lg:px-8 lg:py-14">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Your space. Your training. Your budget.
          </p>
          <h1 id="landing-title" className="mt-4 text-4xl font-bold leading-[1.14] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
            What to buy.{" "}
            <span className="text-brand">Where it fits.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-7 text-ink-muted sm:leading-8">
            Plan your home gym with an AI agent. Edit the same room together,
            while the app checks space and budget.
          </p>
          <div className="mt-6"><LandingActions /></div>
          <p className="mt-4 max-w-lg text-sm leading-6 text-ink-muted">
            AI planning needs an external agent in a WebMCP-capable environment.{" "}
            <Link href="/#agent-guide" className="rounded-sm text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              Agent guide
            </Link>
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Prefer to work manually? The editor works without an agent.
          </p>
          <div className="mt-3"><ProjectEntryNote /></div>
          <nav aria-label="Planning guide" className="mt-2 flex flex-wrap gap-x-5 text-sm text-brand md:hidden">
            <Link href="/#how-it-works" className="inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 focus-visible:outline-2">How it works</Link>
            <Link href="/#agent-guide" className="inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 focus-visible:outline-2">Agent guide</Link>
          </nav>
        </div>
        <figure className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg shadow-slate-200/50">
          <Image
            src="/images/landing/hero-room-concept.webp"
            alt="A compact bedroom and office sharing space with a weight bench, rack, punching bag, dumbbells, and a kettlebell."
            width={1040}
            height={780}
            sizes="(min-width: 1280px) 668px, (min-width: 1024px) 54vw, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
            loading="eager"
            fetchPriority="high"
            className="h-auto w-full"
          />
          <figcaption className="border-t border-line px-4 py-3 text-xs leading-5 text-ink-muted">
            <strong className="font-semibold text-ink">AI-generated room concept</strong>
            {" — "}illustrative, not an app render. Model your measurements in the creator
            and review its space and budget checks.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
