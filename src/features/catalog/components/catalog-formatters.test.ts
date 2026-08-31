import { describe, expect, it } from "vitest";

import {
  formatCatalogLabel,
  formatUseZoneSummary,
  formatDimensions,
  formatFootprint,
  formatPrice,
} from "./catalog-formatters";

const dimensions = { widthCm: 120, depthCm: 140, heightCm: 215 };

describe("catalog formatters", () => {
  it.each([
    ["racks", "Racks & Stands"],
    ["benches", "Benches"],
    ["free-weights", "Free Weights"],
    ["cable-machines", "Cable Machines"],
    ["bodyweight-training", "Bodyweight Training"],
    ["cardio-conditioning", "Cardio & Conditioning"],
    ["mobility-recovery", "Mobility & Recovery"],
  ])("formats the %s category consistently", (category, label) => {
    expect(formatCatalogLabel(category)).toBe(label);
  });

  it("formats commercial and spatial values consistently", () => {
    expect(formatPrice(4490)).toMatch(/4[,.\s]490/);
    expect(formatPrice(4490)).toContain("$");
    expect(formatDimensions(dimensions)).toBe("120 × 140 × 215 cm");
    expect(formatFootprint(dimensions)).toBe("120 × 140 cm");
  });

  it("summarizes the largest required use zone", () => {
    expect(
      formatUseZoneSummary({
        frontCm: 120,
        backCm: 10,
        leftCm: 50,
        rightCm: 50,
      }),
    ).toBe("Up to 120 cm additional use zone");
    expect(
      formatUseZoneSummary({
        frontCm: 0,
        backCm: 0,
        leftCm: 0,
        rightCm: 0,
      }),
    ).toBe("No additional use zone");
  });

  it("turns canonical vocabulary into display labels", () => {
    expect(formatCatalogLabel("general-fitness")).toBe("General Fitness");
  });
});
