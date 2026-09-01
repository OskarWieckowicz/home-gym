import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { LinkButton } from "@/components/ui/link-button";
import { siteLinks } from "@/lib/navigation";

export function LandingActions() {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <LinkButton href={siteLinks.startEmpty.href} className="min-h-11 justify-between gap-7 rounded-none px-6">
        {siteLinks.startEmpty.label}
        <ArrowRight aria-hidden="true" size={18} />
      </LinkButton>
      <LinkButton href={siteLinks.runDemo.href} variant="secondary" className="min-h-11 justify-between gap-3 rounded-none px-4">
        {siteLinks.runDemo.label}
        <ArrowRight aria-hidden="true" size={18} />
      </LinkButton>
    </div>
  );
}

export function ProjectEntryNote() {
  return (
    <p className="max-w-xl text-xs leading-5 text-ink-subtle">
      Have a saved project?{" "}
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
