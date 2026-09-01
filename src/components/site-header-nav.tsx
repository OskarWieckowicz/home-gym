"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { headerLinks } from "@/lib/navigation";

function linkPath(href: string) {
  return href.split(/[?#]/)[0];
}

export function SiteHeaderNav() {
  const pathname = usePathname();

  return (
    <div className="hidden items-stretch justify-center self-stretch md:flex">
      {headerLinks.map((link) => {
        const activePath = linkPath(link.href);
        const isActive = !link.href.includes("#") && (
          activePath === "/" ? pathname === "/" :
            pathname === activePath || pathname.startsWith(`${activePath}/`)
        );

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className="relative flex min-h-12 items-center rounded-sm px-5 text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aria-[current=page]:text-brand after:absolute after:inset-x-5 after:bottom-[-0.8rem] after:h-px after:bg-transparent aria-[current=page]:after:bg-brass-strong"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
