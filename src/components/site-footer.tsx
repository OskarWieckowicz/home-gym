import Link from "next/link";

import { footerLinks } from "@/lib/navigation";

export function SiteFooter() {
  return (
    <footer className="border-t border-line-strong bg-surface-muted">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p>Home Gym Creator — a prototype built for the WebMCP Challenge.</p>
          <p className="mt-2 text-xs leading-5 text-ink-muted">
            Fictional equipment catalog. Simplified geometry. Not a professional safety assessment.
          </p>
        </div>
        <div className="flex gap-5">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm text-brand transition-colors hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
