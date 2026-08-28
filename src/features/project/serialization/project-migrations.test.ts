import { describe, expect, it } from "vitest";

import { createDefaultProject } from "../defaults";
import {
  CURRENT_PROJECT_VERSION,
  migrateProjectToCurrent,
  SUPPORTED_PROJECT_VERSIONS,
} from "./project-migrations";

describe("project migrations", () => {
  it("declares version 2 as current and supports migration from version 1", () => {
    expect(CURRENT_PROJECT_VERSION).toBe(2);
    expect(SUPPORTED_PROJECT_VERSIONS).toEqual([1, 2]);
  });

  it("passes the current version through without changing its reference", () => {
    const project = createDefaultProject();

    expect(migrateProjectToCurrent(project, 2)).toEqual({
      success: true,
      data: project,
    });
  });

  it("migrates v1 obstacles without inferring wall elements", () => {
    const legacyProject = {
      version: 1,
      room: { widthCm: 400, depthCm: 320, heightCm: 240 },
      obstacles: [
        {
          id: "obstacle_rack",
          kind: "obstacle",
          name: "Rack",
          position: { xCm: 10, zCm: 20 },
          dimensions: { widthCm: 120, depthCm: 100, heightCm: 220 },
          rotation: 0,
          locked: false,
        },
        {
          id: "obstacle_door-swing",
          kind: "unavailable-zone",
          name: "Door swing",
          position: { xCm: 0, zCm: 0 },
          dimensions: { widthCm: 90, depthCm: 90, heightCm: 10 },
          rotation: 90,
          locked: true,
        },
      ],
      budget: 10_000,
      trainingGoals: ["strength"],
    };

    expect(migrateProjectToCurrent(legacyProject, 1)).toEqual({
      success: true,
      data: {
        ...legacyProject,
        version: 2,
        obstacles: [
          legacyProject.obstacles[0],
          {
            ...legacyProject.obstacles[1],
            dimensions: { widthCm: 90, depthCm: 90 },
          },
        ],
        wallElements: [],
      },
    });
  });

  it("classifies an older version without a migration as a migration failure", () => {
    expect(migrateProjectToCurrent({ version: 0 }, 0)).toEqual({
      success: false,
      error: {
        code: "migration-failed",
        message: "The saved project could not be migrated from version 0.",
      },
    });
  });
});
