import { describe, expect, it } from "vitest";

import {
  formatCatalogLabel,
  formatClearanceSummary,
  formatDimensions,
  formatFootprint,
  formatPricePln,
} from "./catalog-formatters";

const dimensions = { widthCm: 120, depthCm: 140, heightCm: 215 };

describe("catalog formatters", () => {
  it("formats commercial and spatial values consistently", () => {
    expect(formatPricePln(4490)).toMatch(/4[,.\s]490/);
    expect(formatPricePln(4490)).toContain("PLN");
    expect(formatDimensions(dimensions)).toBe("120 × 140 × 215 cm");
    expect(formatFootprint(dimensions)).toBe("120 × 140 cm");
  });

  it("summarizes the largest required clearance", () => {
    expect(
      formatClearanceSummary({
        frontCm: 120,
        backCm: 10,
        leftCm: 50,
        rightCm: 50,
      }),
    ).toBe("Up to 120 cm additional clearance");
    expect(
      formatClearanceSummary({
        frontCm: 0,
        backCm: 0,
        leftCm: 0,
        rightCm: 0,
      }),
    ).toBe("No additional clearance");
  });

  it("turns canonical vocabulary into display labels", () => {
    expect(formatCatalogLabel("general-fitness")).toBe("General Fitness");
  });
});
