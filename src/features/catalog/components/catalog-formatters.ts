type Dimensions = {
  readonly widthCm: number;
  readonly depthCm: number;
  readonly heightCm: number;
};

type Clearance = {
  readonly frontCm: number;
  readonly backCm: number;
  readonly leftCm: number;
  readonly rightCm: number;
};

export function formatPricePln(pricePln: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(pricePln);
}

export function formatDimensions(dimensions: Dimensions) {
  return `${dimensions.widthCm} × ${dimensions.depthCm} × ${dimensions.heightCm} cm`;
}

export function formatFootprint(dimensions: Dimensions) {
  return `${dimensions.widthCm} × ${dimensions.depthCm} cm`;
}

export function formatClearanceSummary(clearance: Clearance) {
  const values = [
    clearance.frontCm,
    clearance.backCm,
    clearance.leftCm,
    clearance.rightCm,
  ];
  const maximum = Math.max(...values);

  if (maximum === 0) {
    return "No additional clearance";
  }

  return `Up to ${maximum} cm additional clearance`;
}

export function formatCatalogLabel(value: string) {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
