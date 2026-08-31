// Shared pure formatters also serve deterministic project reports.
import type { Product } from "@/features/catalog/schemas";
import { createEquipmentFootprints } from "@/features/geometry/equipment-footprints";
import { formatFootprint } from "@/shared/formatters/catalog-formatters";

export function formatExerciseEnvelope(product: Product) {
  const { useZone } = createEquipmentFootprints(
    { position: { xCm: 0, zCm: 0 }, rotation: 0 },
    product,
  );
  return formatFootprint({ ...useZone, heightCm: product.dimensions.heightCm });
}

export function formatAnchoring(product: Product) {
  return product.requirements.anchoring
    ? `Anchoring ${product.requirements.anchoring}`
    : "No anchoring required";
}

export {
  formatPrice,
  formatDimensions,
  formatFootprint,
  formatUseZoneSummary,
  formatCatalogLabel,
} from "@/shared/formatters/catalog-formatters";
