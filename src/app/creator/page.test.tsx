import { describe, expect, it } from "vitest";

import { CreatorEditor } from "@/features/creator/components/creator-editor";

import CreatorPage, { metadata } from "./page";

describe("CreatorPage", () => {
  it("keeps the route server-renderable around the client editor boundary", () => {
    expect(CreatorPage().type).toBe(CreatorEditor);
  });

  it("describes the room editor in route metadata", () => {
    expect(metadata.title).toBe("Creator — Home Gym Creator");
    expect(metadata.description).toContain("2D floor plan");
  });
});
