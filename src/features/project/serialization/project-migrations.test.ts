import { describe, expect, it } from "vitest";

import { findProjectProductById } from "@/features/catalog/queries/project-products";
import { createDefaultProject } from "../defaults";
import { decodeProject } from "./project-codec";
import v3FourProductRoom from "./fixtures/v3-four-product-room.json";
import { projectItemIdFromPlacementId } from "./project-item-ids";
import {
  CURRENT_PROJECT_VERSION,
  migrateProjectToCurrent,
  SUPPORTED_PROJECT_VERSIONS,
} from "./project-migrations";

function catalogPrice(productId: string): number {
  const product = findProjectProductById(productId);
  if (!product) throw new Error(`Missing catalog product ${productId}.`);
  return product.price;
}

describe("project migrations", () => {
  it("declares version 4 as current and supports the full migration chain", () => {
    expect(CURRENT_PROJECT_VERSION).toBe(4);
    expect(SUPPORTED_PROJECT_VERSIONS).toEqual([1, 2, 3, 4]);
  });

  it("passes the current version through without changing its reference", () => {
    const project = createDefaultProject();

    expect(migrateProjectToCurrent(project, 4)).toEqual({
      success: true,
      data: project,
    });
  });

  it("migrates v1 obstacles without inferring wall elements or items", () => {
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
        version: 4,
        obstacles: [
          legacyProject.obstacles[0],
          {
            ...legacyProject.obstacles[1],
            dimensions: { widthCm: 90, depthCm: 90 },
          },
        ],
        wallElements: [],
        projectItems: [],
        placements: [],
      },
    });
  });

  it("migrates version 2 by adding empty placements and items", () => {
    const current = createDefaultProject();
    const { placements: _placements, projectItems: _items, ...legacyProject } = {
      ...current,
      version: 2 as const,
    };

    expect(migrateProjectToCurrent(legacyProject, 2)).toEqual({
      success: true,
      data: current,
    });
  });

  it("migrates the representative four-product v3 room without data or cost loss", () => {
    const decoded = decodeProject(v3FourProductRoom);
    expect(decoded.success).toBe(true);
    if (!decoded.success) throw new Error("Expected the fixture to migrate.");

    const v3Cost = v3FourProductRoom.placements.reduce(
      (sum, placement) => sum + catalogPrice(placement.productId),
      0,
    );
    const v4Cost = decoded.project.projectItems.reduce(
      (sum, item) => sum + catalogPrice(item.productId),
      0,
    );

    expect(decoded.project.version).toBe(4);
    expect(decoded.project.projectItems).toHaveLength(4);
    expect(decoded.project.placements).toHaveLength(4);
    expect(decoded.project.room).toEqual(v3FourProductRoom.room);
    expect(decoded.project.obstacles).toEqual(v3FourProductRoom.obstacles);
    expect(decoded.project.wallElements).toEqual(v3FourProductRoom.wallElements);
    expect(decoded.project.budget).toBe(v3FourProductRoom.budget);
    expect(decoded.project.trainingGoals).toEqual(v3FourProductRoom.trainingGoals);
    expect(v4Cost).toBe(v3Cost);
    expect(v4Cost).toBe(8596);

    for (const placement of v3FourProductRoom.placements) {
      const itemId = projectItemIdFromPlacementId(placement.id);
      expect(decoded.project.projectItems).toContainEqual({
        id: itemId,
        productId: placement.productId,
      });
      expect(decoded.project.placements).toContainEqual({
        id: placement.id,
        projectItemId: itemId,
        position: placement.position,
        rotation: placement.rotation,
      });
    }
  });

  it("fails migration when derived item IDs collide", () => {
    expect(
      migrateProjectToCurrent(
        {
          version: 3,
          placements: [
            { id: "not-a-placement", productId: "product_northstar_half_rack" },
          ],
        },
        3,
      ),
    ).toEqual({
      success: false,
      error: {
        code: "migration-failed",
        message: "The saved project could not be migrated from version 3.",
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
