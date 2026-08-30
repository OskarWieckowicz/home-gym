// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteHeaderNav } from "./site-header-nav";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
afterEach(cleanup);

describe("SiteHeaderNav", () => {
  it.each(["/", "/catalog", "/creator"])("keeps absolute section anchors from %s", (pathname) => {
    route.pathname = pathname;
    render(<SiteHeaderNav />);
    for (const [name, href] of [["How it works", "/#how-it-works"], ["Agent guide", "/#agent-guide"]]) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")).toBe(href);
      expect(link.hasAttribute("aria-current")).toBe(false);
    }
  });

  it.each([["/catalog", true], ["/catalog/northstar", true], ["/catalog-other", false], ["/", false]])(
    "matches Catalog active state for %s",
    (pathname, active) => {
      route.pathname = pathname as string;
      render(<SiteHeaderNav />);
      expect(screen.getByRole("link", { name: "Catalog" }).getAttribute("aria-current"))
        .toBe(active ? "page" : null);
    },
  );
});
