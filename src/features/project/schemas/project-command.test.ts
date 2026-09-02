import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  functionalClearancePatchSchema,
  obstacleInputSchema,
  obstaclePatchSchema,
  placementPatchSchema,
  projectCommandSchema,
  projectSettingsPatchSchema,
  wallElementInputSchema,
  wallElementPatchSchema,
} from "./project-command";

const obstacleInput = {
  kind: "obstacle",
  name: "Wardrobe",
  position: { xCm: 10, zCm: 20 },
  dimensions: { widthCm: 80, depthCm: 50, heightCm: 210 },
  functionalClearance: { frontCm: 80, backCm: 0, leftCm: 10, rightCm: 10 },
  rotation: 0,
  locked: true,
} as const;

describe("projectCommandSchema", () => {
  it.each([
    { type: "ROOM_CONFIGURED", payload: { widthCm: 500, depthCm: 400, heightCm: 250 } },
    { type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 12_000 } },
    { type: "PROJECT_SETTINGS_UPDATED", payload: { trainingGoals: ["strength"] } },
    { type: "OBSTACLE_ADDED", payload: obstacleInput },
    { type: "OBSTACLE_UPDATED", payload: { obstacleId: "obstacle_wardrobe", patch: { rotation: 90 } } },
    { type: "OBSTACLE_REMOVED", payload: { obstacleId: "obstacle_wardrobe" } },
    { type: "WALL_ELEMENT_ADDED", payload: { kind: "door", name: "Door", wall: "left", offsetCm: 40, widthCm: 90 } },
    { type: "WALL_ELEMENT_UPDATED", payload: { wallElementId: "wall-element_door", patch: { offsetCm: 50 } } },
    { type: "WALL_ELEMENT_REMOVED", payload: { wallElementId: "wall-element_door" } },
    { type: "PRODUCT_PLACED", payload: { productId: "product_northstar_half_rack", position: { xCm: 10, zCm: 20 }, rotation: 0 } },
    { type: "PROJECT_ITEM_ADDED", payload: { productId: "product_northstar_half_rack" } },
    { type: "PROJECT_ITEM_REMOVED", payload: { projectItemId: "project-item_rack" } },
    {
      type: "PROJECT_ITEM_PLACED",
      payload: {
        projectItemId: "project-item_rack",
        position: { xCm: 10, zCm: 20 },
        rotation: 0,
      },
    },
    { type: "PLACEMENT_UPDATED", payload: { placementId: "placement_rack", patch: { rotation: 90 } } },
    { type: "PLACEMENT_REMOVED", payload: { placementId: "placement_rack" } },
  ] as const)("parses $type", (command) => {
    expect(projectCommandSchema.parse(command)).toEqual(command);
  });

  it("rejects empty settings and obstacle patches", () => {
    expect(projectSettingsPatchSchema.safeParse({}).success).toBe(false);
    expect(obstaclePatchSchema.safeParse({}).success).toBe(false);
    expect(functionalClearancePatchSchema.safeParse({}).success).toBe(false);
    expect(wallElementPatchSchema.safeParse({}).success).toBe(false);
    expect(placementPatchSchema.safeParse({}).success).toBe(false);
  });

  it("accepts non-empty partial functional-clearance patches including zero", () => {
    expect(functionalClearancePatchSchema.parse({ frontCm: 0 })).toEqual({ frontCm: 0 });
    expect(
      obstaclePatchSchema.parse({ functionalClearance: { leftCm: 0, rightCm: 25 } }),
    ).toEqual({ functionalClearance: { leftCm: 0, rightCm: 25 } });
    expect(functionalClearancePatchSchema.safeParse({ frontCm: -1 }).success).toBe(false);
    expect(functionalClearancePatchSchema.safeParse({ frontCm: 1.5 }).success).toBe(false);
  });

  it("keeps obstacle and wall-element kinds immutable", () => {
    expect(obstaclePatchSchema.safeParse({ kind: "unavailable-zone" }).success).toBe(false);
    expect(wallElementPatchSchema.safeParse({ kind: "window" }).success).toBe(false);
  });

  it("requires unavailable-zone inputs to use 2D dimensions", () => {
    const zone = {
      kind: "unavailable-zone",
      name: obstacleInput.name,
      position: obstacleInput.position,
      rotation: obstacleInput.rotation,
      locked: obstacleInput.locked,
      dimensions: { widthCm: 80, depthCm: 50 },
    } as const;
    expect(obstacleInputSchema.safeParse(zone).success).toBe(true);
    expect(
      obstacleInputSchema.safeParse({ ...zone, functionalClearance: obstacleInput.functionalClearance }).success,
    ).toBe(false);
    expect(
      obstaclePatchSchema.safeParse({
        dimensions: { widthCm: 100, depthCm: 60 },
      }).success,
    ).toBe(true);
    expect(
      obstacleInputSchema.safeParse({
        ...zone,
        dimensions: { ...zone.dimensions, heightCm: 1 },
      }).success,
    ).toBe(false);
  });

  it("requires complete functional clearance on physical-obstacle input", () => {
    const withoutClearance = {
      kind: obstacleInput.kind,
      name: obstacleInput.name,
      position: obstacleInput.position,
      dimensions: obstacleInput.dimensions,
      rotation: obstacleInput.rotation,
      locked: obstacleInput.locked,
    };
    expect(obstacleInputSchema.safeParse(withoutClearance).success).toBe(false);
    expect(
      obstacleInputSchema.safeParse({
        ...obstacleInput,
        functionalClearance: { frontCm: 10 },
      }).success,
    ).toBe(false);
  });

  it("rejects generated wall-element IDs in add input", () => {
    expect(
      wallElementInputSchema.safeParse({
        id: "wall-element_bad",
        kind: "window",
        name: "Window",
        wall: "top",
        offsetCm: 10,
        widthCm: 120,
      }).success,
    ).toBe(false);
  });

  it("rejects generated IDs and unknown Phase 6 fields in add input", () => {
    expect(obstacleInputSchema.safeParse({ ...obstacleInput, id: "obstacle_bad" }).success).toBe(
      false,
    );
    expect(obstacleInputSchema.safeParse({ ...obstacleInput, productId: "rack" }).success).toBe(
      false,
    );
  });

  it("rejects unknown keys at command, payload, and patch boundaries", () => {
    expect(
      projectCommandSchema.safeParse({
        type: "ROOM_CONFIGURED",
        payload: { widthCm: 500, depthCm: 400, heightCm: 250 },
        source: "agent",
      }).success,
    ).toBe(false);
    expect(
      projectCommandSchema.safeParse({
        type: "OBSTACLE_REMOVED",
        payload: { obstacleId: "obstacle_wardrobe", force: true },
      }).success,
    ).toBe(false);
    expect(
      projectCommandSchema.safeParse({
        type: "OBSTACLE_UPDATED",
        payload: {
          obstacleId: "obstacle_wardrobe",
          patch: { rotation: 90, selected: true },
        },
      }).success,
    ).toBe(false);
  });

  it.each([
    { type: "PROJECT_RESET", payload: {} },
    { type: "OBSTACLE_UPDATED", payload: { obstacleId: "bad-id", patch: { locked: false } } },
    { type: "PROJECT_SETTINGS_UPDATED", payload: { budget: -1 } },
  ])("rejects malformed command %#", (command) => {
    expect(projectCommandSchema.safeParse(command).success).toBe(false);
  });

  it("converts command inputs to unambiguous union JSON Schemas", () => {
    for (const schema of [
      projectSettingsPatchSchema,
      functionalClearancePatchSchema,
      obstaclePatchSchema,
      wallElementPatchSchema,
      placementPatchSchema,
      projectCommandSchema,
    ]) {
      const jsonSchema = z.toJSONSchema(schema);
      expect(jsonSchema).toEqual(expect.objectContaining({ $schema: expect.any(String) }));
      expect("anyOf" in jsonSchema || "oneOf" in jsonSchema).toBe(true);
    }
  });
});
