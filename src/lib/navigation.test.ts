import { describe, expect, it } from "vitest";

import { creatorRoute, headerLinks, parseCreatorStartMode, productRoute, routes, siteLinks } from "./navigation";

describe("navigation", () => {
  it("keeps the destinations defined by the landing page specification", () => {
    expect({
      logo: siteLinks.logo.href,
      catalog: siteLinks.catalog.href,
      openCreator: siteLinks.openCreator.href,
      runDemo: siteLinks.runDemo.href,
      startEmpty: siteLinks.startEmpty.href,
      openSampleProject: siteLinks.openSampleProject.href,
      designMyGym: siteLinks.designMyGym.href,
    }).toEqual({
      logo: "/",
      catalog: "/catalog",
      openCreator: "/creator",
      runDemo: "/creator?start=demo",
      startEmpty: "/creator?start=new",
      openSampleProject: "/creator?start=demo",
      designMyGym: "/creator?start=new",
    });
  });

  it("builds creator routes from the supported start modes", () => {
    expect(creatorRoute("demo")).toBe(`${routes.creator}?start=demo`);
    expect(creatorRoute("new")).toBe(`${routes.creator}?start=new`);
  });

  it("builds canonical product routes", () => {
    expect(productRoute("forge-fold-rack")).toBe(
      "/catalog/forge-fold-rack",
    );
  });

  it("provides the mockup navigation destinations", () => {
    expect(headerLinks).toEqual([
      { label: "How it works", href: "/" },
      { label: "Creator", href: "/creator" },
      { label: "Catalog", href: "/catalog" },
    ]);
  });

  it.each(["demo", "new"])("parses the explicit %s start action", (mode) => {
    expect(parseCreatorStartMode(mode)).toBe(mode);
  });

  it.each([undefined, null, "DEMO", "", ["demo"], "resume", 1])(
    "ignores unsupported start value %j", (value) => {
      expect(parseCreatorStartMode(value)).toBeNull();
    },
  );
});
