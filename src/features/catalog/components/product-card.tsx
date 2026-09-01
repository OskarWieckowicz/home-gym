import { ImageOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { buttonClassName } from "@/components/ui/button-styles";
import type { Product } from "@/features/catalog/schemas";
import { creatorProductRoute, productRoute } from "@/lib/navigation";

import {
  formatCatalogLabel,
  formatFootprint,
  formatExerciseEnvelope,
  formatAnchoring,
  formatPrice,
} from "./catalog-formatters";
import { getProductImage } from "../product-assets";

type ProductCardProps = {
  readonly product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const selectionOnly = product.placementMode === "selection-only";
  const image = getProductImage(product.id);

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-elevated motion-reduce:transform-none motion-reduce:transition-none">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-surface-muted">
        {image ? (
          <Image alt={`${product.name} catalog image`} className="object-contain p-2" fill sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 28vw" src={image} />
        ) : (
          <div className="grid place-items-center gap-2 text-center text-ink-subtle">
            <ImageOff aria-hidden="true" className="size-8 stroke-[1.5]" />
            <span className="text-xs font-medium">Product image coming later</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-strong">
          {formatCatalogLabel(product.category)}
        </p>
        <h2 className="mt-1.5 text-base font-bold leading-snug text-ink">
          <Link
            className="rounded-sm hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            href={productRoute(product.slug)}
          >
            {product.name}
          </Link>
        </h2>
        <p className="mt-1 text-lg font-bold text-ink">{formatPrice(product.price)}</p>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
            <dt className="text-ink-muted">{selectionOnly ? "Product size (W × D)" : "Footprint (W × D)"}</dt>
            <dd className="font-medium text-ink">{formatFootprint(product.dimensions)}</dd>
          </div>
          {!selectionOnly ? (
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
              <dt className="text-ink-muted">Exercise space</dt>
              <dd className="font-medium text-ink">{formatExerciseEnvelope(product)}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-2 text-xs leading-5 text-ink-subtle">
          {selectionOnly ? "List item · no floor placement" : "Exercise space includes the equipment footprint."}
        </p>
        <p className="mt-3 text-xs font-medium text-ink-muted">{formatAnchoring(product)}</p>

        <div className="mt-auto grid gap-2 pt-3">
          <Link className={buttonClassName("primary", "w-full")} href={creatorProductRoute(product.id)}>
            {selectionOnly ? "Plan this accessory" : "Plan with this equipment"}
            <span className="sr-only">: {product.name}</span>
          </Link>
          <Link
            aria-label={`View details for ${product.name}`}
            className="inline-flex min-h-11 items-center justify-center rounded-sm text-sm font-medium text-ink-muted hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
            href={productRoute(product.slug)}
          >
            View details
            <span className="sr-only"> for {product.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
