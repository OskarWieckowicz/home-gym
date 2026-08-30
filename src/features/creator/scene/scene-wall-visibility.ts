import type { Wall } from "@/features/project/schemas/project";
import type { SceneVector3 } from "./scene-transform";

export type SceneWallVisibility = Readonly<Record<Wall, boolean>>;

export const ALL_SCENE_WALLS: SceneWallVisibility = { top: true, right: true, bottom: true, left: true };

/** Keep both side walls near a frontal view; separate thresholds prevent flicker on return. */
const SIDE_HIDE_THRESHOLD = Math.sin(25 * Math.PI / 180);
const SIDE_SHOW_THRESHOLD = Math.sin(20 * Math.PI / 180);
const TOP_ENTER_RATIO = 0.16;
const TOP_EXIT_RATIO = 0.22;

function sideVisible(side: number, previous: boolean): boolean {
  if (side > SIDE_HIDE_THRESHOLD) return false;
  if (side < SIDE_SHOW_THRESHOLD) return true;
  return previous;
}

/** Presentation only: the camera vector is relative to the room's floor centre. */
export function sceneWallVisibility(
  camera: SceneVector3,
  previous: SceneWallVisibility = ALL_SCENE_WALLS,
): SceneWallVisibility {
  const horizontal = Math.hypot(camera.x, camera.z);
  const allHidden = Object.values(previous).every((visible) => !visible);
  const topThreshold = allHidden ? TOP_EXIT_RATIO : TOP_ENTER_RATIO;
  if (camera.y > 0 && horizontal / camera.y < topThreshold) {
    return { top: false, right: false, bottom: false, left: false };
  }
  // A top-down exit starts fresh; otherwise both walls at an axis could remain hidden.
  const last = allHidden ? ALL_SCENE_WALLS : previous;
  const length = horizontal || 1;
  return {
    top: sideVisible(-camera.z / length, last.top),
    right: sideVisible(camera.x / length, last.right),
    bottom: sideVisible(camera.z / length, last.bottom),
    left: sideVisible(-camera.x / length, last.left),
  };
}
