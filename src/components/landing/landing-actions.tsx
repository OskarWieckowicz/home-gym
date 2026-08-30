import Link from "next/link";

import { LinkButton } from "@/components/ui/link-button";
import { siteLinks } from "@/lib/navigation";

export function LandingActions() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LinkButton href={siteLinks.startEmpty.href}>
        {siteLinks.startEmpty.label}
      </LinkButton>
      <LinkButton href={siteLinks.runDemo.href} variant="quiet" className="text-brand">
        {siteLinks.runDemo.label}
      </LinkButton>
    </div>
  );
}

export function ProjectEntryNote() {
  return (
    <p className="max-w-xl text-xs leading-5 text-ink-subtle">
      Starting fresh or exploring the sample replaces your saved project. Use{" "}
      <Link
        href={siteLinks.openCreator.href}
        className="rounded-sm underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-brand"
      >
        {siteLinks.openCreator.label}
      </Link>{" "}
      to continue it.
    </p>
  );
}
