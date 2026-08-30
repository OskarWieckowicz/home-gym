// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";

afterEach(cleanup);

it("identifies the prototype and does not publish an unverified repository link", () => {
  render(<SiteFooter />);
  expect(screen.getByText(/prototype built for the WebMCP Challenge/)).toBeTruthy();
  expect(screen.getByText(/Not a professional safety assessment/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Open creator" }).getAttribute("href")).toBe("/creator");
  expect(screen.queryByRole("link", { name: "Repository" })).toBeNull();
});
