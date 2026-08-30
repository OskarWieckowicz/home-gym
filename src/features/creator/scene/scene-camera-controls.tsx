import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { MOUSE, TOUCH, PerspectiveCamera, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Room } from "@/features/project/schemas/project";
import { roomToScene } from "./scene-transform";

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
    const dimensions = roomToScene(room);
    const target = new Vector3(0, preset.kind === "top" ? 0 : dimensions.y * 0.32, 0);
    const perspective = camera instanceof PerspectiveCamera ? camera : null;
    const halfFov = ((perspective?.fov ?? 45) * Math.PI) / 360;
    const limitingAngle = Math.min(halfFov, Math.atan(Math.tan(halfFov) * (perspective?.aspect ?? 1)));
    const radius = Math.hypot(dimensions.x, dimensions.y, dimensions.z) / 2;
    const distance = radius / Math.sin(limitingAngle) * 1.12;
    const direction = preset.kind === "top" ? new Vector3(0, 1, 0.0001) : new Vector3(1, 1.15, 1.3).normalize();
    camera.position.copy(target).addScaledVector(direction, distance);
    camera.near = 0.01;
    camera.far = Math.max(200, distance * 20);
    camera.updateProjectionMatrix();
    controls.current.target.copy(target);
    controls.current.update();
    invalidate();
  }, [getScene, invalidate, preset.kind, preset.sequence, room]);

  const navigate = !placing;
  return <OrbitControls ref={controls} makeDefault enabled={!gestureActive} enableDamping={false}
    enableRotate={navigate} enablePan={navigate} enableZoom={!gestureActive}
    screenSpacePanning={false} minDistance={0.5} maxDistance={Math.max(12, maxSize * 12)}
    minPolarAngle={0.0001} maxPolarAngle={Math.PI / 2 - 0.05}
    mouseButtons={navigate ? { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN } : {}}
    touches={navigate ? { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN } : {}} />;
}
