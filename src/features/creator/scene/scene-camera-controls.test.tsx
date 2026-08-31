// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { forwardRef, useImperativeHandle } from "react";
import { MOUSE, PerspectiveCamera, TOUCH, Vector3 } from "three";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Room } from "@/features/project/schemas/project";
import { SceneCameraControls } from "./scene-camera-controls";
import { fitSceneCamera, fitSceneSelection } from "./scene-camera-fit";
import type { SceneBox } from "./scene-transform";

const state = vi.hoisted(() => ({
  camera: null as unknown as PerspectiveCamera,
  controls: null as unknown as { target: Vector3; maxDistance: number; update: ReturnType<typeof vi.fn> },
  props: {} as Record<string, unknown>,
  invalidate: vi.fn(),
}));

vi.mock("@react-three/fiber", () => ({
  useThree: (select: (value: typeof state & { get: () => typeof state }) => unknown) => select({ ...state, get: () => state }),
}));
vi.mock("@react-three/drei", () => ({
  OrbitControls: forwardRef(function Controls(props, ref) {
    state.props = props;
    useImperativeHandle(ref, () => state.controls, []);
    return null;
  }),
}));

const room: Room = { widthCm: 600, depthCm: 400, heightCm: 260 };
beforeEach(() => {
  state.camera = new PerspectiveCamera(45, 1.5, 0.1, 100);
  state.controls = { target: new Vector3(), maxDistance: Infinity, update: vi.fn() };
  state.invalidate.mockClear();
});
afterEach(cleanup);

it("fits on mount and explicit presets, not on ordinary room updates", () => {
  const { rerender } = render(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "fit", sequence: 0 }} />);
  expect(state.camera.position.y).toBeGreaterThan(room.heightCm / 100);
  expect(state.controls.update).toHaveBeenCalledOnce();
  state.camera.position.set(7, 5, -6);
  rerender(<SceneCameraControls room={{ ...room, widthCm: 700 }} placing={false} gestureActive={false} preset={{ kind: "fit", sequence: 0 }} />);
  expect(state.camera.position.toArray()).toEqual([7, 5, -6]);
  expect(state.controls.update).toHaveBeenCalledOnce();
  rerender(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "fit", sequence: 1 }} />);
  expect(state.controls.update).toHaveBeenCalledTimes(2);
  expect(state.camera.position.z).toBeGreaterThan(0);
});

it("uses the latest aspect on explicit Fit without resetting navigation during resize", () => {
  const { rerender } = render(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "fit", sequence: 0 }} />);
  const initial = fitSceneCamera(room, "fit", 45, 1.5);
  expect(state.camera.position.toArray()).toEqual(initial.position.toArray());
  expect(state.controls.target.toArray()).toEqual(initial.target.toArray());
  state.camera.position.set(-4, 6, 8);
  state.camera.aspect = 0.5;
  rerender(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "fit", sequence: 0 }} />);
  expect(state.camera.position.toArray()).toEqual([-4, 6, 8]);
  rerender(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "fit", sequence: 1 }} />);
  expect(state.camera.position.toArray()).toEqual(fitSceneCamera(room, "fit", 45, 0.5).position.toArray());
  expect(state.controls.update).toHaveBeenCalledTimes(2);
});

it("keeps the clip range close to the room so wall-floor edges stay stable", () => {
  render(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "fit", sequence: 0 }} />);
  expect(state.camera.near).toBe(0.05);
  expect(state.camera.far).toBeGreaterThan(state.camera.near);
  expect(state.camera.far).toBeLessThan(200);
});

it("fits portrait rooms further away and top view stays above the floor", () => {
  const first = render(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "top", sequence: 0 }} />);
  const wideDistance = state.camera.position.y;
  expect(state.camera.position.x).toBeCloseTo(0);
  expect(state.camera.position.z).toBeLessThan(0.01);
  expect(state.controls.target.y).toBeCloseTo(room.heightCm / 200);
  expect(state.controls.target.z).toBeCloseTo(0, 3);
  first.unmount();
  state.camera.aspect = 0.5;
  render(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "top", sequence: 0 }} />);
  expect(state.camera.position.y).toBeGreaterThan(wideDistance);
});

it("focuses an explicit selection once, retains the current orbit, and ignores later box/room changes", () => {
  const box: SceneBox = { position: { x: 1, y: 1.1, z: -1 }, dimensions: { x: 1.2, y: 2.2, z: 1.4 }, rotationY: 0 };
  const { rerender } = render(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "fit", sequence: 0 }} />);
  state.camera.position.set(-4, 6, 8);
  state.controls.target.set(1, 1, 1);
  const direction = state.camera.position.clone().sub(state.controls.target);
  const expected = fitSceneSelection(box, 45, 1.5, direction);
  rerender(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "selection", sequence: 1, box }} />);
  expect(state.camera.position.toArray()).toEqual(expected.position.toArray());
  expect(state.controls.target.toArray()).toEqual(expected.target.toArray());
  expect(state.controls.update).toHaveBeenCalledTimes(2);
  state.camera.position.set(-3, 4, 5);
  const changedBox = { ...box, position: { ...box.position, x: 2 } };
  rerender(<SceneCameraControls room={{ ...room, widthCm: 1200 }} placing={false} gestureActive={false} preset={{ kind: "selection", sequence: 1, box: changedBox }} />);
  expect(state.camera.position.toArray()).toEqual([-3, 4, 5]);
  expect(state.controls.update).toHaveBeenCalledTimes(2);
  rerender(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "selection", sequence: 2, box: changedBox }} />);
  expect(state.controls.update).toHaveBeenCalledTimes(3);
  // The larger room also refreshes clipping, without updating the orbit or camera pose.
  expect(state.invalidate).toHaveBeenCalledTimes(4);
});

it("refreshes room limits on enlargement and shrink without moving or refitting the camera", () => {
  const preset = { kind: "fit" as const, sequence: 0 };
  const { rerender } = render(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={preset} />);
  const fittedDistance = state.camera.position.distanceTo(state.controls.target);
  state.camera.position.set(7, 5, -6);
  state.controls.target.set(1, 1, 1);
  const pose = { position: state.camera.position.toArray(), target: state.controls.target.toArray() };

  rerender(<SceneCameraControls room={{ ...room, widthCm: 2400 }} placing={false} gestureActive={false} preset={preset} />);
  expect(state.controls.maxDistance).toBe(24 * 12);
  expect(state.camera.far).toBeGreaterThan(state.controls.maxDistance);
  const largeLimit = state.controls.maxDistance;
  rerender(<SceneCameraControls room={{ widthCm: 100, depthCm: 100, heightCm: 100 }} placing={false} gestureActive={false} preset={preset} />);
  expect(state.controls.maxDistance).toBeCloseTo(Math.max(12, fittedDistance * 4));
  expect(state.controls.maxDistance).toBeLessThan(largeLimit);
  expect(state.camera.far).toBeGreaterThan(state.controls.maxDistance);
  expect(state.camera.position.toArray()).toEqual(pose.position);
  expect(state.controls.target.toArray()).toEqual(pose.target);
  expect(state.controls.update).toHaveBeenCalledOnce();
});

it("does not let the orbit limit pull an extreme-aspect fit back inside the room", () => {
  state.camera.aspect = 0.02;
  const preset = { kind: "fit" as const, sequence: 0 };
  const { rerender } = render(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={preset} />);
  const distance = state.camera.position.distanceTo(state.controls.target);
  expect(distance).toBeGreaterThan(6 * 12);
  expect(state.controls.maxDistance).toBeGreaterThan(distance);
  expect(state.camera.far).toBeGreaterThan(state.controls.maxDistance);
  const fittedLimit = state.controls.maxDistance;
  const position = state.camera.position.toArray();
  state.camera.aspect = 1.5;
  rerender(<SceneCameraControls room={{ ...room, widthCm: 1200 }} placing={false} gestureActive={false} preset={preset} />);
  rerender(<SceneCameraControls room={{ widthCm: 100, depthCm: 100, heightCm: 100 }} placing={false} gestureActive={false} preset={preset} />);
  expect(state.controls.maxDistance).toBe(fittedLimit);
  expect(state.camera.position.toArray()).toEqual(position);
  expect(state.controls.update).toHaveBeenCalledOnce();
});

it("keeps an existing zoomed-out orbit in range when the room shrinks", () => {
  const preset = { kind: "fit" as const, sequence: 0 };
  const { rerender } = render(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={preset} />);
  rerender(<SceneCameraControls room={{ ...room, widthCm: 2400 }} placing={false} gestureActive={false} preset={preset} />);
  state.camera.position.set(0, 50, 150);
  state.controls.target.set(0, 1, 0);
  const navigatedDistance = state.camera.position.distanceTo(state.controls.target);
  rerender(<SceneCameraControls room={{ widthCm: 100, depthCm: 100, heightCm: 100 }} placing={false} gestureActive={false} preset={preset} />);
  expect(state.controls.maxDistance).toBeGreaterThanOrEqual(navigatedDistance);
  expect(state.camera.far).toBeGreaterThan(navigatedDistance);
  expect(state.camera.position.toArray()).toEqual([0, 50, 150]);
  expect(state.controls.update).toHaveBeenCalledOnce();
});

it("normally enables orbit/pan/touch, reserves placement gestures, and suspends controls during edits", () => {
  const { rerender } = render(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "fit", sequence: 0 }} />);
  expect(state.props.enableRotate).toBe(true);
  expect(state.props.enablePan).toBe(true);
  expect(state.props.mouseButtons).toEqual({ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN });
  expect(state.props.touches).toEqual({ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN });
  expect(state.props.maxPolarAngle as number).toBeLessThan(Math.PI / 2);
  expect(state.props.screenSpacePanning).toBe(false);
  rerender(<SceneCameraControls room={room} placing gestureActive={false} preset={{ kind: "fit", sequence: 0 }} />);
  expect(state.props.enableRotate).toBe(false);
  expect(state.props.enablePan).toBe(false);
  expect(state.props.enableZoom).toBe(true);
  expect(state.props.mouseButtons).toEqual({});
  expect(state.props.touches).toEqual({});
  rerender(<SceneCameraControls room={room} placing={false} gestureActive preset={{ kind: "fit", sequence: 0 }} />);
  expect(state.props.enabled).toBe(false);
  expect(state.props.enableZoom).toBe(false);
});
