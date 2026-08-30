import { describe, expect, it } from "vitest";
import { createDefaultProject } from "@/features/project/defaults";
import { projectCommandSchema } from "@/features/project/schemas/project-command";
import { createRoomElementCommand } from "./create-room-element-command";

describe("shared room-element creation", () => {
  const project = createDefaultProject();
  it.each(["obstacle", "unavailable-zone"] as const)("centers and validates the unchanged %s defaults", (kind) => {
    const result = createRoomElementCommand(kind, { kind: "floor", position: { xCm: 200, zCm: 160 } }, project);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(projectCommandSchema.safeParse(result.command).success).toBe(true);
    expect(result.command).toMatchObject({ type: "OBSTACLE_ADDED", payload: { kind, locked: false, rotation: 0,
      position: { xCm: 150, zCm: kind === "obstacle" ? 140 : 110 } } });
  });
  it.each(["door", "window"] as const)("centers %s on every wall", (kind) => {
    for (const wall of ["top", "right", "bottom", "left"] as const) {
      const result = createRoomElementCommand(kind, { kind: "wall", wall, offsetCm: 160 }, project);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(projectCommandSchema.safeParse(result.command).success).toBe(true);
      expect(result.command).toMatchObject({ type: "WALL_ELEMENT_ADDED", payload: { kind, wall, widthCm: kind === "door" ? 90 : 120 } });
    }
  });
  it("rejects wrong target kinds and oversized defaults", () => {
    const floor = { kind: "floor", position: { xCm: 20, zCm: 20 } } as const;
    const wall = { kind: "wall", wall: "top", offsetCm: 20 } as const;
    expect(createRoomElementCommand("door", floor, project).ok).toBe(false);
    expect(createRoomElementCommand("obstacle", wall, project).ok).toBe(false);
    const tiny = { ...project, room: { widthCm: 50, depthCm: 40, heightCm: 240 } };
    expect(createRoomElementCommand("window", wall, tiny).ok).toBe(false);
    expect(createRoomElementCommand("unavailable-zone", floor, tiny).ok).toBe(false);
  });
  it("clamps odd-sized edge targets without overflowing", () => {
    const odd = { ...project, room: { ...project.room, widthCm: 307 } };
    expect(createRoomElementCommand("door", { kind: "wall", wall: "top", offsetCm: 307 }, odd))
      .toMatchObject({ command: { payload: { offsetCm: 217 } } });
    expect(createRoomElementCommand("obstacle", { kind: "floor", position: { xCm: 307, zCm: 320 } }, odd))
      .toMatchObject({ command: { payload: { position: { xCm: 207, zCm: 270 } } } });
  });
});
