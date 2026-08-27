import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("renders the application entry point", () => {
    expect(Home().type).toBe("main");
  });
});
