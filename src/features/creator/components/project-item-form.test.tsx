// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { findProductById } from "@/features/catalog/queries";
import { createDefaultProject } from "@/features/project/defaults";

import { ProjectStoreProvider } from "../store/project-store-context";
import { ProjectItemForm } from "./project-item-form";

afterEach(cleanup);

describe("ProjectItemForm", () => {
  it("offers placement for an unplaced floor product", () => {
    const barbell = findProductById("product_quarry_power_bar");
    if (!barbell) throw new Error("Missing catalog fixture.");
    const onPlace = vi.fn();

    render(
      <ProjectStoreProvider
        initialProject={{
          ...createDefaultProject(),
          projectItems: [{ id: "project-item_bar", productId: barbell.id }],
        }}
      >
        <ProjectItemForm
          item={{ id: "project-item_bar", productId: barbell.id }}
          onPlace={onPlace}
          onRemoved={vi.fn()}
          product={barbell}
        />
      </ProjectStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Place on plan/ }));
    expect(onPlace).toHaveBeenCalledOnce();
  });

  it("explains that a selection-only accessory cannot be placed", () => {
    const roller = findProductById("product_groundwork_foam_roller");
    if (!roller) throw new Error("Missing catalog fixture.");

    render(
      <ProjectStoreProvider
        initialProject={{
          ...createDefaultProject(),
          projectItems: [{ id: "project-item_roller", productId: roller.id }],
        }}
      >
        <ProjectItemForm
          item={{ id: "project-item_roller", productId: roller.id }}
          onPlace={vi.fn()}
          onRemoved={vi.fn()}
          product={roller}
        />
      </ProjectStoreProvider>,
    );

    expect(screen.queryByRole("button", { name: /Place on plan/ })).toBeNull();
    expect(screen.getByText(/cannot be placed on the floor/)).toBeTruthy();
  });
});
