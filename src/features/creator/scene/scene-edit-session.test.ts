import { describe, expect, it } from "vitest";
import { advanceSceneEditSession, createSceneEditSession, finishSceneEditSession } from "./scene-edit-session";

describe("pure scene edit sessions", () => {
  const input = { pointerId: 1, revision: 4, client: { x: 10, y: 20 }, point: { xCm: 53, zCm: 68 }, entityId: "obstacle_test" };
  it("classifies clicks and latches a five-pixel drag threshold", () => {
    const start = createSceneEditSession(input);
    const click = advanceSceneEditSession(start, { ...input, client: { x: 12, y: 22 } })!;
    expect(click.dragging).toBe(false);
    expect(finishSceneEditSession(click, { ...input, inside: true })?.kind).toBe("click");
    const drag = advanceSceneEditSession(click, { ...input, client: { x: 15, y: 20 }, point: { xCm: 90, zCm: 70 } })!;
    expect(drag.dragging).toBe(true);
    expect(advanceSceneEditSession(drag, input)?.dragging).toBe(true);
    expect(drag.startPoint).toEqual(input.point);
    expect(finishSceneEditSession(drag, { ...input, inside: true }))
      .toEqual({ kind: "drag", point: { xCm: 90, zCm: 70 }, entityId: input.entityId });
  });
  it("ignores non-owning moves and refuses their release", () => {
    const start = createSceneEditSession(input);
    expect(advanceSceneEditSession(start, { ...input, pointerId: 2 })).toBe(start);
    expect(finishSceneEditSession(start, { ...input, pointerId: 2, inside: true })).toBeNull();
  });
  it("invalidates on any revision change, but preserves read-only state and refuses outside release", () => {
    const start = createSceneEditSession(input);
    expect(advanceSceneEditSession(start, input)).not.toBeNull();
    expect(advanceSceneEditSession(start, { ...input, revision: 5 })).toBeNull();
    expect(finishSceneEditSession(start, { ...input, revision: 5, inside: true })).toBeNull();
    expect(finishSceneEditSession(start, { ...input, inside: false })).toBeNull();
  });
  it("stores many moves only as drafts without mutating the initial session", () => {
    const start = createSceneEditSession(input);
    let next = start;
    for (let index = 0; index < 100; index++) {
      next = advanceSceneEditSession(next, { ...input, client: { x: 10 + index, y: 20 }, point: { xCm: 53 + index, zCm: 68 } })!;
    }
    expect(start.point).toEqual(input.point);
    expect(next.point.xCm).toBe(152);
    expect(finishSceneEditSession(next, { ...input, inside: true })?.kind).toBe("drag");
  });
});
