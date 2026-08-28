// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { catalogProducts } from "@/data/products";

import CatalogPage from "./page";

afterEach(cleanup);

describe("catalog route", () => {
  it("renders the complete catalog and shared exercise choices", async () => {
    render(await CatalogPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText(`${catalogProducts.length} products`)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Equipment for your home gym" })).toBeTruthy();
    expect(screen.getByRole("searchbox", { name: "Search equipment" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Your project" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Exercise" }).children.length).toBeGreaterThan(1);
  });

  it("renders normalized labels for the complete filter surface", async () => {
    render(
      await CatalogPage({
        searchParams: Promise.resolve({
          query: " press ",
          category: "barbells",
          maxPrice: "2500",
          maxWidthCm: "220",
          maxDepthCm: "80",
          maxHeightCm: "60",
          trainingGoal: "strength",
          exercise: "overhead press",
          availableCeilingHeightCm: "230",
          anchoring: "none",
        }),
      }),
    );

    const activeFilters = screen.getByRole("list", { name: "Active filters" });
    expect(activeFilters.textContent).toContain("Search: “press”");
    expect(activeFilters.textContent).toContain("Category: Barbells");
    expect(activeFilters.textContent).toContain("Goal: Strength");
    expect(activeFilters.textContent).toContain("Up to");
    expect(activeFilters.textContent).toContain("Width ≤ 220 cm");
    expect(activeFilters.textContent).toContain("Depth ≤ 80 cm");
    expect(activeFilters.textContent).toContain("Height ≤ 60 cm");
    expect(activeFilters.textContent).toContain("Exercise: Overhead press");
    expect(activeFilters.textContent).toContain("Ceiling: 230 cm");
    expect(activeFilters.textContent).toContain("Anchoring: None");
  });
});
