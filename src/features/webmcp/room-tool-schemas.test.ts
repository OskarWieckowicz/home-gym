import { describe, expect, it } from "vitest";

import {
  addObstacleInputSchema,
  addObstacleJsonSchema,
  configureRoomInputSchema,
  configureRoomJsonSchema,
  getProjectStateInputSchema,
  getProjectStateJsonSchema,
  mapRoomToolInputIssues,
  removeObstacleInputSchema,
  removeObstacleJsonSchema,
  updateObstacleInputSchema,
  updateObstacleJsonSchema,
  updateProjectSettingsInputSchema,
  updateProjectSettingsJsonSchema,
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
      { budget: 100, currency: "PLN" },
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
  });

  it("advertises strict JSON Schema equivalents that serialize cleanly", () => {
    for (const schema of [
      getProjectStateJsonSchema,
      validateLayoutJsonSchema,
      configureRoomJsonSchema,
      addObstacleJsonSchema,
      updateObstacleJsonSchema,
      removeObstacleJsonSchema,
    ]) {
      expect(schema).toMatchObject({ type: "object", additionalProperties: false });
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
