// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectStoreProvider, useProjectStore } from "./project-store-context";

function Probe({ label }: { readonly label: string }) {
  const budget = useProjectStore((state) => state.project.budget);
  const dispatch = useProjectStore((state) => state.dispatch);
  return <button onClick={() => dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: { budget: budget + 1 } })} type="button">{label}: {budget}</button>;
}

describe("ProjectStoreProvider", () => {
  it("creates independent stores for independently mounted workspaces", () => {
    render(<><ProjectStoreProvider><Probe label="First" /></ProjectStoreProvider><ProjectStoreProvider><Probe label="Second" /></ProjectStoreProvider></>);
    fireEvent.click(screen.getByRole("button", { name: "First: 2500" }));
    expect(screen.getByRole("button", { name: "First: 2501" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Second: 2500" })).toBeTruthy();
  });

  it("fails clearly without a provider", () => {
    expect(() => render(<Probe label="Missing" />)).toThrow("useProjectStore must be used inside ProjectStoreProvider");
  });
});
