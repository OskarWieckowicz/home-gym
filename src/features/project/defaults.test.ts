import { describe, expect, it } from "vitest";

import { createDefaultProject } from "./defaults";
import { gymProjectSchema } from "./schemas/project";

describe("createDefaultProject", () => {
  it("returns a valid version 4 empty project", () => {
    const project = createDefaultProject();

    expect(gymProjectSchema.parse(project)).toEqual(project);
    expect(project).toMatchObject({
      version: 4,
      obstacles: [],
      wallElements: [],
      projectItems: [],
      placements: [],
      trainingGoals: [],
    });
  });

  it("returns deeply independent mutable values", () => {
    const first = createDefaultProject();
    const second = createDefaultProject();

    expect(first).not.toBe(second);
    expect(first.room).not.toBe(second.room);
    expect(first.obstacles).not.toBe(second.obstacles);
    expect(first.wallElements).not.toBe(second.wallElements);
    expect(first.projectItems).not.toBe(second.projectItems);
    expect(first.placements).not.toBe(second.placements);
    expect(first.trainingGoals).not.toBe(second.trainingGoals);

    first.room.widthCm = 999;
    first.obstacles.push({
      id: "obstacle_test",
      kind: "obstacle",
      name: "Test",
      position: { xCm: 0, zCm: 0 },
      dimensions: { widthCm: 1, depthCm: 1, heightCm: 1 },
      rotation: 0,
      locked: false,
    });
    first.trainingGoals.push("strength");

    expect(second).toEqual(createDefaultProject());
  });
});
