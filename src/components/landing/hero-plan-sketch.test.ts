import { describe, expect, it } from "vitest";

import { HeroPlanSketch } from "./hero-plan-sketch";

describe("HeroPlanSketch", () => {
  it("renders a labelled plan that agents and people can both read", () => {
    const tree = HeroPlanSketch();
    const svg = tree.props.children[0];

    expect(tree.type).toBe("figure");
    expect(svg.type).toBe("svg");
    expect(svg.props["aria-label"]).toMatch(/clearance/i);
  });
});
