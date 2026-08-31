import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { MOUSE, TOUCH, PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Room } from "@/features/project/schemas/project";
import { roomToScene, type SceneBox } from "./scene-transform";
import { fitSceneCamera, fitSceneSelection } from "./scene-camera-fit";

export type SceneCameraPreset =
  | { readonly kind: "fit" | "top"; readonly sequence: number }
  | { readonly kind: "selection"; readonly sequence: number; readonly box: SceneBox };

export function SceneCameraControls({ room, placing, gestureActive, preset }: {
  readonly room: Room;
  readonly placing: boolean;
  readonly gestureActive: boolean;
  readonly preset: SceneCameraPreset;
}) {
  const getScene = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);
  const controls = useRef<OrbitControlsImpl>(null);
  const lastPreset = useRef<string | null>(null);
  const lastFitDistance = useRef(0);
  const size = roomToScene(room);
  const maxSize = Math.max(size.x, size.y, size.z);

  useLayoutEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    const key = `${preset.kind}:${preset.sequence}`;
    const applyPreset = lastPreset.current !== key;
    const camera = getScene().camera;
    if (applyPreset) {
      lastPreset.current = key;
      const perspective = camera instanceof PerspectiveCamera ? camera : null;
      const fov = perspective?.fov ?? 45;
      const aspect = perspective?.aspect ?? 1;
      const { target, position, distance } = preset.kind === "selection"
        ? fitSceneSelection(preset.box, fov, aspect, camera.position.clone().sub(orbit.target))
        : fitSceneCamera(room, preset.kind, fov, aspect);
      camera.position.copy(position);
      orbit.target.copy(target);
      lastFitDistance.current = distance;
    }
    // Room edits refresh navigation limits, but retain any explicit narrow-viewport fit.
    orbit.maxDistance = Math.max(12, maxSize * 12, lastFitDistance.current * 4,
      camera.position.distanceTo(orbit.target));
    const far = Math.max(40, maxSize * 16, lastFitDistance.current * 8, orbit.maxDistance + maxSize * 2);
    const projectionChanged = camera.near !== 0.05 || camera.far !== far;
    camera.near = 0.05;
    camera.far = far;
    if (applyPreset || projectionChanged) camera.updateProjectionMatrix();
    if (applyPreset) orbit.update();
    if (applyPreset || projectionChanged) invalidate();
  }, [getScene, invalidate, maxSize, preset, room]);

  const navigate = !placing;
  return <OrbitControls ref={controls} makeDefault enabled={!gestureActive} enableDamping={false}
    enableRotate={navigate} enablePan={navigate} enableZoom={!gestureActive}
    screenSpacePanning={false} minDistance={0.5}
    minPolarAngle={0.0001} maxPolarAngle={Math.PI / 2 - 0.05}
    mouseButtons={navigate ? { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN } : {}}
    touches={navigate ? { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN } : {}} />;
}
