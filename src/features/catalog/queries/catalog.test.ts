import { describe, expect, it } from "vitest";

import { catalogProducts } from "@/data/products";
import { ANCHORING_FILTER_VALUES } from "@/features/catalog/schemas";

import {
  findProductById,
  findProductBySlug,
  getCatalogExerciseOptions,
  getEffectiveAnchoring,
  getEffectiveRequiredHeightCm,
  normalizeCatalogFilters,
  searchProducts,
} from "./catalog";

describe("normalizeCatalogFilters", () => {
  it("normalizes whitespace, casing, enum values, and URL-style prices", () => {
    expect(
      normalizeCatalogFilters({
        query: "  ADJUSTABLE   Dumbbells ",
        category: " DUMBBELLS ",
        maxPrice: " 1800 ",
        maxWidthCm: " 80 ",
        maxDepthCm: 60,
        maxHeightCm: "50",
        trainingGoal: " GENERAL-FITNESS ",
        exercise: "  DUMBBELL   PRESS ",
        availableCeilingHeightCm: " 220 ",
        anchoring: " NONE ",
      }),
    ).toEqual({
      query: "adjustable dumbbells",
      category: "dumbbells",
      maxPrice: 1800,
      maxWidthCm: 80,
      maxDepthCm: 60,
      maxHeightCm: 50,
      trainingGoal: "general-fitness",
      exercise: "dumbbell press",
      availableCeilingHeightCm: 220,
      anchoring: "none",
    });
  });

  it.each([
    {
      category: "unknown",
      trainingGoal: "power",
      maxPrice: "nope",
      maxWidthCm: "wide",
      maxDepthCm: -1,
      maxHeightCm: 2.5,
      availableCeilingHeightCm: Number.POSITIVE_INFINITY,
      anchoring: "sometimes",
    },
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
    const product = catalogProducts[0];
    expect(searchProducts({ query: product.name })).toContainEqual(product);
    expect(searchProducts({ query: product.brand })).toContainEqual(product);
    expect(searchProducts({ query: product.category })).toContainEqual(product);
    expect(searchProducts({ query: product.exercises[0] })).toContainEqual(product);
    expect(searchProducts({ query: product.trainingGoals[0] })).toContainEqual(product);
  });

  it("filters independently by exact category and training goal", () => {
    const product = catalogProducts[0];
    expect(searchProducts({ category: product.category })).toContainEqual(product);
    expect(searchProducts({ trainingGoal: product.trainingGoals[0] })).toContainEqual(product);
  });

  it.each([
    ["maxPrice", (product: (typeof catalogProducts)[number]) => product.price],
    ["maxWidthCm", (product: (typeof catalogProducts)[number]) => product.dimensions.widthCm],
    ["maxDepthCm", (product: (typeof catalogProducts)[number]) => product.dimensions.depthCm],
    ["maxHeightCm", (product: (typeof catalogProducts)[number]) => product.dimensions.heightCm],
    ["availableCeilingHeightCm", getEffectiveRequiredHeightCm],
  ] as const)("applies inclusive %s boundaries", (field, valueOf) => {
    const product = catalogProducts[0];
    const boundary = valueOf(product);
    expect(searchProducts({ [field]: boundary })).toContainEqual(product);
    expect(searchProducts({ [field]: boundary - 1 })).not.toContainEqual(product);
  });

  it("matches normalized exercises exactly rather than by substring", () => {
    const product = catalogProducts[0];
    const exercise = product.exercises[0];
    expect(searchProducts({ exercise: `  ${exercise.toUpperCase()}  ` })).toContainEqual(product);
    expect(searchProducts({ exercise: exercise.slice(0, -1) })).not.toContainEqual(product);
  });

  it("uses effective physical height and anchoring defaults", () => {
    const implicitHeight = catalogProducts.find(
      ({ requirements }) => requirements.minimumCeilingHeightCm === undefined,
    );
    const implicitAnchoring = catalogProducts.find(
      ({ requirements }) => requirements.anchoring === undefined,
    );
    expect(implicitHeight).toBeDefined();
    expect(implicitAnchoring).toBeDefined();
    if (!implicitHeight || !implicitAnchoring) return;

    expect(getEffectiveRequiredHeightCm(implicitHeight)).toBe(implicitHeight.dimensions.heightCm);
    expect(getEffectiveAnchoring(implicitAnchoring)).toBe("none");
    expect(searchProducts({ anchoring: "none" })).toContainEqual(implicitAnchoring);
  });

  it.each(ANCHORING_FILTER_VALUES)("filters exact effective anchoring value %s", (anchoring) => {
    const results = searchProducts({ anchoring });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => getEffectiveAnchoring(product) === anchoring)).toBe(true);
  });

  it("intersects every filter while preserving canonical dataset order", () => {
    const product = catalogProducts.find(
      (candidate) => getEffectiveAnchoring(candidate) === "none",
    );
    expect(product).toBeDefined();
    if (!product) return;
    const filters = {
      query: product.brand,
      category: product.category,
      maxPrice: product.price,
      maxWidthCm: product.dimensions.widthCm,
      maxDepthCm: product.dimensions.depthCm,
      maxHeightCm: product.dimensions.heightCm,
      trainingGoal: product.trainingGoals[0],
      exercise: product.exercises[0],
      availableCeilingHeightCm: getEffectiveRequiredHeightCm(product),
      anchoring: getEffectiveAnchoring(product),
    };
    const results = searchProducts(filters);
    expect(results).toContainEqual(product);
    expect(results).toEqual(catalogProducts.filter((candidate) => results.includes(candidate)));
  });

  it("returns an empty array when no products match", () => {
    expect(searchProducts({ query: "underwater treadmill" })).toEqual([]);
  });

  it("ignores unknown enum values and invalid numeric limits predictably", () => {
    expect(searchProducts({ category: "machines", trainingGoal: "speed", maxPrice: "NaN" })).toEqual(
      catalogProducts,
    );
  });

  it("does not mutate the filter object or canonical dataset", () => {
    const filters = { query: "  Press ", category: "DUMBBELLS", maxPrice: "2200" };
    const filtersSnapshot = structuredClone(filters);
    const productsSnapshot = structuredClone(catalogProducts);

    searchProducts(filters);

    expect(filters).toEqual(filtersSnapshot);
    expect(catalogProducts).toEqual(productsSnapshot);
  });
});

describe("getCatalogExerciseOptions", () => {
  it("returns sorted unique display values using normalized identity", () => {
    const [product] = catalogProducts;
    const options = getCatalogExerciseOptions([
      product,
      { ...product, exercises: [product.exercises[0].toUpperCase(), "  New   movement "] },
    ]);
    expect(options.filter((value) => value.toLowerCase() === product.exercises[0].toLowerCase())).toHaveLength(1);
    expect(options).toContain("New movement");
    expect(options).toEqual(
      [...options].sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" })),
    );
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

describe("findProductById", () => {
  it("finds a product by its canonical ID", () => {
    expect(findProductById("product_northstar_half_rack")?.slug).toBe(
      "northstar-half-rack",
    );
  });

  it("returns undefined for an unknown ID", () => {
    expect(findProductById("product_not_in_catalog")).toBeUndefined();
  });
});
