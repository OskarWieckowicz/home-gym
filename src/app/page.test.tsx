import { describe, expect, it } from "vitest";

import { HeroPlanSketch } from "@/components/landing/hero-plan-sketch";

import Home from "./page";

function hasElementType(node: unknown, type: unknown): boolean {
  if (node == null || typeof node !== "object") {
    return false;
  }

  if ("type" in node && node.type === type) {
    return true;
  }

  if (
    !("props" in node) ||
    node.props == null ||
    typeof node.props !== "object"
  ) {
    return false;
  }

  const children = "children" in node.props ? node.props.children : undefined;

  return Array.isArray(children)
    ? children.some((child) => hasElementType(child, type))
    : hasElementType(children, type);
}

describe("Home", () => {
  it("renders the application entry point", () => {
    expect(Home().type).toBe("main");
  });

  it("places the floor-plan sketch in the hero", () => {
    expect(hasElementType(Home(), HeroPlanSketch)).toBe(true);
  });
});
