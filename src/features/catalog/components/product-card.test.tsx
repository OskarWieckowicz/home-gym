// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { catalogProducts } from "@/data/products";
import { ProductCard } from "./product-card";

afterEach(cleanup);

describe("ProductCard", () => {
  it.each([undefined, "recommended", "required"] as const)("reports anchoring %s without claiming room fit", (anchoring) => {
    const product = { ...catalogProducts[0], requirements: { anchoring } };
    render(<ProductCard product={product} />);
    expect(screen.getByText(anchoring ? `Anchoring ${anchoring}` : "No anchoring required")).toBeTruthy();
    expect(screen.queryByText("Ready for room planning")).toBeNull();
    const plan = screen.getByRole("link", { name: `Plan with this equipment: ${product.name}` });
    expect(plan.getAttribute("href")).toBe(`/creator?product=${product.id}`);
    expect(screen.getByRole("link", { name: `View details for ${product.name}` }).getAttribute("href")).toBe(`/catalog/${product.slug}`);
  });

  it("distinguishes the physical footprint from an asymmetric exercise envelope", () => {
    render(<ProductCard product={{
      ...catalogProducts[0],
      dimensions: { widthCm: 100, depthCm: 50, heightCm: 200 },
      useZone: { leftCm: 20, rightCm: 30, frontCm: 40, backCm: 10 },
    }} />);
    expect(screen.getByText("Footprint (W × D)")).toBeTruthy();
    expect(screen.getByText("100 × 50 cm")).toBeTruthy();
    expect(screen.getByText("Exercise space")).toBeTruthy();
    expect(screen.getByText("150 × 100 cm")).toBeTruthy();
  });

  it("describes selection-only accessories without an implied floor placement", () => {
    const product = catalogProducts.find((entry) => entry.placementMode === "selection-only")!;
    render(<ProductCard product={product} />);
    expect(screen.getByText("List item · no floor placement")).toBeTruthy();
    expect(screen.queryByText("Exercise space")).toBeNull();
    expect(screen.getByRole("link", { name: `Plan this accessory: ${product.name}` }).getAttribute("href")).toBe(`/creator?product=${product.id}`);
  });
});
