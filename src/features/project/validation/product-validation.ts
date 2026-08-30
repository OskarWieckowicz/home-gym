import type { ProductGeometryDescriptor } from "@/features/geometry/equipment-footprints";
import type { PlacementMode } from "@/shared/schemas/placement-mode";
import type { TrainingGoal } from "@/shared/schemas/training-goal";

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
  readonly placementMode?: PlacementMode;
  readonly trainingGoals?: readonly TrainingGoal[];
};

export type ProductResolver = (
  productId: string,
) => ProductValidationDescriptor | undefined;

export type ProjectValidationDependencies = {
  readonly resolveProduct?: ProductResolver;
};

