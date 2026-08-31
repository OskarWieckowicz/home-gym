// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EquipmentCatalogPanel } from "./equipment-catalog-panel";
import { searchProducts } from "@/features/catalog/queries/catalog";
import * as productAssets from "@/features/catalog/product-assets";
import { catalogProducts } from "@/data/products";
import { PRODUCT_CATEGORY_LABELS } from "@/shared/schemas/product-category";
import { ProjectStoreProvider } from "../store/project-store-context";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderCatalog(onActivate = vi.fn(), onAdd = vi.fn(), project: GymProject = createDefaultProject()) {
  return render(
    <ProjectStoreProvider initialProject={project}>
      <EquipmentCatalogPanel activeProductId={null} onActivate={onActivate} onAdd={onAdd} />
    </ProjectStoreProvider>,
  );
}

describe("EquipmentCatalogPanel", () => {
  it("lists every catalog product under All equipment", () => {
    renderCatalog();
    expect(screen.getByText(`${catalogProducts.length} of ${catalogProducts.length} products`)).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(catalogProducts.length);
    expect(screen.queryByText("Refine the search to see the remaining products.")).toBeNull();
    for (const product of catalogProducts) {
      expect(screen.getByRole("button", { name: product.placementMode === "floor" ? `Place ${product.name}` : `Add to list: ${product.name}` })).toBeTruthy();
    }
  });

  it.each(Object.entries(PRODUCT_CATEGORY_LABELS))("filters all equipment in %s", (category, label) => {
    renderCatalog();
    expect(screen.getByRole("option", { name: label })).toHaveProperty("value", category);
    expect(screen.queryByRole("option", { name: "Accessories" })).toBeNull();
    fireEvent.change(screen.getByRole("combobox", { name: "Equipment category" }), {
      target: { value: category },
    });
    const products = searchProducts({ category });
    expect(screen.getAllByRole("button")).toHaveLength(products.length);
    for (const product of products) {
      expect(screen.getByRole("button", { name: product.placementMode === "floor" ? `Place ${product.name}` : `Add to list: ${product.name}` })).toBeTruthy();
    }
  });

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
    ["olympic", "/assets/olympic-bench-catalog-concept-v1.png"],
    ["loop", "/assets/single-column-cable-machine-catalog-concept-v2.png"],
    ["dual-pulley", "/assets/compact-dual-pulley-station-catalog-concept-v1.png"],
    ["summit", "/assets/squat-rack-catalog.png"],
    ["northstar", "/assets/northstar-half-rack-catalog-v4.png"],
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

  it("offers only Place for floor and wall-mounted products", () => {
    renderCatalog();

    for (const name of ["Northstar Half Rack", "Wall-Mounted Punching Bag"]) {
      const place = screen.getByRole("button", { name: `Place ${name}` });
      expect(place.textContent).toBe("Place");
      expect(within(place.closest("li")!).getAllByRole("button")).toHaveLength(1);
    }
  });

  it("adds selection-only accessories without a Place action", () => {
    const onAdd = vi.fn();
    renderCatalog(vi.fn(), onAdd);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search equipment" }), {
      target: { value: "resistance bands" },
    });
    expect(screen.queryByRole("button", { name: "Place Signal Resistance Bands" })).toBeNull();
    const add = screen.getByRole("button", { name: "Add to list: Signal Resistance Bands" });
    expect(add.textContent).toBe("Add to list");
    expect(screen.getByText(/No floor placement needed/)).toBeTruthy();
    fireEvent.click(add);
    expect(onAdd).toHaveBeenCalledWith("product_signal_resistance_bands");
  });

  it("shows quantities and explains reuse without labeling accessories as pending", () => {
    const project = createDefaultProject();
    project.projectItems = [
      { id: "project-item_one", productId: "product_northstar_half_rack" },
      { id: "project-item_two", productId: "product_northstar_half_rack" },
      { id: "project-item_bands", productId: "product_signal_resistance_bands" },
    ];
    project.placements = [{ id: "placement_one", projectItemId: "project-item_one", position: { xCm: 0, zCm: 0 }, rotation: 0 }];
    renderCatalog(vi.fn(), vi.fn(), project);
    expect(screen.getByText("2 in project · 1 not placed")).toBeTruthy();
    const hint = screen.getByText("Places an item already on your list");
    expect(screen.getByRole("button", { name: "Place Northstar Half Rack" }).getAttribute("aria-describedby")).toBe(hint.id);
    const bands = screen.getByRole("button", { name: "Add to list: Signal Resistance Bands" }).closest("li")!;
    expect(within(bands).getByText("1 in project")).toBeTruthy();
    expect(bands.textContent).not.toContain("not placed");
  });
});
