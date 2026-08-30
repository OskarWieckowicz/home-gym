// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EquipmentCatalogPanel } from "./equipment-catalog-panel";
import { searchProducts } from "@/features/catalog/queries/catalog";
import * as productAssets from "@/features/catalog/product-assets";
import { catalogProducts } from "@/data/products";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderCatalog(onActivate = vi.fn(), onAdd = vi.fn()) {
  return render(
    <EquipmentCatalogPanel activeProductId={null} onActivate={onActivate} onAdd={onAdd} />,
  );
}

describe("EquipmentCatalogPanel", () => {
  it("does not offer retired wrist wraps", () => {
    renderCatalog();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search equipment" }), {
      target: { value: "cove wrist wraps" },
    });
    expect(screen.getByText("No equipment matches this search.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add Cove Wrist Wraps to project" })).toBeNull();
  });

  it("filters by actual catalog categories together with search and restores All equipment", () => {
    renderCatalog();
    const category = screen.getByRole("combobox", { name: "Equipment category" });
    fireEvent.change(category, { target: { value: "benches" } });
    const benches = searchProducts({ category: "benches" });
    expect(screen.getByText(`${benches.length} of ${catalogProducts.length} products`)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Place Northstar Half Rack" })).toBeNull();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "pivot" } });
    expect(screen.getByRole("button", { name: "Place Pivot Flat Bench" })).toBeTruthy();
    fireEvent.change(category, { target: { value: "racks" } });
    expect(screen.getByText("No equipment matches this search.")).toBeTruthy();
    fireEvent.change(category, { target: { value: "" } });
    expect(screen.getByRole("button", { name: "Place Pivot Flat Bench" })).toBeTruthy();
  });

  it.each([
    ["loop", "/assets/single-column-cable-machine-catalog-concept-v2.png"],
    ["dual-pulley", "/assets/compact-dual-pulley-station-catalog-concept-v1.png"],
    ["summit", "/assets/squat-rack-catalog.png"],
    ["northstar", "/assets/northstar-half-rack-catalog.png"],
    ["pivot", "/assets/pivot-flat-bench-catalog.png"],
    ["range", "/assets/range-adjustable-dumbbells-catalog.png"],
    ["surge", "/assets/surge-compact-treadmill-catalog.png"],
    ["summit complete", "/assets/summit-strength-station-catalog.png"],
  ])("shows the catalog photo for %s", (search, imagePath) => {
    const { container } = renderCatalog();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search equipment" }), {
      target: { value: search },
    });
    expect(decodeURIComponent(container.querySelector("img")?.getAttribute("src") ?? "")).toContain(
      imagePath,
    );
  });

  it("keeps the icon fallback when a product has no thumbnail", () => {
    vi.spyOn(productAssets, "getProductImage").mockReturnValue(undefined);
    const { container } = renderCatalog();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search equipment" }), {
      target: { value: "signal resistance bands" },
    });
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Signal Resistance Bands")).toBeTruthy();
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
      target: { value: "resistance bands" },
    });
    expect(screen.queryByRole("button", { name: "Place Signal Resistance Bands" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add Signal Resistance Bands to project" }));
    expect(onAdd).toHaveBeenCalledWith("product_signal_resistance_bands");
  });
});
