import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  gymProjectSchema,
  obstacleKindSchema,
  obstacleSchema,
  physicalObstacleSchema,
  placementSchema,
  PROJECT_NAME_MAX_LENGTH,
  projectItemSchema,
  roomSchema,
  unavailableZoneSchema,
  wallElementSchema,
} from "./project";

const validObstacle = {
  id: "obstacle_power-rack",
  kind: "obstacle",
  name: "Power rack",
  position: { xCm: 20, zCm: 30 },
  dimensions: { widthCm: 120, depthCm: 100, heightCm: 220 },
  rotation: 90,
  locked: false,
} as const;

const validProject = {
  version: 4,
  room: { widthCm: 400, depthCm: 320, heightCm: 240 },
  obstacles: [validObstacle],
  wallElements: [],
  projectItems: [],
  placements: [],
  budget: 10_000,
  trainingGoals: ["strength", "mobility"],
} as const;

describe("project schemas", () => {
  it("parses a complete project and normalizes names once", () => {
    expect(gymProjectSchema.parse(validProject)).toEqual(validProject);
    expect(obstacleSchema.parse({ ...validObstacle, name: "  Rack  " }).name).toBe(
      "Rack",
    );
  });

  it.each(["obstacle", "unavailable-zone"])("accepts obstacle kind %s", (kind) => {
    expect(obstacleKindSchema.parse(kind)).toBe(kind);
  });

  it.each([
    ["fractional dimensions", { room: { ...validProject.room, widthCm: 399.5 } }],
    ["zero dimensions", { room: { ...validProject.room, widthCm: 0 } }],
    ["negative budget", { budget: -1 }],
    ["fractional budget", { budget: 99.5 }],
    ["unsupported version", { version: 2 }],
    ["unsupported training goal", { trainingGoals: ["powerlifting"] }],
  ])("rejects %s", (_label, replacement) => {
    expect(gymProjectSchema.safeParse({ ...validProject, ...replacement }).success).toBe(
      false,
    );
  });

  it.each([0, 45, 360])("rejects unsupported rotation %d", (rotation) => {
    const candidate = {
      ...validProject,
      obstacles: [{ ...validObstacle, rotation }],
    };
    expect(gymProjectSchema.safeParse(candidate).success).toBe(rotation === 0);
  });

  it("rejects blank, oversized, and invalid-ID obstacles", () => {
    for (const replacement of [
      { name: "   " },
      { name: "x".repeat(PROJECT_NAME_MAX_LENGTH + 1) },
      { id: "rack" },
    ]) {
      expect(obstacleSchema.safeParse({ ...validObstacle, ...replacement }).success).toBe(
        false,
      );
    }
  });

  it("rejects duplicate obstacle IDs", () => {
    expect(
      gymProjectSchema.safeParse({
        ...validProject,
        obstacles: [validObstacle, { ...validObstacle, name: "Another rack" }],
      }).success,
    ).toBe(false);
  });

  it("keeps unavailable zones strictly 2D", () => {
    const zone = {
      ...validObstacle,
      kind: "unavailable-zone",
      dimensions: { widthCm: 120, depthCm: 100 },
    } as const;

    expect(unavailableZoneSchema.safeParse(zone).success).toBe(true);
    expect(
      unavailableZoneSchema.safeParse({
        ...zone,
        dimensions: { ...zone.dimensions, heightCm: 1 },
      }).success,
    ).toBe(false);
  });

  it("parses minimal wall elements and rejects duplicate IDs", () => {
    const door = {
      id: "wall-element_door",
      kind: "door",
      name: "Door",
      wall: "top",
      offsetCm: 50,
      widthCm: 90,
    } as const;
    expect(wallElementSchema.parse(door)).toEqual(door);
    expect(
      gymProjectSchema.safeParse({
        ...validProject,
        wallElements: [door, { ...door, name: "Other door" }],
      }).success,
    ).toBe(false);
  });

  it("parses placements and rejects duplicate placement IDs", () => {
    const item = {
      id: "project-item_rack",
      productId: "product_northstar_half_rack",
    } as const;
    const placement = {
      id: "placement_rack",
      projectItemId: "project-item_rack",
      position: { xCm: 20, zCm: 30 },
      rotation: 270,
    } as const;

    expect(projectItemSchema.parse(item)).toEqual(item);
    expect(placementSchema.parse(placement)).toEqual(placement);
    expect(
      gymProjectSchema.safeParse({
        ...validProject,
        projectItems: [item],
        placements: [placement, placement],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate items, dangling placements, and a second placement for one item", () => {
    const item = {
      id: "project-item_rack",
      productId: "product_northstar_half_rack",
    } as const;
    const placement = {
      id: "placement_rack",
      projectItemId: "project-item_rack",
      position: { xCm: 20, zCm: 30 },
      rotation: 0,
    } as const;

    expect(
      gymProjectSchema.safeParse({
        ...validProject,
        projectItems: [item, item],
      }).success,
    ).toBe(false);
    expect(
      gymProjectSchema.safeParse({
        ...validProject,
        placements: [placement],
      }).success,
    ).toBe(false);
    expect(
      gymProjectSchema.safeParse({
        ...validProject,
        projectItems: [item],
        placements: [
          placement,
          { ...placement, id: "placement_rack-b", projectItemId: item.id },
        ],
      }).success,
    ).toBe(false);
    expect(
      gymProjectSchema.parse({
        ...validProject,
        projectItems: [item],
        placements: [placement],
      }).placements[0].projectItemId,
    ).toBe(item.id);
  });

  it("rejects unknown keys at project and nested boundaries", () => {
    expect(gymProjectSchema.safeParse({ ...validProject, selection: null }).success).toBe(
      false,
    );
    expect(
      gymProjectSchema.safeParse({
        ...validProject,
        room: { ...validProject.room, unit: "cm" },
      }).success,
    ).toBe(false);
    expect(
      gymProjectSchema.safeParse({
        ...validProject,
        obstacles: [{ ...validObstacle, selected: true }],
      }).success,
    ).toBe(false);
  });

  it("exposes plain strict object JSON Schemas", () => {
    expect(z.toJSONSchema(roomSchema)).toMatchObject({
      type: "object",
      additionalProperties: false,
    });
    expect(z.toJSONSchema(physicalObstacleSchema)).toMatchObject({
      type: "object",
      additionalProperties: false,
    });
  });
});
