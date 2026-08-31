// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CatalogFilterForm } from "./catalog-filter-form";
import { PRODUCT_CATEGORY_LABELS } from "@/shared/schemas/product-category";

afterEach(cleanup);

const values = {
  query: "press",
  category: "free-weights",
  maxPrice: 2400,
  maxWidthCm: 220,
  maxDepthCm: 80,
  maxHeightCm: 60,
  trainingGoal: "strength",
  exercise: "overhead press",
  availableCeilingHeightCm: 230,
  anchoring: "none",
} as const;

describe("CatalogFilterForm", () => {
  it("renders the complete shared filter contract with accessible groups", () => {
    render(
      <CatalogFilterForm
        exerciseOptions={["bench press", "overhead press"]}
        hasActiveFilters
        values={values}
      />,
    );

    expect(screen.getByRole("group", { name: "Category" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Training goal" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Price" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Maximum equipment dimensions" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Requirements" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Free Weights" })).toHaveProperty("checked", true);
    for (const [category, label] of Object.entries(PRODUCT_CATEGORY_LABELS)) {
      expect(screen.getByRole("radio", { name: label })).toHaveProperty("value", category);
    }
    expect(screen.queryByRole("radio", { name: "Accessories" })).toBeNull();
    expect(screen.getByRole("radio", { name: "Strength" })).toHaveProperty("checked", true);
    expect(screen.getByRole("combobox", { name: "Exercise" })).toHaveProperty("value", "overhead press");
    expect(screen.getByRole("combobox", { name: "Anchoring" })).toHaveProperty("value", "none");

    for (const [name, value] of [
      ["Maximum price (PLN)", "2400"],
      ["Width (cm)", "220"],
      ["Depth (cm)", "80"],
      ["Product height (cm)", "60"],
      ["Available ceiling height (cm)", "230"],
    ] as const) {
      const input = screen.getByRole("spinbutton", { name });
      expect(input).toHaveProperty("value", value);
      expect(input).toHaveProperty("min", "0");
      expect(input).toHaveProperty("step", "1");
    }

    expect(screen.getByRole("option", { name: "Overhead press" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "No anchoring" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveProperty("pathname", "/catalog");
  });

  it("keeps secondary filters collapsed unless they have values", () => {
    const { container } = render(
      <CatalogFilterForm exerciseOptions={[]} hasActiveFilters={false} values={{}} />,
    );
    expect(Array.from(container.querySelectorAll("details")).every((section) => !section.open)).toBe(true);
    expect(Array.from(container.querySelectorAll("fieldset > legend")).slice(0, 2).map((legend) => legend.textContent)).toEqual(["Price", "Maximum equipment dimensions"]);
  });

  it("keeps every GET field and the external search value when sections are closed", () => {
    const { container } = render(
      <>
        <CatalogFilterForm exerciseOptions={["overhead press"]} hasActiveFilters values={values} />
        <input form="catalog-filters" name="query" defaultValue="press" />
      </>,
    );
    for (const section of container.querySelectorAll("details")) {
      expect(section.open).toBe(true);
      section.open = false;
    }
    const form = container.querySelector("form")!;
    expect(form.method).toBe("get");
    expect(Object.fromEntries(new FormData(form))).toEqual(
      Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)])),
    );
  });

  it("omits the clear action when no filters are active", () => {
    render(
      <CatalogFilterForm exerciseOptions={[]} hasActiveFilters={false} values={{}} />,
    );

    expect(screen.queryByRole("link", { name: "Clear filters" })).toBeNull();
    expect(screen.getByRole("button", { name: "Apply filters" })).toHaveProperty("type", "submit");
  });
});
