import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { MOUSE, TOUCH, PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Room } from "@/features/project/schemas/project";
import { roomToScene } from "./scene-transform";
import { fitSceneCamera } from "./scene-camera-fit";

export type SceneCameraPreset = { readonly kind: "fit" | "top"; readonly sequence: number };

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
  const size = roomToScene(room);
  const maxSize = Math.max(size.x, size.y, size.z);

  useLayoutEffect(() => {
    const key = `${preset.kind}:${preset.sequence}`;
    if (lastPreset.current === key || !controls.current) return;
    lastPreset.current = key;
    const camera = getScene().camera;
    const perspective = camera instanceof PerspectiveCamera ? camera : null;
    const { target, position, distance } = fitSceneCamera(room, preset.kind, perspective?.fov ?? 45, perspective?.aspect ?? 1);
    camera.position.copy(position);
    camera.near = 0.05;
    camera.far = Math.max(40, maxSize * 16, distance * 8);
    camera.updateProjectionMatrix();
    controls.current.target.copy(target);
    controls.current.update();
    invalidate();
  }, [getScene, invalidate, maxSize, preset.kind, preset.sequence, room]);

  const navigate = !placing;
  return <OrbitControls ref={controls} makeDefault enabled={!gestureActive} enableDamping={false}
    enableRotate={navigate} enablePan={navigate} enableZoom={!gestureActive}
    screenSpacePanning={false} minDistance={0.5} maxDistance={Math.max(12, maxSize * 12)}
    minPolarAngle={0.0001} maxPolarAngle={Math.PI / 2 - 0.05}
    mouseButtons={navigate ? { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN } : {}}
    touches={navigate ? { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN } : {}} />;
}
