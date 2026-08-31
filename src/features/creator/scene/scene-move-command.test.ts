import { describe, expect, it } from "vitest";
import { findProductById } from "@/features/catalog/queries/catalog";
import { snapWallMountedPlacement } from "@/features/geometry/wall-mounting";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject, Wall } from "@/features/project/schemas/project";
import { createSceneMoveCommand } from "./scene-move-command";

function obstacleProject(): GymProject {
  return { ...createDefaultProject(), obstacles: [{ id: "obstacle_test", kind: "obstacle", name: "Test",
    position: { xCm: 53, zCm: 27 }, dimensions: { widthCm: 30, depthCm: 20, heightCm: 100 }, rotation: 90, locked: false }] };
}
const start = { xCm: 68, zCm: 41 };

describe("scene move commands", () => {
  it.each(["obstacle", "unavailable-zone"] as const)("preserves grab offset and rotation for %s", (kind) => {
    const project = obstacleProject();
    if (kind === "unavailable-zone") project.obstacles[0] = { ...project.obstacles[0], kind, dimensions: { widthCm: 30, depthCm: 20 } };
    expect(createSceneMoveCommand(project, "obstacle_test", start, { xCm: 91, zCm: 76 }))
      .toEqual({ ok: true, command: { type: "OBSTACLE_UPDATED", payload: { obstacleId: "obstacle_test", patch: { position: { xCm: 73, zCm: 67 } } } } });
    expect(project.obstacles[0].position).toEqual({ xCm: 53, zCm: 27 });
  });
  it("suppresses no-op, rejects locks and unknown IDs, and keeps existing floor-edge semantics", () => {
    const project = obstacleProject();
    expect(createSceneMoveCommand(project, "obstacle_test", start, { xCm: 70, zCm: 42 })).toEqual({ ok: true, command: null });
    expect(createSceneMoveCommand(project, "obstacle_test", start, { xCm: -100, zCm: -100 }))
      .toMatchObject({ ok: true, command: { payload: { patch: { position: { xCm: 0, zCm: 0 } } } } });
    expect(createSceneMoveCommand(project, "missing", start, start).ok).toBe(false);
    expect(createSceneMoveCommand(project, "obstacle_test", start, { xCm: NaN, zCm: 5 }).ok).toBe(false);
    project.obstacles[0].locked = true;
    expect(createSceneMoveCommand(project, "obstacle_test", start, { xCm: 150, zCm: 150 }).ok).toBe(false);
  });
  it.each(["top", "right", "bottom", "left"] as Wall[])("moves openings only along their %s wall", (wall) => {
    const project = createDefaultProject();
    project.wallElements = [{ id: "wall-element_test", kind: "door", name: "Door", wall, offsetCm: 53, widthCm: 90 }];
    const result = createSceneMoveCommand(project, "wall-element_test", start, { xCm: start.xCm + 25, zCm: start.zCm + 64 });
    expect(result).toEqual({ ok: true, command: { type: "WALL_ELEMENT_UPDATED", payload: { wallElementId: "wall-element_test", patch: { offsetCm: wall === "top" || wall === "bottom" ? 83 : 113 } } } });
    const maximum = (wall === "top" || wall === "bottom" ? project.room.widthCm : project.room.depthCm) - 90;
    expect(createSceneMoveCommand(project, "wall-element_test", start, { xCm: 5000, zCm: 5000 }))
      .toMatchObject({ command: { payload: { patch: { offsetCm: maximum } } } });
    expect(createSceneMoveCommand(project, "wall-element_test", start, start)).toEqual({ ok: true, command: null });
  });
  it.each([
    [0, { xCm: 150, zCm: 0 }], [90, { xCm: 400, zCm: 150 }],
    [180, { xCm: 150, zCm: 320 }], [270, { xCm: 0, zCm: 150 }],
  ] as const)("projects mounted drag onto rotation %s's wall before flush checking", (rotation, pointer) => {
    const project = createDefaultProject();
    const product = findProductById("product_anchor_pullup_bar")!;
    const pose = snapWallMountedPlacement(pointer, product.dimensions, project.room)!;
    expect(pose.rotation).toBe(rotation);
    project.projectItems = [{ id: "project-item_test", productId: product.id }];
    project.placements = [{ locked: false, id: "placement_test", projectItemId: "project-item_test", ...pose }];
    const result = createSceneMoveCommand(project, "placement_test", start, { xCm: start.xCm + 20, zCm: start.zCm + 30 });
    expect(result).toMatchObject({ ok: true, command: { type: "PLACEMENT_UPDATED" } });
    if (!result.ok || result.command?.type !== "PLACEMENT_UPDATED") throw new Error("Missing move");
    const position = result.command.payload.patch.position!;
    if (rotation === 0 || rotation === 180) {
      expect(position).toEqual({ xCm: pose.position.xCm + 20, zCm: pose.position.zCm });
    } else {
      expect(position).toEqual({ xCm: pose.position.xCm, zCm: pose.position.zCm + 30 });
    }
    expect(result.command.payload.patch).not.toHaveProperty("rotation");
  });
  it("moves free-standing equipment and rejects a missing catalog relationship", () => {
    const project = createDefaultProject();
    project.projectItems = [{ id: "project-item_test", productId: "product_forge_kettlebell_16kg" }];
    project.placements = [{ locked: false, id: "placement_test", projectItemId: "project-item_test", position: { xCm: 30, zCm: 40 }, rotation: 270 }];
    expect(createSceneMoveCommand(project, "placement_test", start, { xCm: 88, zCm: 71 }))
      .toMatchObject({ ok: true, command: { payload: { patch: { position: { xCm: 50, zCm: 70 } } } } });
    project.placements[0].locked = true;
    expect(createSceneMoveCommand(project, "placement_test", start, { xCm: 88, zCm: 71 }))
      .toMatchObject({ ok: false, error: expect.stringContaining("locked") });
    project.placements[0].locked = false;
    project.projectItems = [];
    expect(createSceneMoveCommand(project, "placement_test", start, start).ok).toBe(false);
  });
});
