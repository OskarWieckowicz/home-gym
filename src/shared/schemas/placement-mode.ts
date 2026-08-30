export const PLACEMENT_MODES = ["floor", "selection-only"] as const;

export type PlacementMode = (typeof PLACEMENT_MODES)[number];
