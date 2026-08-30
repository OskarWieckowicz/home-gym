import { createDefaultProject } from "../defaults";
import type { ProductValidationDescriptor } from "../validation/product-validation";

export const suggestionProduct: ProductValidationDescriptor = {
  id: "product_test",
  price: 100,
  dimensions: { widthCm: 20, depthCm: 20, heightCm: 50 },
  useZone: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
};

export const suggestionDependencies = {
  candidateIdPrefix: "candidate",
  resolveProduct: (id: string) => id === suggestionProduct.id ? suggestionProduct : undefined,
};

export function suggestionProject() {
  return { ...createDefaultProject(), room: { widthCm: 60, depthCm: 60, heightCm: 240 } };
}
