import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/button-styles";
import { CatalogFiltersDisclosure } from "@/features/catalog/components/catalog-filters-disclosure";
import { Card } from "@/components/ui/card";
import {
  CATALOG_FILTER_FORM_ID,
  CatalogFilterForm,
} from "@/features/catalog/components/catalog-filter-form";
import { formatCatalogLabel, formatPrice } from "@/features/catalog/components/catalog-formatters";
import { CatalogProjectSummary } from "@/features/catalog/components/catalog-project-summary";
import { ProductCard } from "@/features/catalog/components/product-card";
import {
  getCatalogExerciseOptions,
  normalizeCatalogFilters,
  parseCatalogSearchParams,
  searchProducts,
  type CatalogSearchParams,
} from "@/features/catalog/queries";
import { routes } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Equipment — Home Gym Creator",
  description:
    "Browse fictional home gym equipment with dimensions, use zones, and training goals.",
};

function activeFilterLabels(filters: ReturnType<typeof normalizeCatalogFilters>) {
  return [
    filters.query ? `Search: “${filters.query}”` : undefined,
    filters.category ? `Category: ${formatCatalogLabel(filters.category)}` : undefined,
    filters.trainingGoal ? `Goal: ${formatCatalogLabel(filters.trainingGoal)}` : undefined,
    filters.maxPrice !== undefined ? `Up to ${formatPrice(filters.maxPrice)}` : undefined,
    filters.maxWidthCm !== undefined ? `Width ≤ ${filters.maxWidthCm} cm` : undefined,
    filters.maxDepthCm !== undefined ? `Depth ≤ ${filters.maxDepthCm} cm` : undefined,
    filters.maxHeightCm !== undefined ? `Height ≤ ${filters.maxHeightCm} cm` : undefined,
    filters.exercise ? `Exercise: ${formatCatalogLabel(filters.exercise)}` : undefined,
    filters.availableCeilingHeightCm !== undefined
      ? `Ceiling: ${filters.availableCeilingHeightCm} cm`
      : undefined,
    filters.anchoring
      ? `Anchoring: ${filters.anchoring === "none" ? "None" : formatCatalogLabel(filters.anchoring)}`
      : undefined,
  ].filter((label): label is string => Boolean(label));
}

export default async function CatalogPage({
  searchParams,
}: {
  readonly searchParams: Promise<CatalogSearchParams>;
}) {
  const filters = parseCatalogSearchParams(await searchParams);
  const products = searchProducts(filters);
  const filterLabels = activeFilterLabels(filters);

  return (
    <main className="flex-1 bg-canvas">
      <section className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
          <Link className="font-medium text-brand hover:underline" href={routes.home}>
            Home
          </Link>
          <span aria-hidden="true" className="mx-2 text-ink-subtle">
            /
          </span>
          <span aria-current="page">Catalog</span>
        </nav>

        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Equipment for your home gym
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted sm:text-base">
            Compare price, dimensions, and required training space. Choose equipment that matches
            your room, budget, and goals.
          </p>
        </div>

        <div className="mt-7 grid items-start gap-7 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside aria-label="Catalog filters">
            <Card className="p-4">
              <CatalogFiltersDisclosure>
                <CatalogFilterForm
                  exerciseOptions={getCatalogExerciseOptions()}
                  hasActiveFilters={filterLabels.length > 0}
                  values={filters}
                />
              </CatalogFiltersDisclosure>
            </Card>
          </aside>

          <section aria-labelledby="results-heading" className="min-w-0">
            <h2 className="sr-only" id="results-heading">
              Catalog results
            </h2>

            <CatalogProjectSummary />

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-subtle"
                />
                <label className="sr-only" htmlFor="catalog-query">
                  Search equipment
                </label>
                <input
                  className="min-h-11 w-full rounded-md border border-line-strong bg-surface py-2.5 pl-11 pr-4 text-base text-ink shadow-card outline-none transition placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand-muted"
                  defaultValue={filters.query}
                  form={CATALOG_FILTER_FORM_ID}
                  id="catalog-query"
                  name="query"
                  placeholder="Search equipment, exercises, or categories"
                  type="search"
                />
              </div>
              <div className="flex min-h-11 items-center justify-between gap-4 md:justify-end">
                <button
                  className={buttonClassName("secondary")}
                  form={CATALOG_FILTER_FORM_ID}
                  type="submit"
                >
                  Search
                </button>
                <p aria-atomic="true" aria-live="polite" className="whitespace-nowrap text-sm text-ink-muted">
                  {products.length} {products.length === 1 ? "product" : "products"}
                </p>
              </div>
            </div>

            {filterLabels.length > 0 ? (
              <ul aria-label="Active filters" className="mt-3 flex flex-wrap gap-2">
                {filterLabels.map((label) => (
                  <li
                    className="rounded-full border border-brand-muted bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong"
                    key={label}
                  >
                    {label}
                  </li>
                ))}
              </ul>
            ) : null}

            {products.length > 0 ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card className="mt-5 px-6 py-14 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-ink">
                  No equipment matches these filters
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-ink-muted">
                  Try a broader search, increase a limit, or clear the filters to see the complete
                  catalog.
                </p>
                <Link
                  className="mt-6 inline-flex font-semibold text-brand hover:underline"
                  href={routes.catalog}
                >
                  Clear all filters
                </Link>
              </Card>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
