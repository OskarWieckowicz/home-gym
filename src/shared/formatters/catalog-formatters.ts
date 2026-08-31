import { PRODUCT_CATEGORY_LABELS, type ProductCategory } from "@/shared/schemas/product-category";

type Dimensions = {
  readonly widthCm: number;
  readonly depthCm: number;
  readonly heightCm: number;
};

type UseZone = {
  readonly frontCm: number;
  readonly backCm: number;
  readonly leftCm: number;
  readonly rightCm: number;
};

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDimensions(dimensions: Dimensions) {
  return `${dimensions.widthCm} × ${dimensions.depthCm} × ${dimensions.heightCm} cm`;
}

export function formatFootprint(dimensions: Dimensions) {
  return `${dimensions.widthCm} × ${dimensions.depthCm} cm`;
}

export function formatUseZoneSummary(useZone: UseZone) {
  const values = [
    useZone.frontCm,
    useZone.backCm,
    useZone.leftCm,
    useZone.rightCm,
  ];
  const maximum = Math.max(...values);

  if (maximum === 0) {
    return "No additional use zone";
  }

  return `Up to ${maximum} cm additional use zone`;
}

export function formatCatalogLabel(value: string) {
  if (Object.hasOwn(PRODUCT_CATEGORY_LABELS, value)) {
    return PRODUCT_CATEGORY_LABELS[value as ProductCategory];
  }
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
