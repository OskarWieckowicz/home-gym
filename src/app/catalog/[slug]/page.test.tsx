import { afterEach, describe, expect, it, vi } from "vitest";

import * as productAssets from "@/features/catalog/product-assets";
import { catalogProducts } from "@/data/products";
import { retiredProducts } from "@/data/products/retired-products";

import ProductPage, { generateMetadata, generateStaticParams } from "./page";

afterEach(() => vi.restoreAllMocks());

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

function collectText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!node || typeof node !== "object") return "";
  if (Array.isArray(node)) return node.map(collectText).join("");
  return collectText((node as { props?: { children?: unknown } }).props?.children);
}

function findProp(node: unknown, key: string): unknown {
  if (!node || typeof node !== "object") return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findProp(child, key);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  const props = (node as { props?: Record<string, unknown> }).props;
  if (props && key in props) return props[key];
  return findProp(props?.children, key);
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

  it("shows the catalog image on the product details page", async () => {
    const page = await ProductPage(params("anchor-pullup-bar"));
    expect(findProp(page, "src")).toBe("/assets/anchor-pullup-bar-catalog.png");
    expect(findProp(page, "alt")).toBe("Anchor Pull-Up Bar catalog image");
  });

  it("shows a placeholder when the product has no catalog image", async () => {
    vi.spyOn(productAssets, "getProductImage").mockReturnValue(undefined);
    const page = await ProductPage(params("signal-resistance-bands"));
    expect(findProp(page, "src")).toBeUndefined();
    expect(collectText(page)).toContain("Product image coming later");
  });

  it("publishes the Olympic set with its accepted photo and creator entry", async () => {
    expect(generateStaticParams()).toContainEqual({ slug: "olympic-bench" });
    const page = await ProductPage(params("olympic-bench"));
    expect(findProp(page, "src")).toBe("/assets/olympic-bench-catalog-concept-v1.png");
    expect(findProp(page, "alt")).toBe("Olympic Bench Set catalog image");
    expect(collectText(page)).toContain("four weight plates");
    expect(collectText(page)).toContain("load capacity is not specified");
    expect(collectText(page)).toContain("Plan with this catalog");
  });

  it.each([
    ["anchor-pullup-bar", "Mount height195 cm"],
    ["loop-cable-trainer", "Mount height0 cm"],
    ["wall-mounted-punching-bag", "Mount height30 cm"],
  ])("shows the mount height on the %s page", async (slug, mountRow) => {
    expect(collectText(await ProductPage(params(slug)))).toContain(mountRow);
  });

  it("uses the Next.js not-found path for an unknown product", async () => {
    await expect(ProductPage(params("missing-product"))).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
    await expect(
      generateMetadata(params("missing-product")),
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });

  it.each(retiredProducts)("does not expose a product page for retired $slug", async ({ slug }) => {
    expect(generateStaticParams()).not.toContainEqual({ slug });
    await expect(ProductPage(params(slug))).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    await expect(generateMetadata(params(slug))).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
});
