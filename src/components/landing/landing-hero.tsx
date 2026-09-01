import Image from "next/image";
import Link from "next/link";

import { LandingActions, ProjectEntryNote } from "./landing-actions";

export function LandingHero() {
  return (
    <section aria-labelledby="landing-title" className="border-b border-line bg-surface">
      <div className="mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-9 sm:px-6 sm:py-10 lg:grid-cols-[minmax(26rem,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-14 lg:px-8 lg:py-12 xl:px-0">
        <div className="landing-hero-copy min-w-0 lg:pt-12">
          <p className="w-fit border-b border-dotted border-line pb-2 font-mono text-xs font-medium uppercase tracking-[0.16em] text-ink">
            Your space. Your training. Your budget.
          </p>
          <h1 id="landing-title" className="mt-5 text-4xl font-bold leading-[1.06] tracking-[-0.04em] text-ink sm:text-5xl lg:text-[3.55rem]">
            <span className="block">What to buy.</span>
            {" "}
            <span className="block">Where it fits<span className="text-brand">.</span></span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-7 text-ink-muted sm:leading-8">
            Plan your home gym with an AI agent. Edit the same room together,
            while the app checks space and budget.
          </p>
          <div className="mt-6"><LandingActions /></div>
          <p className="landing-support landing-support-agent mt-4 max-w-lg text-sm leading-6 text-ink-muted">
            AI planning needs an external agent in a WebMCP-capable environment.{" "}
            <Link href="/#agent-guide" className="rounded-sm text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              Agent guide
            </Link>
          </p>
          <p className="landing-support landing-support-manual mt-2 text-sm leading-6 text-ink-muted">
            Prefer to work manually? The editor works without an agent.
          </p>
          <div className="landing-support landing-support-saved mt-3"><ProjectEntryNote /></div>
          <nav aria-label="Planning guide" className="mt-2 flex flex-wrap gap-x-5 text-sm text-brand md:hidden">
            <Link href="/#how-it-works" className="inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 focus-visible:outline-2">How it works</Link>
            <Link href="/#agent-guide" className="inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 focus-visible:outline-2">Agent guide</Link>
          </nav>
        </div>
        <figure className="min-w-0 overflow-hidden border border-line bg-surface">
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
          <figcaption className="landing-hero-caption border-t border-line px-4 py-3 text-xs leading-5 text-ink-muted">
            <strong className="font-semibold text-ink">AI-generated room concept</strong>
            {" — "}illustrative, not an app render. Model your measurements in the creator
            and review its space and budget checks.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
