import { STEP_OVER_HEIGHT_CM } from "./access-constants";

/**
 * Whether floor geometry of this height obstructs someone walking across it.
 * A barbell, a walking pad, or a band set is stepped over; a bench, a plate
 * stack, or a rack is walked around.
 *
 * This governs walking only. Steppable geometry still occupies floor area, so
 * collision, bounds, and use-zone rules treat it like any other object, and it
 * remains something the person must be able to reach.
 */
export function blocksMovement(heightCm: number): boolean {
  return heightCm > STEP_OVER_HEIGHT_CM;
}
