import { describe, expect, it, vi } from "vitest";

import { createDefaultProject } from "../defaults";
import { analyzeProject, createProjectAnalysis } from "../validation/analyze-project";
import { EMPTY_ACCESS_IMPACT } from "../validation/access-impact";
import { applyProjectCommands, MAX_PROJECT_COMMANDS } from "./apply-project-commands";
import { previewProjectCommands } from "./preview-project-commands";

const obstacle = {
  kind: "obstacle",
  name: "Storage",
  position: { xCm: 20, zCm: 20 },
  dimensions: { widthCm: 40, depthCm: 40, heightCm: 100 },
  rotation: 0,
  locked: false,
} as const;

describe("applyProjectCommands", () => {
  it("folds dependent commands and merges IDs in first-affected order", () => {
    const project = createDefaultProject();
    let index = 0;
    const execution = applyProjectCommands(project, [
      { type: "OBSTACLE_ADDED", payload: obstacle },
      { type: "OBSTACLE_ADDED", payload: { ...obstacle, position: { xCm: 100, zCm: 100 } } },
      {
        type: "OBSTACLE_UPDATED",
        payload: { obstacleId: "obstacle_1", patch: { name: "Renamed" } },
      },
    ], { generateObstacleId: () => `obstacle_${++index}` });

    expect(execution.result).toMatchObject({
      ok: true,
      commandType: "LAYOUT_CHANGES_APPLIED",
      changed: true,
      affectedEntityIds: ["obstacle_1", "obstacle_2"],
      analysis: analyzeProject(execution.project),
      outcomes: [
        { index: 0, commandType: "OBSTACLE_ADDED", changed: true },
        { index: 1, commandType: "OBSTACLE_ADDED", changed: true },
        { index: 2, commandType: "OBSTACLE_UPDATED", changed: true },
      ],
    });
    expect(execution.project.obstacles[0].name).toBe("Renamed");
    expect(project.obstacles).toEqual([]);
  });

  it("returns the original project and failing index when the third command fails", () => {
    const project = createDefaultProject();
    const execution = applyProjectCommands(project, [
      { type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 12_000 } },
      { type: "OBSTACLE_ADDED", payload: obstacle },
      { type: "OBSTACLE_REMOVED", payload: { obstacleId: "obstacle_missing" } },
    ], { generateObstacleId: () => "obstacle_new" });

    expect(execution.project).toBe(project);
    expect(execution.result).toEqual({
      ok: false,
      commandType: "OBSTACLE_REMOVED",
      error: {
        index: 2,
        commandType: "OBSTACLE_REMOVED",
        code: "ENTITY_NOT_FOUND",
        message: "The requested entity does not exist.",
      },
    });
  });

  it.each([null, {}, [], Array(MAX_PROJECT_COMMANDS + 1).fill({})])(
    "rejects invalid list bounds before executing any commands %#",
    (commands) => {
      const analyze = vi.fn(analyzeProject);
      const project = createDefaultProject();
      const execution = applyProjectCommands(project, commands, { analyzeProject: analyze });
      expect(execution.project).toBe(project);
      expect(execution.result).toMatchObject({
        ok: false,
        error: { index: null, commandType: null, code: "INVALID_COMMAND" },
      });
      expect(analyze).not.toHaveBeenCalled();
    },
  );

  it("accepts the maximum list length and reports malformed commands by index", () => {
    const command = { type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 12_000 } };
    const project = createDefaultProject();
    expect(applyProjectCommands(project, Array(MAX_PROJECT_COMMANDS).fill(command)).result.ok)
      .toBe(true);
    expect(applyProjectCommands(project, [command, { type: "UNKNOWN" }]).result)
      .toMatchObject({ ok: false, error: { index: 1, commandType: null, code: "INVALID_COMMAND" } });
  });

  it("recognizes net no-change and restores the original reference", () => {
    const project = createDefaultProject();
    const execution = applyProjectCommands(project, [
      { type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 12_000 } },
      { type: "PROJECT_SETTINGS_UPDATED", payload: { budget: project.budget } },
    ]);
    expect(execution.project).toBe(project);
    expect(execution.result).toMatchObject({
      ok: true, changed: false, accessImpact: EMPTY_ACCESS_IMPACT,
      outcomes: [{ changed: true }, { changed: true }],
    });
  });

  it("computes access impact from initial to final state, ignoring intermediate obstruction", () => {
    const project = createDefaultProject();
    const analyze = (input: typeof project) => createProjectAnalysis(
      input.budget === 12_000 ? [{
        code: "OBSTACLE_UNREACHABLE", severity: "warning", entityIds: ["obstacle_x"],
        details: {},
      }] : [],
      { ...analyzeProject(input).access, evaluated: true },
    );
    const execution = applyProjectCommands(project, [
      { type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 12_000 } },
      { type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 13_000 } },
    ], { analyzeProject: analyze });
    expect(execution.result).toMatchObject({ ok: true, issues: [], accessImpact: EMPTY_ACCESS_IMPACT });
  });

  it("returns spatially invalid final layouts for callers to evaluate", () => {
    const execution = applyProjectCommands(createDefaultProject(), [{
      type: "OBSTACLE_ADDED",
      payload: { ...obstacle, position: { xCm: 900, zCm: 900 } },
    }], { generateObstacleId: () => "obstacle_outside" });
    expect(execution.result).toMatchObject({ ok: true, analysis: { valid: false } });
  });

  it("redacts analysis failures and returns the original project", () => {
    const project = createDefaultProject();
    const analyze = vi.fn(analyzeProject)
      .mockImplementationOnce(analyzeProject)
      .mockImplementationOnce(analyzeProject)
      .mockImplementationOnce(() => { throw new Error("secret"); });
    const execution = applyProjectCommands(project, [{
      type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 12_000 },
    }], { analyzeProject: analyze });
    expect(execution.project).toBe(project);
    expect(execution.result).toMatchObject({ ok: false, error: { code: "EXECUTION_FAILED", index: null } });
    expect(JSON.stringify(execution)).not.toContain("secret");
  });
});

describe("previewProjectCommands", () => {
  it("uses deterministic collision-free IDs without calling injected generators", () => {
    const project = {
      ...createDefaultProject(),
      obstacles: [{ id: "obstacle_preview_1", ...obstacle }],
    };
    const generateObstacleId = vi.fn(() => "real_obstacle");
    const commands = [{ type: "OBSTACLE_ADDED", payload: obstacle }];
    const preview = previewProjectCommands(project, commands, { generateObstacleId });
    expect(preview).toEqual(previewProjectCommands(project, commands, { generateObstacleId }));
    expect(preview.project.obstacles[1].id).toBe("obstacle_preview_2");
    expect(generateObstacleId).not.toHaveBeenCalled();
  });
});
