import { describe, expect, it } from "vitest";

import { parseCatalogSearchParams } from "./route-filters";

describe("parseCatalogSearchParams", () => {
  it("takes the first repeated value and normalizes route input", () => {
    expect(
      parseCatalogSearchParams({
        query: ["  Bench   PRESS ", "ignored"],
        category: [" RACKS ", "weights"],
        trainingGoal: " STRENGTH ",
        maxPrice: ["4000", "100"],
      }),
    ).toEqual({
      query: "bench press",
      category: "racks",
      trainingGoal: "strength",
      maxPrice: 4000,
    });
  });

  it("ignores malformed user-edited values", () => {
    expect(
      parseCatalogSearchParams({
        query: "  ",
        category: "unknown",
        trainingGoal: "nope",
        maxPrice: "not-a-number",
      }),
    ).toEqual({});
  });
});
