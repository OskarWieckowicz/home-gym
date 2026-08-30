import type { ProductGeometryDescriptor } from "@/features/geometry/equipment-footprints";

export type ProductMountingFact = {
  readonly kind: "wall";
  readonly bottomHeightCm: number;
};

export type EffectiveMounting = ProductMountingFact | { readonly kind: "floor" };

export type ProductValidationDescriptor = ProductGeometryDescriptor & {
  readonly id: string;
  readonly price: number;
  readonly dimensions: ProductGeometryDescriptor["dimensions"] & {
    readonly heightCm: number;
  };
  readonly minimumCeilingHeightCm?: number;
  readonly mounting?: ProductMountingFact;
};

export type ProductResolver = (
  productId: string,
) => ProductValidationDescriptor | undefined;

export type ProjectValidationDependencies = {
  readonly resolveProduct?: ProductResolver;
};

