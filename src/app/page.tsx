export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 py-16 text-stone-50">
      <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur sm:p-12">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-lime-400">
          Home Gym Creator
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Design a gym that actually fits your home.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-stone-300">
          The Next.js foundation is ready. We can now build the shared room
          planner for people and AI agents.
        </p>
        <div className="mt-10 flex flex-wrap gap-3 text-sm text-stone-300">
          {["Next.js App Router", "TypeScript", "Tailwind CSS", "ESLint"].map(
            (technology) => (
              <span
                key={technology}
                className="rounded-full border border-white/10 bg-black/20 px-4 py-2"
              >
                {technology}
              </span>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
