import { describe, expect, it } from "vitest";

import { createDefaultProject } from "../defaults";
import type { GymProject, Obstacle } from "../schemas/project";
import {
  applyProjectCommand,
  type ProjectCommandDependencies,
} from "./apply-project-command";

const obstacleInput = {
  kind: "obstacle",
  name: "Wardrobe",
  position: { xCm: 0, zCm: 0 },
  dimensions: { widthCm: 180, depthCm: 60, heightCm: 220 },
  rotation: 0,
  locked: false,
} as const;

function withObstacle(overrides: Partial<Obstacle> = {}): GymProject {
  const project = createDefaultProject();
  return {
    ...project,
    obstacles: [{ id: "obstacle_existing", ...obstacleInput, ...overrides }],
  };
}

function dependencies(id = "obstacle_generated"): ProjectCommandDependencies {
  return { generateObstacleId: () => id };
}

describe("applyProjectCommand", () => {
  it("configures a room and applies spatially invalid shrinkage with issues", () => {
    const project = withObstacle();
    const execution = applyProjectCommand(project, {
      type: "ROOM_CONFIGURED",
      payload: { widthCm: 100, depthCm: 100, heightCm: 200 },
    });

    expect(execution.result).toMatchObject({
      ok: true,
      changed: true,
      commandType: "ROOM_CONFIGURED",
      affectedEntityIds: [],
      issues: [
        {
          code: "OUTSIDE_ROOM",
          entityIds: ["obstacle_existing"],
          details: { axes: ["x", "height"] },
        },
      ],
    });
    expect(execution.project.room).toEqual({
      widthCm: 100,
      depthCm: 100,
      heightCm: 200,
    });
    expect(project.room).toEqual({ widthCm: 400, depthCm: 320, heightCm: 240 });
  });

  it("updates settings and reports an exact no-op", () => {
    const project = createDefaultProject();
    const changed = applyProjectCommand(project, {
      type: "PROJECT_SETTINGS_UPDATED",
      payload: { budget: 12_000, trainingGoals: ["strength"] },
    });
    expect(changed.result).toMatchObject({ ok: true, changed: true });
    expect(changed.project).toMatchObject({
      budget: 12_000,
      trainingGoals: ["strength"],
    });

    const unchanged = applyProjectCommand(changed.project, {
      type: "PROJECT_SETTINGS_UPDATED",
      payload: { budget: 12_000 },
    });
    expect(unchanged.result).toMatchObject({ ok: true, changed: false });
    expect(unchanged.project).toBe(changed.project);
  });

  it("adds an obstacle only with the injected ID and detects collisions", () => {
    const project = withObstacle();
    const execution = applyProjectCommand(
      project,
      { type: "OBSTACLE_ADDED", payload: { ...obstacleInput, name: "Bench" } },
      dependencies(),
    );

    expect(execution.result).toMatchObject({
      ok: true,
      changed: true,
      affectedEntityIds: ["obstacle_generated"],
      issues: [
        {
          code: "PHYSICAL_COLLISION",
          entityIds: ["obstacle_existing", "obstacle_generated"],
        },
      ],
    });
    expect(execution.project.obstacles.map(({ id }) => id)).toEqual([
      "obstacle_existing",
      "obstacle_generated",
    ]);
    expect(project.obstacles).toHaveLength(1);
  });

  it("rejects a generated ID collision or malformed generated ID", () => {
    const project = withObstacle();
    const duplicate = applyProjectCommand(
      project,
      { type: "OBSTACLE_ADDED", payload: obstacleInput },
      dependencies("obstacle_existing"),
    );
    expect(duplicate.result).toMatchObject({
      ok: false,
      error: { code: "ID_CONFLICT" },
    });
    expect(duplicate.project).toBe(project);

    const malformed = applyProjectCommand(
      project,
      { type: "OBSTACLE_ADDED", payload: obstacleInput },
      dependencies("not valid"),
    );
    expect(malformed.result).toMatchObject({
      ok: false,
      error: { code: "EXECUTION_FAILED" },
    });
    expect(malformed.project).toBe(project);
  });

  it("updates only the selected obstacle and preserves structural sharing", () => {
    const untouched: Obstacle = {
      id: "obstacle_untouched",
      ...obstacleInput,
      position: { xCm: 250, zCm: 100 },
    };
    const project = {
      ...withObstacle(),
      obstacles: [...withObstacle().obstacles, untouched],
    };
    const execution = applyProjectCommand(project, {
      type: "OBSTACLE_UPDATED",
      payload: {
        obstacleId: "obstacle_existing",
        patch: { name: "  Storage wall  ", rotation: 90 },
      },
    });

    expect(execution.result).toMatchObject({ ok: true, changed: true });
    expect(execution.project.obstacles[0]).toMatchObject({
      name: "Storage wall",
      rotation: 90,
    });
    expect(execution.project.obstacles[1]).toBe(untouched);
    expect(project.obstacles[0].name).toBe("Wardrobe");
  });

  it("reports an obstacle update no-op without replacing the project", () => {
    const project = withObstacle();
    const execution = applyProjectCommand(project, {
      type: "OBSTACLE_UPDATED",
      payload: { obstacleId: "obstacle_existing", patch: { rotation: 0 } },
    });

    expect(execution.result).toMatchObject({
      ok: true,
      changed: false,
      affectedEntityIds: ["obstacle_existing"],
    });
    expect(execution.project).toBe(project);
  });
});

describe("applyProjectCommand preconditions and failures", () => {
  it("enforces a separate unlock command before edits or removal", () => {
    const project = withObstacle({ locked: true });
    const forbiddenCommands = [
      {
        type: "OBSTACLE_UPDATED",
        payload: { obstacleId: "obstacle_existing", patch: { name: "Moved" } },
      },
      {
        type: "OBSTACLE_UPDATED",
        payload: {
          obstacleId: "obstacle_existing",
          patch: { locked: false, name: "Moved" },
        },
      },
      {
        type: "OBSTACLE_REMOVED",
        payload: { obstacleId: "obstacle_existing" },
      },
    ];

    for (const command of forbiddenCommands) {
      const execution = applyProjectCommand(project, command);
      expect(execution.result).toMatchObject({
        ok: false,
        error: { code: "ENTITY_LOCKED" },
      });
      expect(execution.project).toBe(project);
    }

    const unlocked = applyProjectCommand(project, {
      type: "OBSTACLE_UPDATED",
      payload: { obstacleId: "obstacle_existing", patch: { locked: false } },
    });
    expect(unlocked.result).toMatchObject({ ok: true, changed: true });
    expect(unlocked.project.obstacles[0].locked).toBe(false);
  });

  it.each([
    [
      "update",
      {
        type: "OBSTACLE_UPDATED",
        payload: { obstacleId: "obstacle_missing", patch: { rotation: 90 } },
      },
    ],
    [
      "remove",
      {
        type: "OBSTACLE_REMOVED",
        payload: { obstacleId: "obstacle_missing" },
      },
    ],
  ])("rejects a missing entity during %s", (_label, command) => {
    const project = createDefaultProject();
    const execution = applyProjectCommand(project, command);
    expect(execution.result).toMatchObject({
      ok: false,
      error: { code: "ENTITY_NOT_FOUND" },
    });
    expect(execution.project).toBe(project);
  });

  it("removes an unlocked obstacle", () => {
    const project = withObstacle();
    const execution = applyProjectCommand(project, {
      type: "OBSTACLE_REMOVED",
      payload: { obstacleId: "obstacle_existing" },
    });
    expect(execution.result).toMatchObject({
      ok: true,
      changed: true,
      affectedEntityIds: ["obstacle_existing"],
    });
    expect(execution.project.obstacles).toEqual([]);
  });

  it.each([
    null,
    {},
    { type: "UNKNOWN", payload: {} },
    { type: "ROOM_CONFIGURED", payload: { widthCm: -1 } },
    { type: "PROJECT_SETTINGS_UPDATED", payload: {} },
    { type: "OBSTACLE_ADDED", payload: { ...obstacleInput, extra: true } },
    {
      type: "OBSTACLE_UPDATED",
      payload: { obstacleId: "obstacle_existing", patch: {} },
    },
    { type: "OBSTACLE_REMOVED", payload: {} },
  ])("rejects malformed command input %#", (command) => {
    const project = withObstacle();
    const execution = applyProjectCommand(project, command);
    expect(execution.result).toMatchObject({
      ok: false,
      error: { code: "INVALID_COMMAND", message: "Command input is invalid." },
    });
    expect(execution.project).toBe(project);
  });

  it("redacts unexpected dependency errors and serializes every result", () => {
    const project = createDefaultProject();
    const execution = applyProjectCommand(
      project,
      { type: "OBSTACLE_ADDED", payload: obstacleInput },
      {
        generateObstacleId: () => {
          throw new Error("secret internal detail");
        },
      },
    );

    expect(execution.result).toEqual({
      ok: false,
      commandType: "OBSTACLE_ADDED",
      error: {
        code: "EXECUTION_FAILED",
        message: "The command could not be executed.",
      },
    });
    expect(JSON.stringify(execution.result)).not.toContain("secret");
    expect(() => JSON.stringify(execution.result)).not.toThrow();
  });
});
