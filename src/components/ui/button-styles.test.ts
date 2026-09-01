import { describe, expect, it } from "vitest";

import { BUTTON_VARIANTS, buttonClassName } from "./button-styles";
import { Button } from "./button";

describe("buttonClassName", () => {
  it("applies the shared focus ring and each visual variant", () => {
    expect(buttonClassName("primary")).toContain("bg-brand");
    expect(buttonClassName("secondary")).toContain("border-line");
    expect(buttonClassName("quiet")).toContain("text-ink-muted");
    expect(buttonClassName("primary")).toContain("focus-visible:outline-brand");
  });

  it("keeps the variant keys stable for LinkButton and Button", () => {
    expect(Object.keys(BUTTON_VARIANTS)).toEqual([
      "primary",
      "secondary",
      "quiet",
    ]);
  });
});

describe("Button", () => {
  it("renders a non-submit button with the primary treatment by default", () => {
    const tree = Button({ children: "Save" });

    expect(tree.type).toBe("button");
    expect(tree.props.type).toBe("button");
    expect(tree.props.className).toContain("bg-brand");
  });
});
