// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EquipmentCatalogPanel } from "./equipment-catalog-panel";

afterEach(cleanup);

function renderCatalog(onActivate = vi.fn(), onAdd = vi.fn()) {
  return render(
    <EquipmentCatalogPanel activeProductId={null} onActivate={onActivate} onAdd={onAdd} />,
  );
}

describe("EquipmentCatalogPanel", () => {
  it("shows the catalog photo for mapped products", () => {
    const { container } = renderCatalog();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search equipment" }), {
      target: { value: "summit" },
    });
    expect(decodeURIComponent(container.querySelector("img")?.getAttribute("src") ?? "")).toContain(
      "/assets/squat-rack-catalog.png",
    );
  });

  it("keeps the icon fallback when a product has no thumbnail", () => {
    const { container } = renderCatalog();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search equipment" }), {
      target: { value: "northstar" },
    });
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Northstar Half Rack")).toBeTruthy();
  });

  it("still activates placement from the list", () => {
    const onActivate = vi.fn();
    renderCatalog(onActivate);

    fireEvent.click(screen.getByRole("button", { name: "Place Northstar Half Rack" }));
    expect(onActivate).toHaveBeenCalledWith("product_northstar_half_rack");
  });

  it("keeps Add as the visible catalog action while exposing the full accessible name", () => {
    renderCatalog();

    const addButton = screen.getByRole("button", { name: "Add Northstar Half Rack to project" });
    expect(addButton.textContent).toBe("Add");
  });

  it("adds selection-only accessories without a Place action", () => {
    const onAdd = vi.fn();
    renderCatalog(vi.fn(), onAdd);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search equipment" }), {
      target: { value: "wrist wraps" },
    });
    expect(screen.queryByRole("button", { name: "Place Cove Wrist Wraps" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add Cove Wrist Wraps to project" }));
    expect(onAdd).toHaveBeenCalledWith("product_cove_wrist_wraps");
  });
});
