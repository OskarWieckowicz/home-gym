import {
  PRODUCT_CATEGORIES,
  TRAINING_GOALS,
  productSchema,
  type Product,
  type ProductCategory,
} from "@/features/catalog/schemas";

const EXPECTED_CATEGORY_COUNTS: Record<ProductCategory, number> = {
  racks: 5,
  benches: 4,
  barbells: 4,
  plates: 4,
  dumbbells: 4,
  cardio: 6,
  accessories: 13,
};

function normalizedKey(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function assertUniqueValues(values: string[], message: string): void {
  if (new Set(values.map(normalizedKey)).size !== values.length) throw new Error(message);
}

function assertProductValuesAreUnique(product: Product): void {
  assertUniqueValues(product.exercises, `Exercises must be unique for ${product.id}.`);
  assertUniqueValues(product.trainingGoals, `Training goals must be unique for ${product.id}.`);
  assertUniqueValues(product.muscleGroups, `Muscle groups must be unique for ${product.id}.`);
}

function assertCatalogInvariants(products: Product[]): void {
  if (products.length !== 40) throw new Error("Catalog must contain exactly 40 products.");

  assertUniqueValues(products.map(({ id }) => id), "Catalog product IDs must be unique.");
  assertUniqueValues(products.map(({ slug }) => slug), "Catalog product slugs must be unique.");
  assertUniqueValues(
    products.map(({ brand, name }) => `${brand}/${name}`),
    "Catalog brand and name pairs must be unique.",
  );

  for (const product of products) assertProductValuesAreUnique(product);

  for (const category of PRODUCT_CATEGORIES) {
    const count = products.filter((product) => product.category === category).length;
    if (count !== EXPECTED_CATEGORY_COUNTS[category]) {
      throw new Error(
        `Catalog category ${category} must contain ${EXPECTED_CATEGORY_COUNTS[category]} products.`,
      );
    }
  }

  for (const goal of TRAINING_GOALS) {
    const categories = new Set(
      products
        .filter(({ trainingGoals }) => trainingGoals.includes(goal))
        .map(({ category }) => category),
    );
    if (categories.size < 2) throw new Error(`Training goal ${goal} must span multiple categories.`);
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nestedValue of Object.values(value)) deepFreeze(nestedValue);
    Object.freeze(value);
  }

  return value;
}

export function parseCatalogSeeds(seeds: unknown[]): readonly Product[] {
  const products = productSchema.array().parse(seeds);
  assertCatalogInvariants(products);
  return deepFreeze(products);
}
