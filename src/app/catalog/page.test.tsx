// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.queryByText("Best match")).toBeNull();
    expect(screen.queryByText("Ready for room planning")).toBeNull();
    const search = screen.getByRole("searchbox", { name: "Search equipment" }) as HTMLInputElement;
    const submit = screen.getByRole("button", { name: "Search" }) as HTMLButtonElement;
    expect(search.form?.id).toBe("catalog-filters");
    expect(submit.form).toBe(search.form);
    const disclosure = screen.getByRole("button", { name: "Filters" });
    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(disclosure);
    expect(disclosure.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector("select[name='exercise']")?.children.length).toBeGreaterThan(1);
  });

  it("renders normalized labels for the complete filter surface", async () => {
    render(
      await CatalogPage({
        searchParams: Promise.resolve({
          query: " press ",
          category: "free-weights",
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
    expect(activeFilters.textContent).toContain("Category: Free Weights");
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
