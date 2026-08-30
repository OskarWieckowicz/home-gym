import { productSchema, type Product } from "@/features/catalog/schemas";
import { deepFreeze } from "./catalog-validation";
import accessories from "./retired/accessories.json";
import barbells from "./retired/barbells.json";
import benches from "./retired/benches.json";
import cardio from "./retired/cardio.json";
import dumbbells from "./retired/dumbbells.json";
import plates from "./retired/plates.json";
import racks from "./retired/racks.json";

/** Historical specifications only. Never include these in active catalog queries. */
export const retiredProducts: readonly Product[] = deepFreeze(productSchema.array().parse([
  ...racks, ...benches, ...barbells, ...plates, ...dumbbells, ...cardio, ...accessories,
]));
const retiredIds = new Set(retiredProducts.map(({ id }) => id));

export function isRetiredProductId(productId: string): boolean {
  return retiredIds.has(productId);
}
