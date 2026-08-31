import { catalogProducts } from "@/data/products";
import { formatCatalogLabel } from "@/shared/formatters/catalog-formatters";
import {
  ANCHORING_FILTER_VALUES,
  PRODUCT_CATEGORIES,
  TRAINING_GOALS,
  type AnchoringFilter,
  type EffectiveMounting,
  type Product,
  type ProductCategory,
  type TrainingGoal,
} from "@/features/catalog/schemas";

export type CatalogFilters = {
  query?: string;
  category?: string;
  maxPrice?: string | number;
  maxWidthCm?: string | number;
  maxDepthCm?: string | number;
  maxHeightCm?: string | number;
  trainingGoal?: string;
  exercise?: string;
  availableCeilingHeightCm?: string | number;
  anchoring?: string;
};

export type NormalizedCatalogFilters = {
  query?: string;
  category?: ProductCategory;
  maxPrice?: number;
  maxWidthCm?: number;
  maxDepthCm?: number;
  maxHeightCm?: number;
  trainingGoal?: TrainingGoal;
  exercise?: string;
  availableCeilingHeightCm?: number;
  anchoring?: AnchoringFilter;
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

function normalizeNonNegativeInteger(value: string | number | undefined): number | undefined {
  if (typeof value === "string" && value.trim() === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export function normalizeCatalogFilters(filters: CatalogFilters = {}): NormalizedCatalogFilters {
  const query = typeof filters.query === "string" ? normalizeText(filters.query) : "";
  const category = normalizeEnum(filters.category, PRODUCT_CATEGORIES);
  const maxPrice = normalizeNonNegativeInteger(filters.maxPrice);
  const maxWidthCm = normalizeNonNegativeInteger(filters.maxWidthCm);
  const maxDepthCm = normalizeNonNegativeInteger(filters.maxDepthCm);
  const maxHeightCm = normalizeNonNegativeInteger(filters.maxHeightCm);
  const trainingGoal = normalizeEnum(filters.trainingGoal, TRAINING_GOALS);
  const exercise = typeof filters.exercise === "string" ? normalizeText(filters.exercise) : "";
  const availableCeilingHeightCm = normalizeNonNegativeInteger(
    filters.availableCeilingHeightCm,
  );
  const anchoring = normalizeEnum(filters.anchoring, ANCHORING_FILTER_VALUES);

  return {
    ...(query ? { query } : {}),
    ...(category ? { category } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    ...(maxWidthCm !== undefined ? { maxWidthCm } : {}),
    ...(maxDepthCm !== undefined ? { maxDepthCm } : {}),
    ...(maxHeightCm !== undefined ? { maxHeightCm } : {}),
    ...(trainingGoal ? { trainingGoal } : {}),
    ...(exercise ? { exercise } : {}),
    ...(availableCeilingHeightCm !== undefined ? { availableCeilingHeightCm } : {}),
    ...(anchoring ? { anchoring } : {}),
  };
}

export function getEffectiveMounting(product: Pick<Product, "mounting">): EffectiveMounting {
  return product.mounting ?? { kind: "floor" };
}

export function getEffectiveRequiredHeightCm(product: Pick<Product, "requirements" | "dimensions" | "mounting">): number {
  const stored = product.requirements.minimumCeilingHeightCm ?? product.dimensions.heightCm;
  const mounting = getEffectiveMounting(product);
  return mounting.kind === "wall"
    ? Math.max(stored, mounting.bottomHeightCm + product.dimensions.heightCm)
    : stored;
}

export function getEffectiveAnchoring(product: Pick<Product, "requirements">): AnchoringFilter {
  return product.requirements.anchoring ?? "none";
}

export function getCatalogExerciseOptions(products: readonly Product[] = catalogProducts): string[] {
  const options = new Map<string, string>();
  for (const product of products) {
    for (const exercise of product.exercises) {
      const normalized = normalizeText(exercise);
      if (!options.has(normalized)) options.set(normalized, exercise.trim().replace(/\s+/g, " "));
    }
  }
  return [...options.values()].sort((left, right) =>
    left.localeCompare(right, "en", { sensitivity: "base" }),
  );
}

function searchableText(product: Product): string {
  return normalizeText(
    [
      product.name,
      product.brand,
      product.category,
      formatCatalogLabel(product.category),
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

function fitsDimensionLimits(product: Product, filters: NormalizedCatalogFilters): boolean {
  if (filters.maxWidthCm !== undefined && product.dimensions.widthCm > filters.maxWidthCm) {
    return false;
  }
  if (filters.maxDepthCm !== undefined && product.dimensions.depthCm > filters.maxDepthCm) {
    return false;
  }
  return filters.maxHeightCm === undefined || product.dimensions.heightCm <= filters.maxHeightCm;
}

function matchesExercise(product: Product, exercise: string | undefined): boolean {
  return (
    exercise === undefined ||
    product.exercises.some((candidate) => normalizeText(candidate) === exercise)
  );
}

function fitsCeiling(product: Product, availableHeightCm: number | undefined): boolean {
  return (
    availableHeightCm === undefined || getEffectiveRequiredHeightCm(product) <= availableHeightCm
  );
}

function matchesAnchoring(product: Product, anchoring: AnchoringFilter | undefined): boolean {
  return anchoring === undefined || getEffectiveAnchoring(product) === anchoring;
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
    if (!fitsDimensionLimits(product, normalized)) return false;
    if (normalized.trainingGoal && !product.trainingGoals.includes(normalized.trainingGoal)) {
      return false;
    }
    if (!matchesExercise(product, normalized.exercise)) return false;
    if (!fitsCeiling(product, normalized.availableCeilingHeightCm)) return false;
    if (!matchesAnchoring(product, normalized.anchoring)) return false;
    return true;
  });
}
