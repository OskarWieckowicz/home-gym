import { retiredProducts } from "@/data/products/retired-products";
import type { Product } from "@/features/catalog/schemas";
import { findProductById } from "./catalog";

/** For existing project records only; catalog search/details must use active queries. */
export function findProjectProductById(productId: string): Product | undefined {
  return findProductById(productId) ?? retiredProducts.find((product) => product.id === productId);
}
