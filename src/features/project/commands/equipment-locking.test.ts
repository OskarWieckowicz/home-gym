import { describe, expect, it } from "vitest";

import { createDefaultProject } from "../defaults";
import { gymProjectSchema } from "../schemas/project";
import { applyProjectCommand } from "./apply-project-command";
import { applyProjectCommands } from "./apply-project-commands";
import { previewProjectCommands } from "./preview-project-commands";

const placementId = "placement_rack";
const projectItemId = "project-item_rack";
const patchCommand = (patch: object) => ({ type: "PLACEMENT_UPDATED", payload: { placementId, patch } });

function projectWithEquipment(locked = false) {
  return gymProjectSchema.parse({
    ...createDefaultProject(),
    projectItems: [{ id: projectItemId, productId: "product_northstar_half_rack" }],
    placements: [{ id: placementId, projectItemId, position: { xCm: 100, zCm: 100 }, rotation: 0, locked }],
  });
}

describe("equipment placement locking", () => {
  it("locks an existing placement, explicitly unlocks it, and recognizes unlocked no-ops", () => {
    const original = projectWithEquipment();
    const locked = applyProjectCommand(original, patchCommand({ locked: true }));
    expect(locked.result).toMatchObject({ ok: true, changed: true });
    expect(locked.project.placements[0].locked).toBe(true);
    expect(original.placements[0].locked).toBe(false);
    const unlocked = applyProjectCommand(locked.project, patchCommand({ locked: false }));
    expect(unlocked.result).toMatchObject({ ok: true, changed: true });
    const noOp = applyProjectCommand(unlocked.project, patchCommand({ locked: false }));
    expect(noOp.project).toBe(unlocked.project);
    expect(noOp.result).toMatchObject({ ok: true, changed: false });
    expect(applyProjectCommand(unlocked.project, patchCommand({ rotation: 90 })).result.ok).toBe(true);
  });

  it.each([
    patchCommand({ position: { xCm: 200, zCm: 100 } }),
    patchCommand({ rotation: 90 }),
    patchCommand({ rotation: 0 }),
    patchCommand({ locked: true }),
    patchCommand({ locked: false, rotation: 90 }),
    patchCommand({ locked: false, position: { xCm: 200, zCm: 100 } }),
    { type: "PLACEMENT_REMOVED", payload: { placementId } },
    { type: "PROJECT_ITEM_REMOVED", payload: { projectItemId } },
  ])("rejects a locked mutation without changing the project %#", (command) => {
    const project = projectWithEquipment(true);
    const execution = applyProjectCommand(project, command);
    expect(execution.project).toBe(project);
    expect(execution.result).toMatchObject({
      ok: false, error: { code: "ENTITY_LOCKED", message: expect.stringContaining("equipment") },
    });
  });

  it.each([applyProjectCommands, previewProjectCommands])("rolls back a batch on a locked mutation %#", (execute) => {
    const project = projectWithEquipment(true);
    const execution = execute(project, [
      { type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 12345 } },
      patchCommand({ rotation: 90 }),
    ]);
    expect(execution.project).toBe(project);
    expect(execution.result).toMatchObject({ ok: false, error: { code: "ENTITY_LOCKED", index: 1 } });
  });

  it.each([applyProjectCommands, previewProjectCommands])("allows an explicit unlock then move in a batch %#", (execute) => {
    const project = projectWithEquipment(true);
    const execution = execute(project, [patchCommand({ locked: false }), patchCommand({ rotation: 90 })]);
    expect(execution.result).toMatchObject({ ok: true, changed: true });
    expect(execution.project.placements[0]).toMatchObject({ locked: false, rotation: 90 });
    expect(project.placements[0]).toMatchObject({ locked: true, rotation: 0 });
  });

  it("preserves no-change identity when a batch locks and then unlocks", () => {
    const project = projectWithEquipment();
    const execution = applyProjectCommands(project, [patchCommand({ locked: true }), patchCommand({ locked: false })]);
    expect(execution.project).toBe(project);
    expect(execution.result).toMatchObject({ ok: true, changed: false });
  });
});
