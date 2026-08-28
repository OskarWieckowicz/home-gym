import { catalogProducts } from "@/data/products";
import {
  PRODUCT_CATEGORIES,
  TRAINING_GOALS,
  type Product,
  type ProductCategory,
  type TrainingGoal,
} from "@/features/catalog/schemas";

export type CatalogFilters = {
  query?: string;
  category?: string;
  maxPrice?: string | number;
  trainingGoal?: string;
};

export type NormalizedCatalogFilters = {
  query?: string;
  category?: ProductCategory;
  maxPrice?: number;
  trainingGoal?: TrainingGoal;
};

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

function normalizeEnum<const T extends readonly string[]>(
  value: string | undefined,
  vocabulary: T,
): T[number] | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = normalizeText(value);
  return vocabulary.find((item) => item === normalized);
}

function normalizeMaxPrice(value: string | number | undefined): number | undefined {
  if (typeof value === "string" && value.trim() === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export function normalizeCatalogFilters(filters: CatalogFilters = {}): NormalizedCatalogFilters {
  const query = typeof filters.query === "string" ? normalizeText(filters.query) : "";
  const category = normalizeEnum(filters.category, PRODUCT_CATEGORIES);
  const maxPrice = normalizeMaxPrice(filters.maxPrice);
  const trainingGoal = normalizeEnum(filters.trainingGoal, TRAINING_GOALS);

  return {
    ...(query ? { query } : {}),
    ...(category ? { category } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    ...(trainingGoal ? { trainingGoal } : {}),
  };
}

function searchableText(product: Product): string {
  return normalizeText(
    [
      product.name,
      product.brand,
      product.category,
      ...product.exercises,
      ...product.trainingGoals,
    ].join(" "),
  );
}

export function findProductBySlug(slug: string): Product | undefined {
  const normalizedSlug = normalizeText(slug);
  return catalogProducts.find((product) => product.slug === normalizedSlug);
}

export function findProductById(productId: string): Product | undefined {
  return catalogProducts.find((product) => product.id === productId);
}

/**
 * Invalid URL-style filters are ignored instead of throwing. Results preserve
 * the canonical dataset order and the source array is never mutated.
 */
export function searchProducts(filters: CatalogFilters = {}): Product[] {
  const normalized = normalizeCatalogFilters(filters);

  return catalogProducts.filter((product) => {
    if (normalized.query && !searchableText(product).includes(normalized.query)) return false;
    if (normalized.category && product.category !== normalized.category) return false;
    if (normalized.maxPrice !== undefined && product.price > normalized.maxPrice) return false;
    if (normalized.trainingGoal && !product.trainingGoals.includes(normalized.trainingGoal)) {
      return false;
    }
    return true;
  });
}
