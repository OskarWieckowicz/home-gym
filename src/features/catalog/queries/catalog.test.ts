import { describe, expect, it } from "vitest";

import { catalogProducts } from "@/data/products";

import { findProductBySlug, normalizeCatalogFilters, searchProducts } from "./catalog";

describe("normalizeCatalogFilters", () => {
  it("normalizes whitespace, casing, enum values, and URL-style prices", () => {
    expect(
      normalizeCatalogFilters({
        query: "  ADJUSTABLE   Dumbbells ",
        category: " WEIGHTS ",
        maxPrice: " 1800 ",
        trainingGoal: " GENERAL-FITNESS ",
      }),
    ).toEqual({
      query: "adjustable dumbbells",
      category: "weights",
      maxPrice: 1800,
      trainingGoal: "general-fitness",
    });
  });

  it.each([
    { category: "unknown", trainingGoal: "power", maxPrice: "nope" },
    { maxPrice: -1 },
    { maxPrice: 4.5 },
    { maxPrice: "" },
    { maxPrice: Number.POSITIVE_INFINITY },
  ])("ignores invalid filters without throwing: %j", (filters) => {
    expect(normalizeCatalogFilters(filters)).toEqual({});
  });
});

describe("searchProducts", () => {
  it("returns the complete catalog for missing or empty filters", () => {
    expect(searchProducts()).toEqual(catalogProducts);
    expect(searchProducts({ query: "   " })).toEqual(catalogProducts);
  });

  it("searches name, brand, category, exercise, and training goal text", () => {
    expect(searchProducts({ query: "  RANGE   adjustable " }).map(({ slug }) => slug)).toEqual([
      "range-adjustable-dumbbells",
    ]);
    expect(searchProducts({ query: "tempo harbor" })).toHaveLength(2);
    expect(searchProducts({ query: "cardio" })).toHaveLength(2);
    expect(searchProducts({ query: "hip thrust" }).map(({ slug }) => slug)).toEqual([
      "pivot-flat-bench",
    ]);
    expect(searchProducts({ query: "mobility" })).toHaveLength(2);
  });

  it("filters independently by category, inclusive maximum price, and training goal", () => {
    expect(searchProducts({ category: " benches " })).toHaveLength(2);
    expect(searchProducts({ maxPrice: 749 }).map(({ slug }) => slug)).toEqual([
      "pivot-flat-bench",
      "groundwork-mobility-kit",
    ]);
    expect(searchProducts({ trainingGoal: "MOBILITY" })).toHaveLength(2);
  });

  it("intersects filters while preserving dataset order", () => {
    expect(
      searchProducts({
        query: "press",
        category: "weights",
        maxPrice: "2200",
        trainingGoal: "strength",
      }).map(({ slug }) => slug),
    ).toEqual(["ironvale-barbell-set", "range-adjustable-dumbbells"]);
  });

  it("returns an empty array when no products match", () => {
    expect(searchProducts({ query: "underwater treadmill" })).toEqual([]);
  });

  it("ignores unknown enum values and invalid prices predictably", () => {
    expect(searchProducts({ category: "machines", trainingGoal: "speed", maxPrice: "NaN" })).toEqual(
      catalogProducts,
    );
  });

  it("does not mutate the filter object or canonical dataset", () => {
    const filters = { query: "  Press ", category: "WEIGHTS", maxPrice: "2200" };
    const filtersSnapshot = structuredClone(filters);
    const productsSnapshot = structuredClone(catalogProducts);

    searchProducts(filters);

    expect(filters).toEqual(filtersSnapshot);
    expect(catalogProducts).toEqual(productsSnapshot);
  });
});

describe("findProductBySlug", () => {
  it("finds a product using normalized slug input", () => {
    expect(findProductBySlug("  NORTHSTAR-HALF-RACK ")?.id).toBe("product_northstar_half_rack");
  });

  it("returns undefined for an unknown slug", () => {
    expect(findProductBySlug("not-a-product")).toBeUndefined();
  });
});

