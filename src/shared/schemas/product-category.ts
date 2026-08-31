export const PRODUCT_CATEGORIES = [
  "racks",
  "benches",
  "free-weights",
  "cable-machines",
  "bodyweight-training",
  "cardio-conditioning",
  "mobility-recovery",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Readonly<Record<ProductCategory, string>> = {
  racks: "Racks & Stands",
  benches: "Benches",
  "free-weights": "Free Weights",
  "cable-machines": "Cable Machines",
  "bodyweight-training": "Bodyweight Training",
  "cardio-conditioning": "Cardio & Conditioning",
  "mobility-recovery": "Mobility & Recovery",
};
