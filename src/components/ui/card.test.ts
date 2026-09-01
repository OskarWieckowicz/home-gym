import { describe, expect, it } from "vitest";

import { Card } from "./card";

describe("Card", () => {
  it("uses the warm surface, architectural radius, and restrained shadow", () => {
    const tree = Card({ children: "Body" });

    expect(tree.props.className).toContain("bg-surface");
    expect(tree.props.className).toContain("border-line");
    expect(tree.props.className).toContain("rounded-xl");
    expect(tree.props.className).toContain("shadow-card");
  });
});
