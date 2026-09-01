import { describe, expect, it } from "vitest";
import { catalogProducts } from "@/data/products";
import { createEquipmentFootprints } from "@/features/geometry/equipment-footprints";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";
import { createRoomElementCommand } from "../plan/create-room-element-command";
import { createPlaceProductCommand, createPlaceProjectItemCommand } from "../plan/place-equipment";
import { createProjectStore } from "../store/project-store";
import { sceneCommandGhost, sceneWallTargetBoxes } from "./scene-ghost";
import { createSceneMoveCommand } from "./scene-move-command";
import { equipmentBoxToScene, obstacleToScene, scenePointToPosition } from "./scene-transform";

describe("command-aligned scene ghosts", () => {
  it("highlights wall surfaces instead of drawing placement strips on the floor perimeter", () => {
    const project = createDefaultProject();
    const targets = sceneWallTargetBoxes(project);
    expect(targets.map((target) => target.wall)).toEqual(["top", "right", "bottom", "left"]);
    for (const target of targets) {
      expect(target.position[1]).toBe(project.room.heightCm / 200);
      expect(target.dimensions[1]).toBe(project.room.heightCm / 100);
    }
  });

  it.each(["obstacle", "unavailable-zone"] as const)("previews the real %s dimensions and centred target without mutating", (tool) => {
    const project = createDefaultProject();
    const result = createRoomElementCommand(tool, { kind: "floor", position: { xCm: 180, zCm: 160 } }, project);
    if (!result.ok) throw new Error(result.error);
    const before = JSON.stringify(project);
    const boxes = sceneCommandGhost(result.command, project);
    expect(JSON.stringify(project)).toBe(before);
    expect(boxes).toHaveLength(1);
    const store = createProjectStore(project);
    expect(store.getState().dispatch(result.command).ok).toBe(true);
    expect(boxes[0]).toEqual(obstacleToScene(store.getState().project.obstacles[0], project.room));
    expect(boxes[0].dimensions).toEqual(tool === "obstacle" ? { x: 1, y: 2, z: 0.5 } : { x: 1, y: 0.012, z: 1 });
  });

  it.each((["top", "right", "bottom", "left"] as const).flatMap((wall) =>
    (["door", "window"] as const).map((tool) => ({ wall, tool }))))(
    "previews the exact $tool span on $wall with both edge and full-height guides", ({ wall, tool }) => {
      const project = createDefaultProject();
      const result = createRoomElementCommand(tool, { kind: "wall", wall, offsetCm: 180 }, project);
      if (!result.ok || result.command.type !== "WALL_ELEMENT_ADDED") throw new Error("Expected a wall creation command.");
      const boxes = sceneCommandGhost(result.command, project);
      expect(boxes).toHaveLength(2);
      const [edge, outline] = boxes;
      const horizontal = wall === "top" || wall === "bottom";
      const width = result.command.payload.widthCm;
      expect(edge.dimensions).toEqual({ x: horizontal ? width / 100 : 0.08, y: 0.04, z: horizontal ? 0.08 : width / 100 });
      expect(outline.dimensions.y).toBe(project.room.heightCm / 100);
      expect(edge.position.y).toBe(0.04);
      const center = scenePointToPosition(edge.position, project.room);
      expect(horizontal ? center.xCm : center.zCm).toBe(result.command.payload.offsetCm + width / 2);
      expect(horizontal ? center.zCm : center.xCm).toBe(wall === "bottom" ? project.room.depthCm : wall === "right" ? project.room.widthCm : 0);
    },
  );

  it.each(catalogProducts.filter((product) => product.placementMode !== "selection-only").map((product) => product.id))(
    "uses product/domain envelopes and use zones for %s", (productId) => {
      const project = { ...createDefaultProject(), room: { widthCm: 1500, depthCm: 1200, heightCm: 400 } };
      const result = createPlaceProductCommand(productId, { kind: "floor", position: { xCm: 400, zCm: 200 } }, project);
      if (!result.ok || result.command.type !== "PRODUCT_PLACED") throw new Error("Expected product creation.");
      const store = createProjectStore(project);
      const ghost = sceneCommandGhost(result.command, project);
      expect(store.getState().revision).toBe(0);
      expect(ghost).toHaveLength(2);
      const product = catalogProducts.find((candidate) => candidate.id === productId)!;
      const mountingHeight = product.mounting?.kind === "wall" ? product.mounting.bottomHeightCm : 0;
      expect(ghost[0]).toEqual(equipmentBoxToScene(result.command.payload, product.dimensions, project.room, mountingHeight));
      const { useZone } = createEquipmentFootprints(result.command.payload, product);
      expect(ghost[1].dimensions.x).toBeCloseTo(useZone.widthCm / 100);
      expect(ghost[1].dimensions.y).toBe(0.012);
      expect(ghost[1].dimensions.z).toBeCloseTo(useZone.depthCm / 100);
      const zoneCenter = scenePointToPosition(ghost[1].position, project.room);
      expect(zoneCenter.xCm).toBeCloseTo(useZone.minX + useZone.widthCm / 2);
      expect(zoneCenter.zCm).toBeCloseTo(useZone.minZ + useZone.depthCm / 2);
      expect(ghost[1].position.y).toBeCloseTo(0.006);
      expect(store.getState().dispatch(result.command).ok).toBe(true);
      expect(ghost[0]).toEqual(equipmentBoxToScene(store.getState().project.placements[0], product.dimensions, project.room, mountingHeight));
    },
  );

  it("resolves an existing unplaced item without requiring a new item or duplicate project", () => {
    const productId = "product_northstar_half_rack";
    const project = { ...createDefaultProject(), projectItems: [{ id: "project-item_existing", productId }] };
    const target = { kind: "floor", position: { xCm: 200, zCm: 160 } } as const;
    const existing = createPlaceProjectItemCommand("project-item_existing", productId, target, project);
    const fresh = createPlaceProductCommand(productId, target, project);
    if (!existing.ok || !fresh.ok) throw new Error("Expected both placement commands.");
    expect(sceneCommandGhost(existing.command, project)).toEqual(sceneCommandGhost(fresh.command, project));
    expect(project.projectItems).toHaveLength(1);
    expect(project.placements).toEqual([]);
  });

  it("previews floor and wall moves using committed geometry plus the candidate command", () => {
    const project: GymProject = { ...createDefaultProject(),
      obstacles: [{ id: "obstacle_box", name: "Box", kind: "obstacle", locked: false, rotation: 90,
        position: { xCm: 50, zCm: 40 }, dimensions: { widthCm: 80, depthCm: 40, heightCm: 100 } }],
      wallElements: [{ id: "wall-element_door", name: "Door", kind: "door", wall: "left", offsetCm: 20, widthCm: 90 }],
    };
    for (const entityId of ["obstacle_box", "wall-element_door"]) {
      const result = createSceneMoveCommand(project, entityId, { xCm: 100, zCm: 100 }, { xCm: 143, zCm: 158 });
      if (!result.ok || !result.command) throw new Error("Expected a movement command.");
      const before = JSON.stringify(project);
      const ghost = sceneCommandGhost(result.command, project);
      expect(JSON.stringify(project)).toBe(before);
      const store = createProjectStore(project);
      expect(store.getState().dispatch(result.command).ok).toBe(true);
      if (entityId === "obstacle_box") expect(ghost[0]).toEqual(obstacleToScene(store.getState().project.obstacles[0], project.room));
      else expect(scenePointToPosition(ghost[0].position, project.room).zCm).toBe(125);
    }
  });

  it.each([0, 90, 180, 270] as const)("previews moved/rotated equipment and its asymmetric use zone (%s°)", (rotation) => {
    const product = catalogProducts.find((product) => product.id === "product_northstar_half_rack")!;
    const project: GymProject = { ...createDefaultProject(), projectItems: [{ id: "project-item_existing", productId: product.id }],
      placements: [{ locked: false, id: "placement_existing", projectItemId: "project-item_existing", position: { xCm: 20, zCm: 30 }, rotation: 0 }],
    };
    const command = { type: "PLACEMENT_UPDATED", payload: { placementId: "placement_existing", patch: { position: { xCm: 100, zCm: 80 }, rotation } } } as const;
    const ghosts = sceneCommandGhost(command, project);
    expect(ghosts[0]).toEqual(equipmentBoxToScene(command.payload.patch, product.dimensions, project.room));
    const { useZone } = createEquipmentFootprints(command.payload.patch, product);
    expect(ghosts[1].dimensions.x).toBeCloseTo(useZone.widthCm / 100);
    expect(ghosts[1].dimensions.z).toBeCloseTo(useZone.depthCm / 100);
    expect(project.placements[0].rotation).toBe(0);
    expect(project.placements[0].position).toEqual({ xCm: 20, zCm: 30 });
  });

  it("returns no ghost for removed entities, unavailable products, or unrelated commands", () => {
    const project = createDefaultProject();
    expect(sceneCommandGhost({ type: "PLACEMENT_UPDATED", payload: { placementId: "placement_missing", patch: { position: { xCm: 20, zCm: 20 } } } }, project)).toEqual([]);
    expect(sceneCommandGhost({ type: "OBSTACLE_UPDATED", payload: { obstacleId: "obstacle_missing", patch: { position: { xCm: 20, zCm: 20 } } } }, project)).toEqual([]);
    expect(sceneCommandGhost({ type: "WALL_ELEMENT_UPDATED", payload: { wallElementId: "wall-element_missing", patch: { offsetCm: 20 } } }, project)).toEqual([]);
    expect(sceneCommandGhost({ type: "PRODUCT_PLACED", payload: { productId: "product_missing", position: { xCm: 20, zCm: 20 }, rotation: 0 } }, project)).toEqual([]);
    expect(sceneCommandGhost({ type: "PROJECT_SETTINGS_UPDATED", payload: { budget: 1000 } }, project)).toEqual([]);
  });
});
