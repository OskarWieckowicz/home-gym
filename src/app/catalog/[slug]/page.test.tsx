import { describe, expect, it } from "vitest";

import { catalogProducts } from "@/data/products";

import ProductPage, { generateMetadata, generateStaticParams } from "./page";

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

function collectText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!node || typeof node !== "object") return "";
  if (Array.isArray(node)) return node.map(collectText).join("");
  return collectText((node as { props?: { children?: unknown } }).props?.children);
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

  it("shows the mount height next to anchoring on the pull-up bar page", async () => {
    const page = await ProductPage(params("anchor-pullup-bar"));
    const text = collectText(page);
    expect(text).toContain("Mount height");
    expect(text).toContain("195 cm");
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
