import { describe, expect, it } from "vitest";

import {
  addObstacleInputSchema,
  addObstacleJsonSchema,
  addWallElementInputSchema,
  addWallElementJsonSchema,
  configureRoomInputSchema,
  configureRoomJsonSchema,
  getProjectStateInputSchema,
  getProjectStateJsonSchema,
  mapRoomToolInputIssues,
  addProductToProjectInputSchema,
  addProductToProjectJsonSchema,
  placeProductInputSchema,
  placeProductJsonSchema,
  placeProjectItemInputSchema,
  placeProjectItemJsonSchema,
  removeObstacleInputSchema,
  removeObstacleJsonSchema,
  removeWallElementInputSchema,
  removeWallElementJsonSchema,
  removeProductInputSchema,
  removeProductJsonSchema,
  unplaceProductInputSchema,
  unplaceProductJsonSchema,
  updateObstacleInputSchema,
  updateObstacleJsonSchema,
  updateWallElementInputSchema,
  updateWallElementJsonSchema,
  updateProjectSettingsInputSchema,
  updateProjectSettingsJsonSchema,
  updatePlacementInputSchema,
  updatePlacementJsonSchema,
  validateLayoutInputSchema,
  validateLayoutJsonSchema,
} from "./room-tool-schemas";

const validObstacle = {
  kind: "obstacle",
  name: "Column",
  position: { xCm: 0, zCm: 0 },
  dimensions: { widthCm: 1, depthCm: 1, heightCm: 1 },
  rotation: 270,
  locked: false,
} as const;

const validWallElement = {
  kind: "door",
  name: "Main door",
  wall: "top",
  offsetCm: 100,
  widthCm: 90,
} as const;

describe("room tool input schemas", () => {
  it("requires strict empty objects for both read tools", () => {
    expect(getProjectStateInputSchema.parse({})).toEqual({});
    expect(validateLayoutInputSchema.parse({})).toEqual({});
    expect(getProjectStateInputSchema.safeParse({ revision: 1 }).success).toBe(false);
    expect(validateLayoutInputSchema.safeParse({ verbose: true }).success).toBe(false);
  });

  it("preserves room integer and positivity boundaries", () => {
    expect(
      configureRoomInputSchema.parse({ widthCm: 1, depthCm: 1, heightCm: 1 }),
    ).toEqual({ widthCm: 1, depthCm: 1, heightCm: 1 });

    for (const input of [
      {},
      { widthCm: 0, depthCm: 1, heightCm: 1 },
      { widthCm: 1.5, depthCm: 1, heightCm: 1 },
      { widthCm: 1, depthCm: -1, heightCm: 1 },
      { widthCm: 1, depthCm: 1, heightCm: 1, unit: "cm" },
    ]) {
      expect(configureRoomInputSchema.safeParse(input).success).toBe(false);
    }
  });

  it("requires a non-empty settings patch with domain field constraints", () => {
    expect(updateProjectSettingsInputSchema.parse({ budget: 0 })).toEqual({ budget: 0 });
    expect(
      updateProjectSettingsInputSchema.parse({
        trainingGoals: ["strength", "mobility"],
      }),
    ).toEqual({ trainingGoals: ["strength", "mobility"] });

    for (const input of [
      {},
      { budget: -1 },
      { budget: 1.5 },
      { trainingGoals: ["speed"] },
      { trainingGoals: Array(6).fill("strength") },
      { budget: 100, currency: "USD" },
    ]) {
      expect(updateProjectSettingsInputSchema.safeParse(input).success).toBe(false);
    }
  });

  it("preserves obstacle boundaries and canonical generated-ID separation", () => {
    expect(addObstacleInputSchema.parse(validObstacle)).toEqual(validObstacle);
    for (const input of [
      { ...validObstacle, id: "obstacle_caller" },
      { ...validObstacle, name: " " },
      { ...validObstacle, name: "x".repeat(81) },
      { ...validObstacle, kind: "equipment" },
      { ...validObstacle, position: { xCm: -1, zCm: 0 } },
      { ...validObstacle, dimensions: { widthCm: 0, depthCm: 1, heightCm: 1 } },
      { ...validObstacle, rotation: 45 },
    ]) {
      expect(addObstacleInputSchema.safeParse(input).success).toBe(false);
    }
  });

  it("models unavailable zones as strict 2D entities", () => {
    const zone = {
      ...validObstacle,
      kind: "unavailable-zone",
      dimensions: { widthCm: 50, depthCm: 70 },
    } as const;
    expect(addObstacleInputSchema.parse(zone)).toEqual(zone);
    expect(
      addObstacleInputSchema.safeParse({
        ...zone,
        dimensions: { ...zone.dimensions, heightCm: 200 },
      }).success,
    ).toBe(false);
  });

  it("requires canonical IDs and non-empty strict update patches", () => {
    expect(
      updateObstacleInputSchema.parse({
        obstacleId: "obstacle_column",
        patch: { locked: false },
      }),
    ).toEqual({ obstacleId: "obstacle_column", patch: { locked: false } });
    expect(
      removeObstacleInputSchema.parse({ obstacleId: "obstacle_column" }),
    ).toEqual({ obstacleId: "obstacle_column" });

    for (const input of [
      { obstacleId: "bad-id", patch: { name: "Rack" } },
      { obstacleId: "obstacle_column", patch: {} },
      { obstacleId: "obstacle_column", patch: { name: "Rack", extra: true } },
      { obstacleId: "obstacle_column", patch: { rotation: 180 }, extra: true },
    ]) {
      expect(updateObstacleInputSchema.safeParse(input).success).toBe(false);
    }
    expect(removeObstacleInputSchema.safeParse({ obstacleId: "bad-id" }).success).toBe(
      false,
    );
    expect(
      updateObstacleInputSchema.safeParse({
        obstacleId: "obstacle_column",
        patch: { kind: "unavailable-zone" },
      }).success,
    ).toBe(false);
  });

  it("requires strict generated-ID-separated wall element inputs and immutable kind", () => {
    expect(addWallElementInputSchema.parse(validWallElement)).toEqual(validWallElement);
    expect(
      updateWallElementInputSchema.parse({
        wallElementId: "wall-element_main-door",
        patch: { wall: "left", offsetCm: 20 },
      }),
    ).toEqual({
      wallElementId: "wall-element_main-door",
      patch: { wall: "left", offsetCm: 20 },
    });
    expect(
      removeWallElementInputSchema.parse({
        wallElementId: "wall-element_main-door",
      }),
    ).toEqual({ wallElementId: "wall-element_main-door" });

    for (const input of [
      { ...validWallElement, id: "wall-element_caller" },
      { ...validWallElement, kind: "opening" },
      { ...validWallElement, wall: "ceiling" },
      { ...validWallElement, offsetCm: -1 },
      { ...validWallElement, widthCm: 0 },
    ]) {
      expect(addWallElementInputSchema.safeParse(input).success).toBe(false);
    }
    for (const input of [
      { wallElementId: "bad-id", patch: { name: "Window" } },
      { wallElementId: "wall-element_main-door", patch: {} },
      { wallElementId: "wall-element_main-door", patch: { kind: "window" } },
      { wallElementId: "wall-element_main-door", patch: { widthCm: 80, extra: true } },
    ]) {
      expect(updateWallElementInputSchema.safeParse(input).success).toBe(false);
    }
  });

  it("advertises strict JSON Schema equivalents that serialize cleanly", () => {
    for (const schema of [
      getProjectStateJsonSchema,
      validateLayoutJsonSchema,
      configureRoomJsonSchema,
      addObstacleJsonSchema,
      updateObstacleJsonSchema,
      removeObstacleJsonSchema,
      addWallElementJsonSchema,
      updateWallElementJsonSchema,
      removeWallElementJsonSchema,
      placeProductJsonSchema,
      addProductToProjectJsonSchema,
      placeProjectItemJsonSchema,
      updatePlacementJsonSchema,
      unplaceProductJsonSchema,
      removeProductJsonSchema,
    ]) {
      const branches = "oneOf" in schema ? schema.oneOf : undefined;
      if (Array.isArray(branches)) {
        for (const branch of branches) {
          expect(branch).toMatchObject({
            type: "object",
            additionalProperties: false,
          });
        }
      } else {
        expect(schema).toMatchObject({
          type: "object",
          additionalProperties: false,
        });
      }
      expect(() => JSON.stringify(schema)).not.toThrow();
    }
    expect(configureRoomJsonSchema).toMatchObject({
      required: ["widthCm", "depthCm", "heightCm"],
      properties: { widthCm: { type: "integer", exclusiveMinimum: 0 } },
    });
    expect(updateProjectSettingsJsonSchema).toHaveProperty("anyOf");
    expect(updateProjectSettingsJsonSchema.anyOf).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "object", additionalProperties: false }),
      ]),
    );
    expect(addObstacleJsonSchema).not.toHaveProperty("properties.id");
    expect(updateObstacleJsonSchema).toMatchObject({
      required: ["obstacleId", "patch"],
    });
    expect(addWallElementJsonSchema).not.toHaveProperty("properties.id");
    expect(updateWallElementJsonSchema).toMatchObject({
      required: ["wallElementId", "patch"],
    });
    expect(placeProductJsonSchema).not.toHaveProperty("properties.id");
    expect(updatePlacementJsonSchema).toMatchObject({
      required: ["placementId", "patch"],
    });
  });

  it("maps nested and unknown-key failures to stable authored issues", () => {
    const parsed = updateObstacleInputSchema.safeParse({
      obstacleId: "obstacle_column",
      patch: { dimensions: { widthCm: 0, depthCm: 1, heightCm: 1 }, extra: true },
    });
    if (parsed.success) throw new Error("Expected invalid input.");

    expect(mapRoomToolInputIssues(parsed.error)).toEqual(
      expect.arrayContaining([
        {
          path: "patch.dimensions.widthCm",
          message: "Width must be a positive integer number of centimeters.",
        },
        { path: "patch.extra", message: "This field is not supported." },
      ]),
    );
  });
});

describe("placement tool input schemas", () => {
  it("requires canonical strict inputs and non-empty move/rotation patches", () => {
    const placement = {
      productId: "product_northstar_half_rack",
      position: { xCm: 0, zCm: 12 },
      rotation: 90,
    } as const;
    expect(placeProductInputSchema.parse(placement)).toEqual(placement);
    expect(
      updatePlacementInputSchema.parse({
        placementId: "placement_agent-rack",
        patch: { position: { xCm: 25, zCm: 30 }, rotation: 180 },
      }),
    ).toEqual({
      placementId: "placement_agent-rack",
      patch: { position: { xCm: 25, zCm: 30 }, rotation: 180 },
    });
    expect(
      addProductToProjectInputSchema.parse({ productId: placement.productId }),
    ).toEqual({ productId: placement.productId });
    expect(
      placeProjectItemInputSchema.parse({
        projectItemId: "project-item_agent-rack",
        position: placement.position,
        rotation: placement.rotation,
      }),
    ).toEqual({
      projectItemId: "project-item_agent-rack",
      position: placement.position,
      rotation: placement.rotation,
    });
    expect(
      unplaceProductInputSchema.parse({ placementId: "placement_agent-rack" }),
    ).toEqual({ placementId: "placement_agent-rack" });
    expect(
      removeProductInputSchema.parse({ projectItemId: "project-item_agent-rack" }),
    ).toEqual({ projectItemId: "project-item_agent-rack" });

    for (const input of [
      { ...placement, id: "placement_caller" },
      { ...placement, productId: "rack" },
      { ...placement, position: { xCm: -1, zCm: 0 } },
      { ...placement, position: { xCm: 1.5, zCm: 0 } },
      { ...placement, rotation: 45 },
    ]) {
      expect(placeProductInputSchema.safeParse(input).success).toBe(false);
    }
    for (const input of [
      { placementId: "bad-id", patch: { rotation: 90 } },
      { placementId: "placement_agent-rack", patch: {} },
      { placementId: "placement_agent-rack", patch: { productId: placement.productId } },
      { placementId: "placement_agent-rack", patch: { rotation: 90 }, extra: true },
    ]) {
      expect(updatePlacementInputSchema.safeParse(input).success).toBe(false);
    }
    expect(
      removeProductInputSchema.safeParse({ placementId: "placement_agent-rack" }).success,
    ).toBe(false);
    expect(
      placeProjectItemInputSchema.safeParse({
        projectItemId: "placement_agent-rack",
        position: placement.position,
        rotation: placement.rotation,
      }).success,
    ).toBe(false);
  });
});
