import type { z } from "zod";
import { createProductSchema } from "@/features/catalog/schemas/product";
import { deepFreeze } from "./catalog-validation";
import accessories from "./retired/accessories.json";
import barbells from "./retired/barbells.json";
import benches from "./retired/benches.json";
import cardio from "./retired/cardio.json";
import dumbbells from "./retired/dumbbells.json";
import plates from "./retired/plates.json";
import racks from "./retired/racks.json";

/** Historical specifications only. Never include these in active catalog queries. */
const retiredProductSchema = createProductSchema([
  "racks", "benches", "barbells", "plates", "dumbbells", "cardio", "accessories",
]);

type RetiredProduct = z.infer<typeof retiredProductSchema>;

export const retiredProducts: readonly RetiredProduct[] = deepFreeze(retiredProductSchema.array().parse([
  ...racks, ...benches, ...barbells, ...plates, ...dumbbells, ...cardio, ...accessories,
]));
const retiredIds = new Set(retiredProducts.map(({ id }) => id));

export function isRetiredProductId(productId: string): boolean {
  return retiredIds.has(productId);
}
