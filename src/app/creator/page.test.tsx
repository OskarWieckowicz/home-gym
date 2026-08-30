import { describe, expect, it } from "vitest";
import { Suspense } from "react";

import { CreatorEntry } from "@/features/creator/components/creator-entry";

import CreatorPage, { metadata } from "./page";

describe("CreatorPage", () => {
  it("keeps the route server-renderable around the client editor boundary", () => {
    const page = CreatorPage();
    expect(page.type).toBe(Suspense);
    expect(page.props.children.type).toBe(CreatorEntry);
  });

  it("describes the room editor in route metadata", () => {
    expect(metadata.title).toBe("Creator — Home Gym Creator");
    expect(metadata.description).toContain("2D floor plan");
  });
});
