import { Dumbbell } from "lucide-react";
import Link from "next/link";

import { siteLinks } from "@/lib/navigation";

export function BrandMark() {
  return (
    <Link
      href={siteLinks.logo.href}
      className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
        <Dumbbell aria-hidden="true" className="size-4.5" />
      </span>
      <span className="sr-only sm:not-sr-only">{siteLinks.logo.label}</span>
    </Link>
  );
}
