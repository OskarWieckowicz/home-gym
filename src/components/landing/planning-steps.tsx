import { ArrowRight } from "lucide-react";
import Image from "next/image";

const steps = [
  {
    title: "Create your room",
    description: "Set your room dimensions and obstacles, or ask your agent to help from a description or photo.",
    image: "room-with-obstacles",
    alt: "An empty room in the creator, with a door, window and fixed obstacles defined.",
  },
  {
    title: "Set your goals and budget",
    description: "Choose your training goals, preferred exercises and spending limit.",
    image: "goals-budget-symbolic",
    alt: "The same room with an illustrative card representing training goals and a confirmed budget.",
  },
  {
    title: "Choose and arrange equipment",
    description: "Choose equipment together. The agent arranges it, and the app checks space and cost.",
    image: "equipment-arrangement",
    alt: "The same room furnished with strength equipment, a punching bag, kettlebell and dumbbells.",
  },
] as const;

export function PlanningSteps() {
  return (
    <section id="how-it-works" aria-labelledby="planning-steps-title" className="scroll-mt-24 py-8 sm:py-10 lg:scroll-mt-28">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-strong">How it works</p>
      <h2 id="planning-steps-title" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        From an empty room to your home gym.
      </h2>
      <p className="mt-3 text-ink-muted">Start with your space. Build the plan together.</p>
      <ol className="mt-6 grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-x-4 md:block">
            <div className="col-span-2 mb-2 flex items-center justify-between md:mb-3">
              <span className="text-2xl font-semibold tracking-tight text-brass-strong md:text-3xl" aria-hidden="true">0{index + 1}</span>
              {index < steps.length - 1 && <ArrowRight className="hidden text-line-strong md:block" aria-hidden="true" size={26} />}
            </div>
            <Image
              src={`/images/landing/${step.image}.webp`}
              alt={step.alt}
              width={1040}
              height={780}
              sizes="(min-width: 1280px) 389px, (min-width: 768px) 31vw, 88px"
              loading="lazy"
              className="h-auto w-full rounded-lg border border-line-strong bg-surface-muted shadow-card"
            />
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight md:mt-4 md:text-lg">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-ink-muted md:mt-2">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 max-w-2xl text-xs leading-5 text-ink-muted">
        Using a photo? Share it with your external agent, not the editor. Provide
        reference measurements and review the model.
      </p>
    </section>
  );
}
