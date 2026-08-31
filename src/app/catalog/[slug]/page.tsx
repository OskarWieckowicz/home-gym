import { ImageOff } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { catalogProducts } from "@/data/products";
import {
  formatCatalogLabel,
  formatDimensions,
  formatFootprint,
  formatExerciseEnvelope,
  formatAnchoring,
  formatPricePln,
} from "@/features/catalog/components/catalog-formatters";
import { getProductImage } from "@/features/catalog/product-assets";
import { findProductBySlug } from "@/features/catalog/queries";
import { creatorProductRoute } from "@/lib/navigation";

type ProductPageProps = {
  readonly params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return catalogProducts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = findProductBySlug(slug);

  if (!product) notFound();

  return {
    title: `${product.name} — Home Gym Creator`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = findProductBySlug(slug);

  if (!product) notFound();

  const requirements = [
    product.requirements.minimumCeilingHeightCm
      ? [
          "Minimum ceiling height",
          `${product.requirements.minimumCeilingHeightCm} cm`,
        ]
      : undefined,
    ["Anchoring", formatAnchoring(product)],
    product.mounting
      ? ["Mount height", `${product.mounting.bottomHeightCm} cm`]
      : undefined,
    product.requirements.flooring
      ? ["Flooring", formatCatalogLabel(product.requirements.flooring)]
      : undefined,
    product.requirements.assembly
      ? ["Assembly", formatCatalogLabel(product.requirements.assembly)]
      : undefined,
  ].filter((entry): entry is [string, string] => Boolean(entry));
  const image = getProductImage(product.id);

  return (
    <main className="flex-1">
      <article className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
        <Link
          className="text-sm font-semibold text-brand hover:text-brand-strong hover:underline"
          href="/catalog"
        >
          ← Back to equipment
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
          <div>
            <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-surface-muted">
              {image ? (
                <Image
                  alt={`${product.name} catalog image`}
                  className="object-contain p-6"
                  fetchPriority="high"
                  fill
                  loading="eager"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  src={image}
                />
              ) : (
                <div className="grid h-full place-items-center gap-2 text-center text-ink-subtle">
                  <ImageOff aria-hidden="true" className="size-10 stroke-[1.5]" />
                  <span className="text-sm font-medium">Product image coming later</span>
                </div>
              )}
            </figure>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              {formatCatalogLabel(product.category)} · {product.brand}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-ink-muted">
              {product.description}
            </p>

            <section className="mt-10" aria-labelledby="space-heading">
              <h2 id="space-heading" className="text-2xl font-bold text-ink">
                Space requirements
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Card className="p-5">
                  <p className="text-sm font-semibold text-ink-subtle">
                    Physical dimensions
                  </p>
                  <p className="mt-2 text-xl font-bold text-ink">
                    {formatDimensions(product.dimensions)}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Width × depth × height; {product.placementMode === "selection-only" ? "product size" : "footprint"} {formatFootprint(product.dimensions)}.
                  </p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm font-semibold text-ink-subtle">
                    {product.placementMode === "selection-only" ? "Planning mode" : "Exercise space"}
                  </p>
                  {product.placementMode === "selection-only" ? (
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      This accessory is added to your equipment list, without floor placement or a reserved exercise area.
                    </p>
                  ) : (
                    <>
                      <p className="mt-2 text-xl font-bold text-ink">{formatExerciseEnvelope(product)}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        Width × depth, including the footprint and these use-zone margins.
                        Room fit is checked in the creator.
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-sm">
                        {Object.entries(product.useZone).map(([side, value]) => (
                          <div className="flex justify-between gap-2" key={side}>
                            <dt className="text-ink-muted">
                              {formatCatalogLabel(side.replace("Cm", ""))}
                            </dt>
                            <dd className="font-semibold text-ink">{value} cm</dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  )}
                </Card>
              </div>
            </section>

            <section className="mt-10" aria-labelledby="training-heading">
              <h2 id="training-heading" className="text-2xl font-bold text-ink">
                Training coverage
              </h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-ink">Exercises</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {product.exercises.map((exercise) => (
                      <li className="rounded-full bg-brand-soft px-3 py-1.5 text-sm text-brand-strong" key={exercise}>
                        {formatCatalogLabel(exercise)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Training goals</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {product.trainingGoals.map((goal) => (
                      <li className="rounded-full bg-success-soft px-3 py-1.5 text-sm text-success" key={goal}>
                        {formatCatalogLabel(goal)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          <aside>
            <Card className="p-6 lg:sticky lg:top-24">
              <p className="text-3xl font-bold text-ink">
                {formatPricePln(product.price)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Fictional planning price, including VAT.
              </p>

              <dl className="mt-6 divide-y divide-line border-y border-line">
                {product.weightKg ? (
                  <div className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="text-ink-muted">Equipment weight</dt>
                    <dd className="font-semibold text-ink">{product.weightKg} kg</dd>
                  </div>
                ) : null}
                {product.maximumLoadKg ? (
                  <div className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="text-ink-muted">Maximum load</dt>
                    <dd className="font-semibold text-ink">{product.maximumLoadKg} kg</dd>
                  </div>
                ) : null}
                {requirements.map(([label, value]) => (
                  <div className="flex justify-between gap-4 py-3 text-sm" key={label}>
                    <dt className="text-ink-muted">{label}</dt>
                    <dd className="text-right font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>

              {product.constraints?.length ? (
                <div className="mt-5 rounded-xl bg-caution-soft p-4">
                  <h2 className="text-sm font-bold text-caution">Safety notes</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-ink-muted">
                    {product.constraints.map((constraint) => (
                      <li key={constraint}>{constraint}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <LinkButton className="mt-6 w-full" href={creatorProductRoute(product.id)}>
                {product.placementMode === "selection-only" ? "Plan this accessory" : "Plan with this equipment"}
                <span className="sr-only">: {product.name}</span>
              </LinkButton>
            </Card>
          </aside>
        </div>
      </article>
    </main>
  );
}
