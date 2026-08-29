// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EquipmentCatalogPanel } from "./equipment-catalog-panel";

afterEach(cleanup);

describe("EquipmentCatalogPanel", () => {
  it("shows the catalog photo for mapped products", () => {
    const { container } = render(<EquipmentCatalogPanel activeProductId={null} onActivate={vi.fn()} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search equipment" }), {
      target: { value: "summit" },
    });
    expect(decodeURIComponent(container.querySelector("img")?.getAttribute("src") ?? "")).toContain(
      "/assets/squat-rack-catalog.png",
    );
  });

  it("keeps the icon fallback when a product has no thumbnail", () => {
    const { container } = render(<EquipmentCatalogPanel activeProductId={null} onActivate={vi.fn()} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search equipment" }), {
      target: { value: "northstar" },
    });
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Northstar Half Rack")).toBeTruthy();
  });

  it("still activates placement from the list", () => {
    const onActivate = vi.fn();
    render(<EquipmentCatalogPanel activeProductId={null} onActivate={onActivate} />);

    fireEvent.click(screen.getByRole("button", { name: "Place Northstar Half Rack" }));
    expect(onActivate).toHaveBeenCalledWith("product_northstar_half_rack");
  });
});
