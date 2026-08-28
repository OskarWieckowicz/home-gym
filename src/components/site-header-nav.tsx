"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { headerLinks } from "@/lib/navigation";

function linkPath(href: string) {
  return href.split("?")[0];
}

export function SiteHeaderNav() {
  const pathname = usePathname();

  return (
    <div className="hidden items-stretch justify-center self-stretch md:flex">
      {headerLinks.map((link) => {
        const activePath = linkPath(link.href);
        const isActive =
          activePath === "/" ? pathname === "/" : pathname.startsWith(activePath);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className="relative flex min-h-12 items-center px-5 text-sm font-medium text-ink-muted transition hover:text-ink aria-[current=page]:text-brand after:absolute after:inset-x-4 after:bottom-[-0.8rem] after:h-0.5 after:rounded-full after:bg-transparent aria-[current=page]:after:bg-brand"
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
