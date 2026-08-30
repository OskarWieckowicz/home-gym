const PRODUCT_IMAGE_BY_ID = {
  product_foundry_bumper_plates: "/assets/foundry-bumper-plates-catalog-concept-v1.png",
  product_wall_mounted_punching_bag: "/assets/wall-mounted-punching-bag-catalog-concept-v1.png",
  product_flex_studio_dumbbells: "/assets/flex-studio-dumbbells-catalog-concept-v1.png",
  product_freestanding_dip_bars: "/assets/freestanding-dip-bars-catalog-concept-v2.png",
  product_compact_dual_pulley_station: "/assets/compact-dual-pulley-station-catalog-concept-v1.png",
  product_anchor_pullup_bar: "/assets/anchor-pullup-bar-catalog.png",
  product_arc_adjustable_bench: "/assets/arc-adjustable-bench-catalog-concept-v1.png",
  product_cairn_iron_plates: "/assets/cairn-iron-plates-catalog.png",
  product_current_fold_bike: "/assets/current-fold-bike-catalog.png",
  product_delta_change_plates: "/assets/delta-change-plates-catalog.png",
  product_forge_kettlebell_16kg: "/assets/forge-kettlebell-16kg-catalog.png",
  product_groundwork_exercise_mat: "/assets/groundwork-exercise-mat-catalog.png",
  product_groundwork_foam_roller: "/assets/groundwork-foam-roller-catalog.png",
  product_harbor_squat_stands: "/assets/harbor-squat-stands-catalog.png",
  product_loop_cable_trainer: "/assets/single-column-cable-machine-catalog-concept-v2.png",
  product_northstar_half_rack: "/assets/northstar-half-rack-catalog.png",
  product_pivot_flat_bench: "/assets/pivot-flat-bench-catalog.png",
  product_quarry_power_bar: "/assets/quarry-power-bar-catalog.png",
  product_range_adjustable_dumbbells: "/assets/range-adjustable-dumbbells-catalog.png",
  product_signal_resistance_bands: "/assets/signal-resistance-bands-catalog.png",
  product_summit_power_cage: "/assets/squat-rack-catalog.png",
  product_summit_strength_station: "/assets/summit-strength-station-catalog.png",
  product_surge_compact_treadmill: "/assets/surge-compact-treadmill-catalog.png",
} as const;

export function getProductImage(productId: string): string | undefined {
  return PRODUCT_IMAGE_BY_ID[productId as keyof typeof PRODUCT_IMAGE_BY_ID];
}
