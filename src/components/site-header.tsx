import { Suspense } from "react";

import { BrandMark } from "@/components/brand-mark";
import { SiteHeaderNav } from "@/components/site-header-nav";
import { LinkButton } from "@/components/ui/link-button";
import { siteLinks } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <nav
        aria-label="Main"
        className="mx-auto grid w-full max-w-[96rem] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 sm:px-6 lg:px-8"
      >
        <BrandMark />
        <Suspense fallback={null}>
          <SiteHeaderNav />
        </Suspense>
        <LinkButton href={siteLinks.openCreator.href} className="rounded-none px-7">
          {siteLinks.openCreator.label}
        </LinkButton>
      </nav>
    </header>
  );
}
