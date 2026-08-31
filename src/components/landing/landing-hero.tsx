import Image from "next/image";
import Link from "next/link";

import { LandingActions, ProjectEntryNote } from "./landing-actions";

export function LandingHero() {
  return (
    <section aria-labelledby="landing-title" className="border-b border-line bg-linear-to-b from-canvas to-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-9 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10 lg:px-8 lg:py-16">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Your space. Your training. Your budget.
          </p>
          <h1 id="landing-title" className="mt-4 text-4xl font-bold leading-[1.14] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
            What to buy.{" "}
            <span className="text-brand">Where it fits.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-ink-muted">
            Create your room, describe how you train, and set a budget. An AI
            agent helps you choose equipment and arrange it to fit.
          </p>
          <div className="mt-7"><LandingActions /></div>
          <p className="mt-5 text-sm text-ink-muted">
            Build it yourself or let your agent guide you.
          </p>
          <div className="mt-3"><ProjectEntryNote /></div>
          <nav aria-label="Planning guide" className="mt-5 flex flex-wrap gap-5 text-sm text-brand md:hidden">
            <Link href="/#how-it-works" className="rounded-sm underline underline-offset-4 focus-visible:outline-2">How it works</Link>
            <Link href="/#agent-guide" className="rounded-sm underline underline-offset-4 focus-visible:outline-2">Agent guide</Link>
          </nav>
        </div>
        <figure className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg shadow-slate-200/50">
          <Image
            src="/images/landing/layout.webp"
            alt="The real 3D creator with equipment arranged in a room and exercise clearance zones visible."
            width={1040}
            height={780}
            sizes="(min-width: 1280px) 668px, (min-width: 1024px) 54vw, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
            loading="eager"
            fetchPriority="high"
            className="h-auto w-full"
          />
          <figcaption className="border-t border-line px-4 py-3 text-xs leading-5 text-ink-muted">
            A real project in the creator. Check the warnings as you refine your layout.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
