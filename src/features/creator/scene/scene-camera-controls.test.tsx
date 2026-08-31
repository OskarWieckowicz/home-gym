// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { forwardRef, useImperativeHandle } from "react";
import { MOUSE, PerspectiveCamera, TOUCH, Vector3 } from "three";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Room } from "@/features/project/schemas/project";
import { SceneCameraControls } from "./scene-camera-controls";
import { fitSceneCamera } from "./scene-camera-fit";

const state = vi.hoisted(() => ({
  camera: null as unknown as PerspectiveCamera,
  controls: null as unknown as { target: Vector3; update: ReturnType<typeof vi.fn> },
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
  state.controls = { target: new Vector3(), update: vi.fn() };
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
  expect(state.camera.position.x).toBe(0);
  expect(state.camera.position.z).toBeLessThan(0.01);
  expect(state.controls.target.toArray()).toEqual([0, 0, 0]);
  first.unmount();
  state.camera.aspect = 0.5;
  render(<SceneCameraControls room={room} placing={false} gestureActive={false} preset={{ kind: "top", sequence: 0 }} />);
  expect(state.camera.position.y).toBeGreaterThan(wideDistance);
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
