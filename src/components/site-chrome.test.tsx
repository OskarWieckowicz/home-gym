// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteChrome } from "./site-chrome";
const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
afterEach(cleanup);

describe("SiteChrome", () => {
  it("removes marketing chrome only in the creator, including client route transitions", () => {
    route.pathname = "/";
    const { rerender } = render(<SiteChrome><nav>Site navigation</nav></SiteChrome>);
    expect(screen.getByRole("navigation")).toBeTruthy();
    route.pathname = "/creator";
    rerender(<SiteChrome><nav>Site navigation</nav></SiteChrome>);
    expect(screen.queryByRole("navigation")).toBeNull();
    route.pathname = "/catalog";
    rerender(<SiteChrome><nav>Site navigation</nav></SiteChrome>);
    expect(screen.getByRole("navigation")).toBeTruthy();
  });
});
