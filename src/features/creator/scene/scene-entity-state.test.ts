import { describe, expect, it } from "vitest";
import type { PlanIssueRef } from "../plan/entity-issue-state";
import { SCENE_ENTITY_COLORS as colors, sceneEntityAppearance } from "./scene-entity-state";

const warning: PlanIssueRef = { entityIds: ["bench"], severity: "warning" };
const error: PlanIssueRef = { entityIds: ["bench", "rack"], severity: "error" };

describe("sceneEntityAppearance", () => {
  it("adds an independent selection outline without tinting valid equipment", () => {
    expect(sceneEntityAppearance("bench", "bench", [])).toMatchObject({
      outline: colors.selected, color: colors.fallback, emissive: colors.noEmission,
      overlayColor: colors.useZone, opacity: 0.22, issue: null,
    });
  });

  it.each(["bench", "rack"])("marks both members of a pairwise error: %s", (id) => {
    expect(sceneEntityAppearance(id, null, [error])).toMatchObject({
      outline: null, color: colors.error, emissive: colors.error,
      overlayColor: colors.error, issue: "error",
    });
  });

  it("gives warnings a different tint and makes the overlay more visible", () => {
    const appearance = sceneEntityAppearance("bench", null, [warning]);
    expect(appearance).toMatchObject({ color: colors.warning, overlayColor: colors.warning, emissive: colors.warning });
    expect(appearance.color).not.toBe(colors.error);
    expect(appearance.opacity).toBeGreaterThan(sceneEntityAppearance("bench", null, []).opacity);
  });

  it.each([[warning, error], [error, warning]])("prioritizes errors regardless of issue order", (first, second) => {
    expect(sceneEntityAppearance("bench", null, [first, second]).issue).toBe("error");
  });

  it.each([error, warning])("keeps selection independent of $severity tint", (issue) => {
    const appearance = sceneEntityAppearance("bench", "bench", [issue]);
    expect(appearance.outline).toBe(colors.selected);
    expect(appearance.color).toBe(colors[issue.severity]);
  });

  it("ignores unknown IDs and global issues", () => {
    expect(sceneEntityAppearance("unknown", "bench", [error, warning, { severity: "error", entityIds: [] }]))
      .toEqual(sceneEntityAppearance("unknown", null, []));
  });

  it("leaves an unselected entity with no issues neutral", () => {
    expect(sceneEntityAppearance("bench", null, [])).toMatchObject({
      issue: null, outline: null, color: colors.fallback, emissive: colors.noEmission,
    });
  });
});
