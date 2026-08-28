import { describe, expect, it } from "vitest";

import type { GymProject, Obstacle } from "../schemas/project";
import { validateProject } from "./validate-project";

function obstacle(
  id: string,
  overrides: Partial<Obstacle> = {},
): Obstacle {
  return {
    id,
    kind: "obstacle",
    name: id,
    position: { xCm: 0, zCm: 0 },
    dimensions: { widthCm: 50, depthCm: 50, heightCm: 200 },
    rotation: 0,
    locked: false,
    ...overrides,
  };
}

function project(obstacles: Obstacle[]): GymProject {
  return {
    version: 1,
    room: { widthCm: 300, depthCm: 250, heightCm: 220 },
    obstacles,
    budget: 10_000,
    trainingGoals: [],
  };
}

describe("validateProject", () => {
  it("returns no issues for an empty or valid non-overlapping room", () => {
    expect(validateProject(project([]))).toEqual([]);
    expect(
      validateProject(
        project([
          obstacle("obstacle_a"),
          obstacle("obstacle_b", { position: { xCm: 50, zCm: 50 } }),
        ]),
      ),
    ).toEqual([]);
  });

  it("reports horizontal and height overflow together", () => {
    const issues = validateProject(
      project([
        obstacle("obstacle_outside", {
          position: { xCm: 270, zCm: 230 },
          dimensions: { widthCm: 40, depthCm: 30, heightCm: 221 },
        }),
      ]),
    );

    expect(issues).toEqual([
      {
        code: "OUTSIDE_ROOM",
        severity: "error",
        entityIds: ["obstacle_outside"],
        details: {
          axes: ["x", "z", "height"],
          footprint: { minX: 270, minZ: 230, maxX: 310, maxZ: 260 },
          room: { widthCm: 300, depthCm: 250, heightCm: 220 },
          entityHeightCm: 221,
        },
      },
    ]);
  });

  it("applies the collision matrix and reports all issue kinds in one pass", () => {
    const issues = validateProject(
      project([
        obstacle("obstacle_b", { position: { xCm: 30, zCm: 30 } }),
        obstacle("obstacle_a"),
        obstacle("obstacle_zone", {
          kind: "unavailable-zone",
          position: { xCm: 40, zCm: 40 },
        }),
        obstacle("obstacle_zone-two", {
          kind: "unavailable-zone",
          position: { xCm: 45, zCm: 45 },
        }),
        obstacle("obstacle_outside", {
          position: { xCm: 290, zCm: 0 },
        }),
      ]),
    );

    expect(issues.map(({ code, entityIds }) => ({ code, entityIds }))).toEqual([
      { code: "PHYSICAL_COLLISION", entityIds: ["obstacle_a", "obstacle_b"] },
      {
        code: "UNAVAILABLE_ZONE_CONFLICT",
        entityIds: ["obstacle_a", "obstacle_zone"],
      },
      {
        code: "UNAVAILABLE_ZONE_CONFLICT",
        entityIds: ["obstacle_a", "obstacle_zone-two"],
      },
      {
        code: "UNAVAILABLE_ZONE_CONFLICT",
        entityIds: ["obstacle_b", "obstacle_zone"],
      },
      {
        code: "UNAVAILABLE_ZONE_CONFLICT",
        entityIds: ["obstacle_b", "obstacle_zone-two"],
      },
      { code: "OUTSIDE_ROOM", entityIds: ["obstacle_outside"] },
    ]);
    expect(
      issues.some(
        (issue) =>
          issue.entityIds.includes("obstacle_zone") &&
          issue.entityIds.includes("obstacle_zone-two"),
      ),
    ).toBe(false);
  });

  it("normalizes pairs and issue ordering independently of input order", () => {
    const obstacles = [
      obstacle("obstacle_z", { position: { xCm: 20, zCm: 20 } }),
      obstacle("obstacle_a"),
      obstacle("obstacle_zone", {
        kind: "unavailable-zone",
        position: { xCm: 10, zCm: 10 },
      }),
    ];

    const forward = validateProject(project(obstacles));
    const reversed = validateProject(project([...obstacles].reverse()));

    expect(reversed).toEqual(forward);
    expect(
      forward.every(
        (issue) =>
          issue.entityIds.length === 1 || issue.entityIds[0] < issue.entityIds[1],
      ),
    ).toBe(true);
    expect(new Set(forward.map((issue) => JSON.stringify(issue.entityIds))).size).toBe(
      forward.length,
    );
  });

  it("orders punctuation-bearing IDs by code units rather than host locale", () => {
    const issues = validateProject(
      project([
        obstacle("obstacle_a_b"),
        obstacle("obstacle_a-b"),
        obstacle("obstacle_z"),
      ]),
    );

    expect(issues.map(({ entityIds }) => entityIds)).toEqual([
      ["obstacle_a-b", "obstacle_a_b"],
      ["obstacle_a-b", "obstacle_z"],
      ["obstacle_a_b", "obstacle_z"],
    ]);
  });

  it("is repeatable, JSON-serializable, and does not mutate frozen input", () => {
    const first = obstacle("obstacle_a");
    Object.freeze(first.position);
    Object.freeze(first.dimensions);
    Object.freeze(first);
    const input = project([first]);
    Object.freeze(input.room);
    Object.freeze(input.obstacles);
    Object.freeze(input.trainingGoals);
    Object.freeze(input);

    const firstResult = validateProject(input);
    const secondResult = validateProject(input);

    expect(secondResult).toEqual(firstResult);
    expect(() => JSON.stringify(firstResult)).not.toThrow();
  });

  it("accepts edge contact but detects one-centimeter overlap symmetrically", () => {
    const fixed = obstacle("obstacle_fixed");
    const touching = obstacle("obstacle_touching", {
      position: { xCm: 50, zCm: 0 },
    });
    const overlapping = obstacle("obstacle_overlapping", {
      position: { xCm: 49, zCm: 0 },
    });

    expect(validateProject(project([fixed, touching]))).toEqual([]);
    expect(validateProject(project([fixed, overlapping]))).toEqual(
      validateProject(project([overlapping, fixed])),
    );
    expect(validateProject(project([fixed, overlapping]))[0]).toMatchObject({
      code: "PHYSICAL_COLLISION",
      details: { overlap: { minX: 49, maxX: 50, minZ: 0, maxZ: 50 } },
    });
  });
});
