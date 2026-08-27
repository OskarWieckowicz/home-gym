import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { Product } from "@/features/catalog/schemas";
import { productRoute } from "@/lib/navigation";

import {
  formatCatalogLabel,
  formatClearanceSummary,
  formatFootprint,
  formatPricePln,
} from "./catalog-formatters";

type ProductCardProps = {
  readonly product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-line bg-surface-muted p-5">
        <div
          aria-hidden="true"
          className="mx-auto flex aspect-[4/3] max-w-48 items-center justify-center rounded-xl border border-dashed border-clearance bg-clearance-soft"
        >
          <div className="h-1/2 w-1/2 rounded-md bg-footprint shadow-sm" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              {formatCatalogLabel(product.category)}
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
              {product.name}
            </h2>
            <p className="mt-1 text-sm text-ink-subtle">{product.brand}</p>
          </div>
          <p className="shrink-0 text-base font-bold text-ink">
            {formatPricePln(product.price)}
          </p>
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-ink-muted">
          {product.description}
        </p>
        <dl className="mt-5 grid gap-2 rounded-xl bg-surface-muted p-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-subtle">Footprint</dt>
            <dd className="font-medium text-ink">
              {formatFootprint(product.dimensions)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-subtle">Use space</dt>
            <dd className="text-right font-medium text-ink">
              {formatClearanceSummary(product.clearance)}
            </dd>
          </div>
        </dl>
        <Link
          className="mt-5 font-semibold text-brand underline-offset-4 hover:text-brand-strong hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          href={productRoute(product.slug)}
        >
          View product details
          <span className="sr-only"> for {product.name}</span>
        </Link>
      </div>
    </Card>
  );
}
