import { z } from "zod";

import {
  ANCHORING_FILTER_VALUES,
  PRODUCT_CATEGORIES,
  PRODUCT_ID_PATTERN,
  TRAINING_GOALS,
} from "@/features/catalog/schemas";

const QUERY_MAX_LENGTH = 120;

export const searchProductsInputSchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(1)
      .max(QUERY_MAX_LENGTH)
      .describe(`Text to search, up to ${QUERY_MAX_LENGTH} characters.`)
      .optional(),
    category: z
      .enum(PRODUCT_CATEGORIES)
      .describe("Equipment category to include.")
      .optional(),
    maxPrice: z
      .number()
      .int()
      .nonnegative()
      .describe("Maximum product price in PLN, as a non-negative integer.")
      .optional(),
    maxWidthCm: z.number().int().nonnegative().describe("Maximum stored product width in centimetres.").optional(),
    maxDepthCm: z.number().int().nonnegative().describe("Maximum stored product depth in centimetres.").optional(),
    maxHeightCm: z.number().int().nonnegative().describe("Maximum physical product height in centimetres.").optional(),
    trainingGoal: z
      .enum(TRAINING_GOALS)
      .describe("Training goal the equipment must support.")
      .optional(),
    exercise: z
      .string()
      .trim()
      .min(1)
      .max(QUERY_MAX_LENGTH)
      .describe("Exact exercise name, matched after whitespace and case normalization.")
      .optional(),
    availableCeilingHeightCm: z
      .number()
      .int()
      .nonnegative()
      .describe("Available ceiling height in centimetres.")
      .optional(),
    anchoring: z
      .enum(ANCHORING_FILTER_VALUES)
      .describe("Exact effective anchoring requirement.")
      .optional(),
  })
  .strict();

export const getProductDetailsInputSchema = z
  .object({
    productId: z
      .string()
      .regex(PRODUCT_ID_PATTERN)
      .describe("Canonical product ID returned by search_products."),
  })
  .strict();

export const searchProductsJsonSchema = z.toJSONSchema(searchProductsInputSchema);
export const getProductDetailsJsonSchema = z.toJSONSchema(getProductDetailsInputSchema);

export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>;
export type GetProductDetailsInput = z.infer<typeof getProductDetailsInputSchema>;

export type InputIssue = {
  readonly path: string;
  readonly message: string;
};

const ISSUE_MESSAGES: Readonly<Record<string, string>> = {
  query: "Query must be non-empty text up to 120 characters.",
  category: "Category must be one of the catalog categories.",
  maxPrice: "Maximum price must be a non-negative integer in PLN.",
  maxWidthCm: "Maximum width must be a non-negative integer in centimetres.",
  maxDepthCm: "Maximum depth must be a non-negative integer in centimetres.",
  maxHeightCm: "Maximum height must be a non-negative integer in centimetres.",
  trainingGoal: "Training goal must be one of the catalog training goals.",
  exercise: "Exercise must be non-empty text up to 120 characters.",
  availableCeilingHeightCm:
    "Available ceiling height must be a non-negative integer in centimetres.",
  anchoring: "Anchoring must be none, recommended, or required.",
  productId: "Product ID must use the canonical product ID format.",
};

export function mapInputIssues(error: z.ZodError): InputIssue[] {
  return error.issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys") {
      return issue.keys.map((key) => ({
        path: key,
        message: "This field is not supported.",
      }));
    }

    const path = issue.path.join(".") || "input";
    const field = String(issue.path[0] ?? "input");
    return [{ path, message: ISSUE_MESSAGES[field] ?? "Input is invalid." }];
  });
}
