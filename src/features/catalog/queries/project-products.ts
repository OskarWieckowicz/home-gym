import { retiredProducts } from "@/data/products/retired-products";
import type { Product } from "@/features/catalog/schemas";
import { findProductById } from "./catalog";

export type ProjectProduct = Product | (typeof retiredProducts)[number];

/** For existing project records only; catalog search/details must use active queries. */
export function findProjectProductById(productId: string): ProjectProduct | undefined {
  return findProductById(productId) ?? retiredProducts.find((product) => product.id === productId);
}
