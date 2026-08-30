// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { findProductById } from "@/features/catalog/queries";
import { createDefaultProject } from "@/features/project/defaults";
import { toProjectItemsAndPlacements } from "@/features/project/validation/test-placed-equipment";

import { ProjectStoreProvider } from "../store/project-store-context";
import { PlacementForm } from "./placement-form";

afterEach(cleanup);

describe("PlacementForm", () => {
  it("shows a read-only mount row for wall-mounted equipment", () => {
    const product = findProductById("product_anchor_pullup_bar");
    expect(product).toBeDefined();
    if (!product) return;
    const placed = toProjectItemsAndPlacements([{
      id: "placement_bar",
      productId: product.id,
      position: { xCm: 246, zCm: 80 },
      rotation: 90,
    }]);
    const placement = placed.placements[0];

    render(
      <ProjectStoreProvider initialProject={{
        ...createDefaultProject(),
        ...placed,
      }}>
        <PlacementForm onRemoved={vi.fn()} placement={placement} product={product} />
      </ProjectStoreProvider>,
    );

    expect(screen.getByText("Mounted on the right wall at 195 cm")).toBeTruthy();
  });
});
