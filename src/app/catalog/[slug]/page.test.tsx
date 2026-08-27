import { describe, expect, it } from "vitest";

import { catalogProducts } from "@/data/products";

import ProductPage, { generateMetadata, generateStaticParams } from "./page";

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("product detail route", () => {
  it("builds every validated product path", () => {
    expect(generateStaticParams()).toEqual(
      catalogProducts.map(({ slug }) => ({ slug })),
    );
  });

  it("renders a known product and its metadata", async () => {
    const product = catalogProducts[0];

    expect((await ProductPage(params(product.slug))).type).toBe("main");
    await expect(generateMetadata(params(product.slug))).resolves.toEqual({
      title: `${product.name} — Home Gym Creator`,
      description: product.description,
    });
  });

  it("uses the Next.js not-found path for an unknown product", async () => {
    await expect(ProductPage(params("missing-product"))).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
    await expect(
      generateMetadata(params("missing-product")),
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
});
