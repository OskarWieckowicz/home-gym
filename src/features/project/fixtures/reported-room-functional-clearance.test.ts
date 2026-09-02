import { describe, expect, it } from "vitest";

import { findProjectProductById } from "@/features/catalog/queries/project-products";

import { serializeProject, decodeProjectJson } from "../serialization/project-codec";
import { validateProject } from "../validation/validate-project";
import { REPORTED_ROOM_FUNCTIONAL_CLEARANCE } from "./reported-room-functional-clearance";

describe("reported room functional-clearance fixture", () => {
  it("keeps reviewable wardrobe and desk/chair measurements through JSON", () => {
    const serialized = serializeProject(REPORTED_ROOM_FUNCTIONAL_CLEARANCE);
    expect(serialized.success).toBe(true);
    if (!serialized.success) return;

    const decoded = decodeProjectJson(serialized.json);
    expect(decoded.success).toBe(true);
    if (!decoded.success) return;
    expect(decoded.project.obstacles).toEqual(REPORTED_ROOM_FUNCTIONAL_CLEARANCE.obstacles);
  });

  it("demonstrates equipment physically blocking the declared wardrobe zone", () => {
    const issues = validateProject(REPORTED_ROOM_FUNCTIONAL_CLEARANCE, {
      resolveProduct: findProjectProductById,
    });
    expect(issues).toContainEqual(expect.objectContaining({
      code: "FUNCTIONAL_ZONE_OVERLAP",
      severity: "error",
      details: expect.objectContaining({
        zoneOwnerId: "obstacle_wardrobe",
        blockingEntityId: "placement_kettlebell",
      }),
    }));
  });
});
