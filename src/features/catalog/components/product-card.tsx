import { CheckCircle2, ImageOff, Ruler, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/button-styles";
import type { Product } from "@/features/catalog/schemas";
import { productRoute, siteLinks } from "@/lib/navigation";

import {
  formatCatalogLabel,
  formatFootprint,
  formatPricePln,
} from "./catalog-formatters";

type ProductCardProps = {
  readonly position: number;
  readonly product: Product;
};

export function ProductCard({ position, product }: ProductCardProps) {
  const requiresAnchoring = product.requirements.anchoring === "required";
  const tags = [product.exercises[0], product.trainingGoals[0]];

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-card transition hover:border-brand-muted hover:shadow-md">
      <div className="relative flex aspect-[4/2.6] items-center justify-center bg-surface-muted">
        <span className="absolute left-3 top-3 flex size-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
          {position}
        </span>
        <div className="grid place-items-center gap-2 text-center text-ink-subtle">
          <ImageOff aria-hidden="true" className="size-8 stroke-[1.5]" />
          <span className="text-xs font-medium">Product image coming later</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-subtle">
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
        <p className="mt-1 text-lg font-bold text-brand">{formatPricePln(product.price)}</p>

        <div className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
          <Ruler aria-hidden="true" className="size-4" />
          <span>{formatFootprint(product.dimensions)}</span>
        </div>

        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Product highlights">
          {tags.map((tag) => (
            <li
              className="rounded-md bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-strong"
              key={tag}
            >
              {formatCatalogLabel(tag)}
            </li>
          ))}
        </ul>

        <div
          className={[
            "mt-3 flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold",
            requiresAnchoring
              ? "border-amber-200 bg-caution-soft text-caution"
              : "border-emerald-200 bg-success-soft text-success",
          ].join(" ")}
        >
          {requiresAnchoring ? (
            <TriangleAlert aria-hidden="true" className="size-4" />
          ) : (
            <CheckCircle2 aria-hidden="true" className="size-4" />
          )}
          <span>{requiresAnchoring ? "Anchoring required" : "Ready for room planning"}</span>
        </div>

        <div className="mt-auto grid gap-2 pt-3">
          <Link className={buttonClassName("primary", "w-full")} href={siteLinks.openCreator.href}>
            Open creator
          </Link>
          <Link
            className={buttonClassName("secondary", "w-full")}
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
