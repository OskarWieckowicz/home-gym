import { describe, expect, it } from "vitest";

import { Card } from "./card";

describe("Card", () => {
  it("uses the white surface, thin border, and restrained shadow", () => {
    const tree = Card({ children: "Body" });

    expect(tree.props.className).toContain("bg-surface");
    expect(tree.props.className).toContain("border-line");
    expect(tree.props.className).toContain("rounded-2xl");
    expect(tree.props.className).toContain("shadow-card");
  });
});
