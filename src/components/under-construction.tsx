import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import type { SiteLink } from "@/lib/navigation";

type UnderConstructionProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly upcoming: readonly string[];
  readonly action: SiteLink;
};

export function UnderConstruction({
  eyebrow,
  title,
  description,
  upcoming,
  action,
}: UnderConstructionProps) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-muted">
        {description}
      </p>
      <Card className="mt-10 p-6 sm:p-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
          Coming next
        </h2>
        <ul className="mt-4 space-y-2.5 text-ink-muted">
          {upcoming.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="font-semibold text-brand">
                →
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="mt-8">
        <LinkButton href={action.href} variant="secondary">
          {action.label}
        </LinkButton>
      </div>
    </main>
  );
}
