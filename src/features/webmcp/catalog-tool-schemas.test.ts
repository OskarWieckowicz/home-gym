import { describe, expect, it } from "vitest";
import { PRODUCT_CATEGORIES } from "@/features/catalog/schemas";

import {
  getProductDetailsInputSchema,
  getProductDetailsJsonSchema,
  mapInputIssues,
  searchProductsInputSchema,
  searchProductsJsonSchema,
} from "./catalog-tool-schemas";

describe("catalog tool input schemas", () => {
  it.each(PRODUCT_CATEGORIES)("accepts the current %s category", (category) => {
    expect(searchProductsInputSchema.parse({ category })).toEqual({ category });
  });

  it.each(["barbells", "plates", "dumbbells", "cardio", "accessories"])(
    "rejects the historical %s search category", (category) => {
      expect(searchProductsInputSchema.safeParse({ category }).success).toBe(false);
    },
  );

  it("accepts an empty search and valid combined filters", () => {
    expect(searchProductsInputSchema.parse({})).toEqual({});
    expect(
      searchProductsInputSchema.parse({
        query: "  adjustable dumbbells  ",
        category: "free-weights",
        maxPrice: 1800,
        maxWidthCm: 80,
        maxDepthCm: 60,
        maxHeightCm: 50,
        trainingGoal: "strength",
        exercise: "  dumbbell   press ",
        availableCeilingHeightCm: 220,
        anchoring: "none",
      }),
    ).toEqual({
      query: "adjustable dumbbells",
      category: "free-weights",
      maxPrice: 1800,
      maxWidthCm: 80,
      maxDepthCm: 60,
      maxHeightCm: 50,
      trainingGoal: "strength",
      exercise: "dumbbell   press",
      availableCeilingHeightCm: 220,
      anchoring: "none",
    });
  });

  it.each([
    { query: "   " },
    { query: "x".repeat(121) },
    { category: "machines" },
    { maxPrice: -1 },
    { maxPrice: 1.5 },
    { maxPrice: "1000" },
    { maxWidthCm: -1 },
    { maxDepthCm: 1.5 },
    { maxHeightCm: "200" },
    { trainingGoal: "speed" },
    { exercise: "   " },
    { availableCeilingHeightCm: -1 },
    { anchoring: "optional" },
    { unexpected: true },
  ])("rejects invalid search input: %j", (input) => {
    expect(searchProductsInputSchema.safeParse(input).success).toBe(false);
  });

  it("requires a canonical product ID and rejects extra fields", () => {
    expect(
      getProductDetailsInputSchema.parse({ productId: "product_range_adjustable_dumbbells" }),
    ).toEqual({ productId: "product_range_adjustable_dumbbells" });
    expect(getProductDetailsInputSchema.safeParse({}).success).toBe(false);
    expect(getProductDetailsInputSchema.safeParse({ productId: "range-adjustable-dumbbells" }).success).toBe(false);
    expect(
      getProductDetailsInputSchema.safeParse({
        productId: "product_range_adjustable_dumbbells",
        slug: "range-adjustable-dumbbells",
      }).success,
    ).toBe(false);
  });

  it("projects strict JSON Schemas with documented fields", () => {
    expect(searchProductsJsonSchema).toMatchObject({
      type: "object",
      additionalProperties: false,
      properties: {
        query: { type: "string", maxLength: 120 },
        category: { type: "string", enum: PRODUCT_CATEGORIES },
        maxPrice: { type: "integer", minimum: 0 },
        maxWidthCm: { type: "integer", minimum: 0 },
        maxDepthCm: { type: "integer", minimum: 0 },
        maxHeightCm: { type: "integer", minimum: 0 },
        trainingGoal: { type: "string" },
        exercise: { type: "string", maxLength: 120 },
        availableCeilingHeightCm: { type: "integer", minimum: 0 },
        anchoring: { type: "string" },
      },
    });
    expect(searchProductsJsonSchema).not.toHaveProperty("required");
    expect(getProductDetailsJsonSchema).toMatchObject({
      type: "object",
      additionalProperties: false,
      required: ["productId"],
    });
  });

  it("maps Zod failures to stable project-authored issues", () => {
    const parsed = searchProductsInputSchema.safeParse({ maxPrice: -1, extra: true });
    if (parsed.success) throw new Error("Expected invalid input.");

    expect(mapInputIssues(parsed.error)).toEqual([
      {
        path: "maxPrice",
        message: "Maximum price must be a non-negative integer in PLN.",
      },
      { path: "extra", message: "This field is not supported." },
    ]);
  });
});
