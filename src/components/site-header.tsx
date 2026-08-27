import { BrandMark } from "@/components/brand-mark";
import { LinkButton } from "@/components/ui/link-button";
import { headerLinks, siteLinks } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-3"
      >
        <BrandMark />
        <div className="flex items-center gap-2">
          {headerLinks.map((link) => (
            <LinkButton key={link.href} href={link.href} variant="quiet">
              {link.label}
            </LinkButton>
          ))}
          <LinkButton href={siteLinks.openCreator.href}>
            {siteLinks.openCreator.label}
          </LinkButton>
        </div>
      </nav>
    </header>
  );
}
