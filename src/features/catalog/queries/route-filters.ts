import {
  normalizeCatalogFilters,
  type NormalizedCatalogFilters,
} from "./catalog";

export type CatalogSearchParams = Record<
  string,
  string | string[] | undefined
>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCatalogSearchParams(
  params: CatalogSearchParams,
): NormalizedCatalogFilters {
  return normalizeCatalogFilters({
    query: firstValue(params.query),
    category: firstValue(params.category),
    trainingGoal: firstValue(params.trainingGoal),
    maxPrice: firstValue(params.maxPrice),
  });
}
