import { describe, expect, it } from "vitest";

import { createDefaultProject } from "../defaults";
import type { GymProject, PhysicalObstacle } from "../schemas/project";
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

function withObstacle(overrides: Partial<PhysicalObstacle> = {}): GymProject {
  const project = createDefaultProject();
  return {
    ...project,
    obstacles: [{ id: "obstacle_existing", ...obstacleInput, ...overrides }],
  };
}

function dependencies(id = "obstacle_generated"): ProjectCommandDependencies {
  return {
    generateObstacleId: () => id,
    generateWallElementId: () => "wall-element_generated",
    generateProjectItemId: () => "project-item_generated",
    generatePlacementId: () => "placement_generated",
    resolveProduct: (productId) =>
      productId === "product_rack"
        ? {
            id: productId,
            price: 2_000,
            dimensions: { widthCm: 100, depthCm: 80, heightCm: 220 },
            useZone: { frontCm: 50, backCm: 10, leftCm: 20, rightCm: 20 },
            minimumCeilingHeightCm: 230,
            placementMode: "floor",
            trainingGoals: ["strength"],
          }
        : productId === "product_bands"
          ? {
              id: productId,
              price: 80,
              dimensions: { widthCm: 10, depthCm: 10, heightCm: 4 },
              useZone: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
              placementMode: "selection-only",
              trainingGoals: ["mobility"],
            }
          : undefined,
  };
}

describe("applyProjectCommand", () => {
  it("places, updates, and removes a known product", () => {
    const project = createDefaultProject();
    const placed = applyProjectCommand(
      project,
      {
        type: "PRODUCT_PLACED",
        payload: {
          productId: "product_rack",
          position: { xCm: 10, zCm: 20 },
          rotation: 0,
        },
      },
      dependencies(),
    );

    expect(placed.result).toMatchObject({
      ok: true,
      changed: true,
      affectedEntityIds: ["placement_generated", "project-item_generated"],
    });
    expect(placed.project.projectItems).toEqual([
      { id: "project-item_generated", productId: "product_rack" },
    ]);
    expect(placed.project.placements).toEqual([
      {
        locked: false,
        id: "placement_generated",
        projectItemId: "project-item_generated",
        position: { xCm: 10, zCm: 20 },
        rotation: 0,
      },
    ]);

    const updated = applyProjectCommand(
      placed.project,
      {
        type: "PLACEMENT_UPDATED",
        payload: {
          placementId: "placement_generated",
          patch: { position: { xCm: 30, zCm: 40 }, rotation: 90 },
        },
      },
      dependencies(),
    );
    expect(updated.project.placements[0]).toMatchObject({
      position: { xCm: 30, zCm: 40 },
      rotation: 90,
    });

    const noOp = applyProjectCommand(
      updated.project,
      {
        type: "PLACEMENT_UPDATED",
        payload: {
          placementId: "placement_generated",
          patch: { rotation: 90 },
        },
      },
      dependencies(),
    );
    expect(noOp.result).toMatchObject({ ok: true, changed: false });

    const removed = applyProjectCommand(
      updated.project,
      {
        type: "PLACEMENT_REMOVED",
        payload: { placementId: "placement_generated" },
      },
      dependencies(),
    );
    expect(removed.project.placements).toEqual([]);
    expect(removed.project.projectItems).toEqual([
      { id: "project-item_generated", productId: "product_rack" },
    ]);
  });

  it("rejects unknown products, placement ID conflicts, and missing placements", () => {
    const project = createDefaultProject();
    const unknown = applyProjectCommand(
      project,
      {
        type: "PRODUCT_PLACED",
        payload: {
          productId: "product_unknown",
          position: { xCm: 0, zCm: 0 },
          rotation: 0,
        },
      },
      dependencies(),
    );
    expect(unknown.result).toMatchObject({ ok: false, error: { code: "ENTITY_NOT_FOUND" } });
    expect(unknown.project).toBe(project);

    const withPlacement = {
      ...project,
      projectItems: [{ id: "project-item_generated", productId: "product_rack" }],
      placements: [{
        locked: false,
        id: "placement_generated",
        projectItemId: "project-item_generated",
        position: { xCm: 0, zCm: 0 },
        rotation: 0 as const,
      }],
    };
    const conflict = applyProjectCommand(
      withPlacement,
      {
        type: "PRODUCT_PLACED",
        payload: {
          productId: "product_rack",
          position: { xCm: 200, zCm: 0 },
          rotation: 0,
        },
      },
      dependencies(),
    );
    expect(conflict.result).toMatchObject({ ok: false, error: { code: "ID_CONFLICT" } });

    const missing = applyProjectCommand(
      project,
      {
        type: "PLACEMENT_REMOVED",
        payload: { placementId: "placement_missing" },
      },
      dependencies(),
    );
    expect(missing.result).toMatchObject({ ok: false, error: { code: "ENTITY_NOT_FOUND" } });
  });

  it("adds an unplaced item, places it later, and removes it with a cascade", () => {
    const project = createDefaultProject();
    const added = applyProjectCommand(
      project,
      { type: "PROJECT_ITEM_ADDED", payload: { productId: "product_rack" } },
      dependencies(),
    );
    expect(added.project.projectItems).toEqual([
      { id: "project-item_generated", productId: "product_rack" },
    ]);
    expect(added.project.placements).toEqual([]);
    expect(added.result).toMatchObject({
      ok: true,
      affectedEntityIds: ["project-item_generated"],
    });

    const placed = applyProjectCommand(
      added.project,
      {
        type: "PROJECT_ITEM_PLACED",
        payload: {
          projectItemId: "project-item_generated",
          position: { xCm: 40, zCm: 50 },
          rotation: 90,
        },
      },
      dependencies(),
    );
    expect(placed.project.placements).toEqual([
      {
        locked: false,
        id: "placement_generated",
        projectItemId: "project-item_generated",
        position: { xCm: 40, zCm: 50 },
        rotation: 90,
      },
    ]);

    const removed = applyProjectCommand(
      placed.project,
      {
        type: "PROJECT_ITEM_REMOVED",
        payload: { projectItemId: "project-item_generated" },
      },
      dependencies(),
    );
    expect(removed.project.projectItems).toEqual([]);
    expect(removed.project.placements).toEqual([]);
    expect(removed.result).toMatchObject({
      ok: true,
      affectedEntityIds: ["project-item_generated", "placement_generated"],
    });
  });

  it("rejects placing a selection-only product without mutating state", () => {
    const project = createDefaultProject();
    const placed = applyProjectCommand(
      project,
      {
        type: "PRODUCT_PLACED",
        payload: {
          productId: "product_bands",
          position: { xCm: 0, zCm: 0 },
          rotation: 0,
        },
      },
      dependencies(),
    );
    expect(placed.result).toMatchObject({
      ok: false,
      error: {
        code: "INVALID_COMMAND",
        message: "This product cannot be placed on the floor.",
      },
    });
    expect(placed.project).toBe(project);

    const added = applyProjectCommand(
      project,
      { type: "PROJECT_ITEM_ADDED", payload: { productId: "product_bands" } },
      dependencies(),
    );
    expect(added.result.ok).toBe(true);
    if (!added.result.ok) throw new Error("Expected add to succeed.");
    const itemPlaced = applyProjectCommand(
      added.project,
      {
        type: "PROJECT_ITEM_PLACED",
        payload: {
          projectItemId: "project-item_generated",
          position: { xCm: 0, zCm: 0 },
          rotation: 0,
        },
      },
      dependencies(),
    );
    expect(itemPlaced.result).toMatchObject({
      ok: false,
      error: { code: "INVALID_COMMAND" },
    });
    expect(itemPlaced.project).toBe(added.project);
  });

  it("configures a room and applies spatially invalid shrinkage with issues", () => {
    const project = withObstacle();
    const execution = applyProjectCommand(project, {
      type: "ROOM_CONFIGURED",
      payload: { widthCm: 100, depthCm: 100, heightCm: 200 },
    });

    expect(execution.result.ok).toBe(true);
    if (!execution.result.ok) throw new Error("Expected success.");
    expect(execution.result.changed).toBe(true);
    expect(execution.result.issues.some(({ code }) => code === "OUTSIDE_ROOM")).toBe(true);
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

    expect(execution.result.ok).toBe(true);
    if (!execution.result.ok) throw new Error("Expected success.");
    expect(execution.result.changed).toBe(true);
    expect(execution.result.affectedEntityIds).toEqual(["obstacle_generated"]);
    expect(execution.result.issues.some(({ code }) => code === "PHYSICAL_COLLISION")).toBe(true);
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
    const untouched: PhysicalObstacle = {
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

  it("rejects dimension patches that do not match the target obstacle kind", () => {
    const physicalProject = withObstacle();
    const physicalExecution = applyProjectCommand(physicalProject, {
      type: "OBSTACLE_UPDATED",
      payload: {
        obstacleId: "obstacle_existing",
        patch: { dimensions: { widthCm: 100, depthCm: 80 } },
      },
    });
    expect(physicalExecution.result).toMatchObject({
      ok: false,
      error: {
        code: "INVALID_COMMAND",
        message: "Obstacle dimensions do not match the target obstacle kind.",
      },
    });
    expect(physicalExecution.project).toBe(physicalProject);

    const zoneProject: GymProject = {
      ...createDefaultProject(),
      obstacles: [{
        id: "obstacle_zone",
        kind: "unavailable-zone",
        name: "Access zone",
        position: { xCm: 0, zCm: 0 },
        dimensions: { widthCm: 100, depthCm: 80 },
        rotation: 0,
        locked: false,
      }],
    };
    const zoneExecution = applyProjectCommand(zoneProject, {
      type: "OBSTACLE_UPDATED",
      payload: {
        obstacleId: "obstacle_zone",
        patch: { dimensions: { widthCm: 100, depthCm: 80, heightCm: 200 } },
      },
    });
    expect(zoneExecution.result).toMatchObject({
      ok: false,
      error: { code: "INVALID_COMMAND" },
    });
    expect(zoneExecution.project).toBe(zoneProject);
  });

  it("adds, updates, and removes wall elements with generated IDs", () => {
    const project = createDefaultProject();
    const added = applyProjectCommand(
      project,
      {
        type: "WALL_ELEMENT_ADDED",
        payload: {
          kind: "door",
          name: "Door",
          wall: "top",
          offsetCm: 20,
          widthCm: 90,
        },
      },
      dependencies(),
    );
    expect(added.result).toMatchObject({
      ok: true,
      changed: true,
      affectedEntityIds: ["wall-element_generated"],
    });
    expect(added.project.wallElements[0]).toMatchObject({
      id: "wall-element_generated",
      kind: "door",
    });

    const updated = applyProjectCommand(added.project, {
      type: "WALL_ELEMENT_UPDATED",
      payload: {
        wallElementId: "wall-element_generated",
        patch: { wall: "left", offsetCm: 30 },
      },
    });
    expect(updated.project.wallElements[0]).toMatchObject({
      wall: "left",
      offsetCm: 30,
    });

    const removed = applyProjectCommand(updated.project, {
      type: "WALL_ELEMENT_REMOVED",
      payload: { wallElementId: "wall-element_generated" },
    });
    expect(removed.result).toMatchObject({ ok: true, changed: true });
    expect(removed.project.wallElements).toEqual([]);
  });

  it("reports wall-element no-ops, ID conflicts, and missing entities", () => {
    const project = {
      ...createDefaultProject(),
      wallElements: [
        {
          id: "wall-element_existing",
          kind: "window" as const,
          name: "Window",
          wall: "right" as const,
          offsetCm: 40,
          widthCm: 100,
        },
      ],
    };
    const noOp = applyProjectCommand(project, {
      type: "WALL_ELEMENT_UPDATED",
      payload: {
        wallElementId: "wall-element_existing",
        patch: { widthCm: 100 },
      },
    });
    expect(noOp.result).toMatchObject({ ok: true, changed: false });
    expect(noOp.project).toBe(project);

    const conflict = applyProjectCommand(
      project,
      {
        type: "WALL_ELEMENT_ADDED",
        payload: {
          kind: "door",
          name: "Door",
          wall: "top",
          offsetCm: 0,
          widthCm: 90,
        },
      },
      {
        generateObstacleId: () => "obstacle_unused",
        generateWallElementId: () => "wall-element_existing",
      },
    );
    expect(conflict.result).toMatchObject({
      ok: false,
      error: { code: "ID_CONFLICT" },
    });

    const missing = applyProjectCommand(project, {
      type: "WALL_ELEMENT_REMOVED",
      payload: { wallElementId: "wall-element_missing" },
    });
    expect(missing.result).toMatchObject({
      ok: false,
      error: { code: "ENTITY_NOT_FOUND" },
    });
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
        type: "OBSTACLE_UPDATED",
        payload: {
          obstacleId: "obstacle_existing",
          patch: { dimensions: { widthCm: 100, depthCm: 80 } },
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
