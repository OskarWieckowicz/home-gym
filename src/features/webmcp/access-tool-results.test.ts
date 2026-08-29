import { describe, expect, it } from "vitest";

import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";

import {
  createAddObstacleHandler,
  createAddWallElementHandler,
  createGetProjectStateHandler,
  createValidateLayoutHandler,
} from "./room-tool-handlers";

function createStore() {
  return createProjectStore(createDefaultProject(), {
    dependencies: {
      generateObstacleId: () => "obstacle_generated",
      generateWallElementId: () => "wall-element_generated",
    },
  });
}

describe("access serialization", () => {
  it("serializes ACCESS_NOT_EVALUATED and access facts as detached data", () => {
    const store = createStore();
    const result = createValidateLayoutHandler(store)({});
    expect(result).toMatchObject({
      ok: true,
      valid: true,
      issueCounts: { accessNotEvaluated: 1 },
      access: { evaluated: false, reason: "no-door", facts: [] },
      issues: [{ code: "ACCESS_NOT_EVALUATED" }],
    });
    if (!result.ok) throw new Error("Expected validation read.");
    result.access.facts.push({ entityId: "x", kind: "door", state: "unreachable" });
    expect(store.getState().validation.access.facts).toEqual([]);
  });

  it("includes detached accessImpact on mutations that block a corridor", () => {
    const store = createProjectStore(
      {
        ...createDefaultProject(),
        room: { widthCm: 400, depthCm: 400, heightCm: 250 },
        wallElements: [
          {
            id: "wall-element_front",
            kind: "door",
            name: "Front",
            wall: "top",
            offsetCm: 150,
            widthCm: 90,
          },
          {
            id: "wall-element_back",
            kind: "door",
            name: "Back",
            wall: "bottom",
            offsetCm: 150,
            widthCm: 90,
          },
        ],
      },
      { dependencies: { generateObstacleId: () => "obstacle_bar" } },
    );

    const blocked = createAddObstacleHandler(store)({
      kind: "obstacle",
      name: "Bar",
      position: { xCm: 0, zCm: 160 },
      dimensions: { widthCm: 400, depthCm: 80, heightCm: 200 },
      rotation: 0,
      locked: false,
    });
    expect(blocked).toMatchObject({
      ok: true,
      accessImpact: {
        madeUnreachable: [
          { entityId: "wall-element_back", reason: "DOOR_UNREACHABLE" },
          { entityId: "wall-element_front", reason: "DOOR_UNREACHABLE" },
        ],
      },
      validation: {
        valid: false,
        issueCounts: { doorUnreachable: 1 },
        access: { evaluated: true, reason: null },
      },
    });
    if (!blocked || !blocked.ok) throw new Error("Expected mutation.");
    const impact = blocked.accessImpact;
    impact.madeUnreachable.push({
      entityId: "mutated",
      reason: "DOOR_BLOCKED",
    });
    expect(store.getState().dispatch).toBeTypeOf("function");
  });

  it("keeps get_project_state and adding a door on the same contract", () => {
    const store = createStore();
    const added = createAddWallElementHandler(store)({
      kind: "door",
      name: "Door",
      wall: "top",
      offsetCm: 40,
      widthCm: 90,
    });
    expect(added).toMatchObject({
      ok: true,
      accessImpact: { madeUnreachable: [], restored: [] },
    });
    const state = createGetProjectStateHandler(store)({});
    expect(state).toMatchObject({
      ok: true,
      validation: {
        access: { evaluated: true, reason: null },
        issueCounts: { accessNotEvaluated: 0 },
      },
    });
  });
});
