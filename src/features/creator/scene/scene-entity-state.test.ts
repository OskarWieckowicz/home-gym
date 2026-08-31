import { describe, expect, it } from "vitest";
import type { PlanIssueRef } from "../plan/entity-issue-state";
import { SCENE_ENTITY_COLORS as colors, sceneEntityAppearance } from "./scene-entity-state";

const warning: PlanIssueRef = { entityIds: ["bench"], severity: "warning" };
const error: PlanIssueRef = { entityIds: ["bench", "rack"], severity: "error" };

describe("sceneEntityAppearance", () => {
  it("hides all zone, issue and selection cues in presentation view even with all zones enabled", () => {
    expect(sceneEntityAppearance("bench", "bench", [error, warning], { showAllUseZones: true, presentationView: true })).toMatchObject({
      issue: null, outline: null, emissive: colors.noEmission, color: colors.fallback, useZoneVisible: false,
    });
  });
  it("adds an independent selection outline without tinting valid equipment", () => {
    expect(sceneEntityAppearance("bench", "bench", [])).toMatchObject({
      outline: colors.selected, color: colors.fallback, emissive: colors.noEmission,
      overlayColor: colors.useZone, issue: null, useZoneVisible: true,
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
      issue: null, outline: null, color: colors.fallback, emissive: colors.noEmission, useZoneVisible: false,
    });
  });

  it("shows all zones only when requested, without changing issue or selection appearance", () => {
    const contextual = sceneEntityAppearance("bench", null, []);
    expect(sceneEntityAppearance("bench", null, [], { showAllUseZones: true })).toEqual({ ...contextual, useZoneVisible: true });
    expect(contextual.opacity).toBeLessThan(0.22);
  });

  it.each([error, warning])("keeps flagged zones visible with the all-zones layer off", (issue) => {
    expect(sceneEntityAppearance("bench", null, [issue], { showAllUseZones: false })).toMatchObject({ useZoneVisible: true, issue: issue.severity });
  });

  it("does not reveal zones for unrelated or global issues", () => {
    expect(sceneEntityAppearance("other", null, [error, { severity: "error", entityIds: [] }], { showAllUseZones: false }).useZoneVisible).toBe(false);
  });
});
