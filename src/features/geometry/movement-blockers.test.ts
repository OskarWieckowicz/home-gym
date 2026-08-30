import { describe, expect, it } from "vitest";

import { STEP_OVER_HEIGHT_CM } from "./access-constants";
import { blocksMovement } from "./movement-blockers";

describe("blocksMovement", () => {
  it("treats geometry up to the step-over height as crossable", () => {
    expect(blocksMovement(5)).toBe(false);
    expect(blocksMovement(STEP_OVER_HEIGHT_CM)).toBe(false);
  });

  it("treats anything taller as an obstruction", () => {
    expect(blocksMovement(STEP_OVER_HEIGHT_CM + 1)).toBe(true);
    expect(blocksMovement(220)).toBe(true);
  });
});
