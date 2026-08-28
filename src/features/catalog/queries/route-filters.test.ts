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
        maxWidthCm: ["120", "1"],
        maxDepthCm: "180",
        maxHeightCm: "210",
        exercise: "  BENCH   PRESS ",
        availableCeilingHeightCm: "230",
        anchoring: " REQUIRED ",
      }),
    ).toEqual({
      query: "bench press",
      category: "racks",
      trainingGoal: "strength",
      maxPrice: 4000,
      maxWidthCm: 120,
      maxDepthCm: 180,
      maxHeightCm: 210,
      exercise: "bench press",
      availableCeilingHeightCm: 230,
      anchoring: "required",
    });
  });

  it("ignores malformed user-edited values", () => {
    expect(
      parseCatalogSearchParams({
        query: "  ",
        category: "unknown",
        trainingGoal: "nope",
        maxPrice: "not-a-number",
        maxWidthCm: "-1",
        maxDepthCm: "1.5",
        maxHeightCm: "Infinity",
        exercise: "  ",
        availableCeilingHeightCm: "unknown",
        anchoring: "sometimes",
      }),
    ).toEqual({});
  });
});
