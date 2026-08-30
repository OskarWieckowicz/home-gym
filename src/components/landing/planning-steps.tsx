import { ArrowRight } from "lucide-react";
import Image from "next/image";

const steps = [
  {
    title: "Create your room",
    description: "Draw it yourself, or ask your agent to build it from a description or photo.",
    note: "For photos, provide reference measurements and review the model. Share the photo with your external agent, not the editor.",
    image: "room",
    alt: "An empty room in the creator, with its fixed obstacle and room geometry defined.",
  },
  {
    title: "Set your goals and budget",
    description: "Tell the agent what you want to train, your preferred exercises, and how much you can spend.",
    note: null,
    image: "goals",
    alt: "The same room with the creator’s real project settings for training goals and a budget in PLN.",
  },
  {
    title: "Choose and arrange equipment",
    description: "The agent selects equipment, plans the layout, and checks space and cost with the app.",
    note: null,
    image: "layout",
    alt: "The same room furnished with gym equipment and visible exercise clearance zones.",
  },
] as const;

export function PlanningSteps() {
  return (
    <section id="how-it-works" aria-labelledby="planning-steps-title" className="scroll-mt-32 py-12 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">How it works</p>
      <h2 id="planning-steps-title" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        From an empty room to your home gym.
      </h2>
      <p className="mt-3 text-ink-muted">Start with your space. Build the plan together.</p>
      <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
        {steps.map((step, index) => (
          <li key={step.title} className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-3xl font-semibold tracking-tight text-brand" aria-hidden="true">0{index + 1}</span>
              {index < steps.length - 1 && <ArrowRight className="hidden text-slate-400 md:block" aria-hidden="true" size={26} />}
            </div>
            <Image
              src={`/images/landing/${step.image}.webp`}
              alt={step.alt}
              width={1040}
              height={780}
              sizes="(min-width: 1280px) 389px, (min-width: 768px) 31vw, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
              loading="lazy"
              className="h-auto w-full rounded-xl border border-line bg-canvas"
            />
            <h3 className="mt-4 text-lg font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{step.description}</p>
            {step.note && <p className="mt-2 text-xs leading-5 text-ink-subtle">{step.note}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
