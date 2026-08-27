import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { CatalogFilterForm } from "@/features/catalog/components/catalog-filter-form";
import { formatCatalogLabel } from "@/features/catalog/components/catalog-formatters";
import { ProductCard } from "@/features/catalog/components/product-card";
import {
  normalizeCatalogFilters,
  parseCatalogSearchParams,
  searchProducts,
  type CatalogSearchParams,
} from "@/features/catalog/queries";
import { siteLinks } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Equipment — Home Gym Creator",
  description:
    "Browse fictional home gym equipment with dimensions, clearance zones, and training goals.",
};

function activeFilterLabels(filters: ReturnType<typeof normalizeCatalogFilters>) {
  return [
    filters.query ? `Search: “${filters.query}”` : undefined,
    filters.category
      ? `Category: ${formatCatalogLabel(filters.category)}`
      : undefined,
    filters.trainingGoal
      ? `Goal: ${formatCatalogLabel(filters.trainingGoal)}`
      : undefined,
    filters.maxPrice !== undefined
      ? `Up to PLN ${filters.maxPrice.toLocaleString("en-GB")}`
      : undefined,
  ].filter((label): label is string => Boolean(label));
}

export default async function CatalogPage({
  searchParams,
}: {
  readonly searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseCatalogSearchParams(params);
  const products = searchProducts(filters);
  const filterLabels = activeFilterLabels(filters);

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Equipment catalog
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Equipment measured for real rooms.
          </h1>
          <p className="mt-4 text-lg leading-8 text-ink-muted">
            Browse fictional products with their physical footprint and the
            extra space needed to train safely. The creator and its agent use
            these same records.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <Card className="p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-ink">Filter equipment</h2>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              Filters stay in the URL, so this view is easy to save or share.
            </p>
            <div className="mt-5">
              <CatalogFilterForm
                hasActiveFilters={filterLabels.length > 0}
                values={filters}
              />
            </div>
          </Card>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div aria-live="polite">
                <p className="text-sm font-semibold text-ink">
                  {products.length} {products.length === 1 ? "product" : "products"}
                </p>
                {filterLabels.length > 0 ? (
                  <ul
                    aria-label="Active filters"
                    className="mt-2 flex flex-wrap gap-2"
                  >
                    {filterLabels.map((label) => (
                      <li
                        className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong"
                        key={label}
                      >
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-ink-muted">
                    Showing the complete starter catalog.
                  </p>
                )}
              </div>
              <LinkButton href={siteLinks.openCreator.href} variant="secondary">
                {siteLinks.openCreator.label}
              </LinkButton>
            </div>

            {products.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card className="mt-6 px-6 py-12 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-ink">
                  No equipment matches these filters.
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-ink-muted">
                  Try a broader search, increase the maximum price, or clear
                  the filters to return to the full starter catalog.
                </p>
                <LinkButton className="mt-6" href="/catalog" variant="secondary">
                  Clear all filters
                </LinkButton>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
