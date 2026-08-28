import { describe, expect, it, vi } from "vitest";

import { catalogProducts } from "@/data/products";

import {
  createGetProductDetailsHandler,
  createSearchProductsHandler,
  type CatalogToolService,
} from "./catalog-tool-handlers";

const options = () => ({ signal: new AbortController().signal });

describe("search_products handler", () => {
  it("supports runtimes that omit execute options", () => {
    expect(createSearchProductsHandler()({})).toMatchObject({
      ok: true,
      tool: "search_products",
      matchCount: catalogProducts.length,
    });
    expect(createSearchProductsHandler()({}, {})).toMatchObject({ ok: true });
  });

  it("returns the complete starter catalog with compact summaries", () => {
    const result = createSearchProductsHandler()({}, options());

    expect(result).toMatchObject({
      ok: true,
      tool: "search_products",
      filters: {},
      matchCount: catalogProducts.length,
    });
    if (!result.ok) throw new Error("Expected a successful result.");
    expect(result.products[0]).toEqual({
      productId: catalogProducts[0].id,
      slug: catalogProducts[0].slug,
      name: catalogProducts[0].name,
      brand: catalogProducts[0].brand,
      category: catalogProducts[0].category,
      price: catalogProducts[0].price,
      dimensions: catalogProducts[0].dimensions,
      trainingGoals: catalogProducts[0].trainingGoals,
      exercises: catalogProducts[0].exercises,
    });
    expect(result.products[0]).not.toHaveProperty("requirements");
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("uses manual catalog semantics for combined filters and preserves order", () => {
    const result = createSearchProductsHandler()(
      {
        query: "press",
        category: "weights",
        maxPrice: 2200,
        trainingGoal: "strength",
      },
      options(),
    );

    if (!result.ok) throw new Error("Expected a successful result.");
    expect(result.filters).toEqual({
      query: "press",
      category: "weights",
      maxPrice: 2200,
      trainingGoal: "strength",
    });
    expect(result.products.map(({ slug }) => slug)).toEqual([
      "ironvale-barbell-set",
      "range-adjustable-dumbbells",
    ]);
  });

  it("returns a successful explicit empty product list", () => {
    const result = createSearchProductsHandler()({ query: "underwater treadmill" }, options());
    expect(result).toMatchObject({ ok: true, matchCount: 0, products: [] });
  });

  it("returns stable invalid-input issues", () => {
    const result = createSearchProductsHandler()({ maxPrice: -1, extra: true }, options());
    expect(result).toMatchObject({
      ok: false,
      tool: "search_products",
      error: { code: "INVALID_INPUT", message: "Search filters are invalid." },
    });
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("redacts unexpected catalog failures", () => {
    const service: CatalogToolService = {
      searchProducts: vi.fn(() => {
        throw new Error("sensitive implementation details");
      }),
      findProductById: vi.fn(),
    };
    const result = createSearchProductsHandler(service)({}, options());
    expect(result).toEqual({
      ok: false,
      tool: "search_products",
      error: {
        code: "EXECUTION_FAILED",
        message: "Product search could not be completed.",
      },
    });
    expect(JSON.stringify(result)).not.toContain("sensitive");
  });
});

describe("get_product_details handler", () => {
  it("supports runtimes that omit execute options or its signal", () => {
    const productId = catalogProducts[0].id;
    expect(createGetProductDetailsHandler()({ productId })).toMatchObject({ ok: true });
    expect(createGetProductDetailsHandler()({ productId }, {})).toMatchObject({ ok: true });
  });

  it("returns a complete copied product record", () => {
    const product = catalogProducts[0];
    const result = createGetProductDetailsHandler()({ productId: product.id }, options());

    expect(result).toEqual({
      ok: true,
      tool: "get_product_details",
      product,
    });
    if (!result.ok) throw new Error("Expected a successful result.");
    expect(result.product).not.toBe(product);
    expect(result.product.dimensions).not.toBe(product.dimensions);
    expect(result.product.exercises).not.toBe(product.exercises);
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("distinguishes malformed and unknown product IDs", () => {
    expect(createGetProductDetailsHandler()({ productId: "bad-id" }, options())).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT" },
    });
    expect(
      createGetProductDetailsHandler()({ productId: "product_not_in_catalog" }, options()),
    ).toEqual({
      ok: false,
      tool: "get_product_details",
      error: {
        code: "PRODUCT_NOT_FOUND",
        message: "No catalog product exists with this product ID.",
      },
    });
  });

  it("returns a stable cancellation result without calling the catalog", () => {
    const controller = new AbortController();
    const service: CatalogToolService = {
      searchProducts: vi.fn(),
      findProductById: vi.fn(),
    };
    controller.abort();

    expect(
      createGetProductDetailsHandler(service)(
        { productId: "product_northstar_half_rack" },
        { signal: controller.signal },
      ),
    ).toMatchObject({ ok: false, error: { code: "EXECUTION_FAILED" } });
    expect(service.findProductById).not.toHaveBeenCalled();
  });

  it("redacts unexpected lookup failures", () => {
    const service: CatalogToolService = {
      searchProducts: vi.fn(),
      findProductById: vi.fn(() => {
        throw new Error("private failure");
      }),
    };
    const result = createGetProductDetailsHandler(service)(
      { productId: "product_northstar_half_rack" },
      options(),
    );
    expect(result).toMatchObject({ ok: false, error: { code: "EXECUTION_FAILED" } });
    expect(JSON.stringify(result)).not.toContain("private failure");
  });
});
