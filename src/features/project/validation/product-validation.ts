import type { ProductGeometryDescriptor } from "@/features/geometry/equipment-footprints";

export type ProductValidationDescriptor = ProductGeometryDescriptor & {
  readonly id: string;
  readonly price: number;
  readonly dimensions: ProductGeometryDescriptor["dimensions"] & {
    readonly heightCm: number;
  };
  readonly minimumCeilingHeightCm?: number;
};

export type ProductResolver = (
  productId: string,
) => ProductValidationDescriptor | undefined;

export type ProjectValidationDependencies = {
  readonly resolveProduct?: ProductResolver;
};

