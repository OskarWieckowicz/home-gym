// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findProductById } from "@/features/catalog/queries/catalog";
import type { Placement } from "@/features/project/schemas/project";
import { EquipmentEntity } from "./equipment-entity";

const transforms = {
  0: "translate(20 30)",
  90: "translate(20 96) rotate(-90)",
  180: "translate(86 172) rotate(-180)",
  270: "translate(162 30) rotate(-270)",
} as const;

afterEach(cleanup);

function renderEquipment(productId: string, rotation: Placement["rotation"] = 0) {
  const product = findProductById(productId);
  if (!product) throw new Error(`Missing test product: ${productId}`);
  const placement: Placement = { id: "placement_test", productId, position: { xCm: 20, zCm: 30 }, rotation };
  return render(
    <svg>
      <EquipmentEntity
        interactive
        issues={[]}
        onBeginDrag={vi.fn()}
        onCancelDrag={vi.fn()}
        onFinishDrag={vi.fn()}
        onKeySelect={vi.fn()}
        onMoveDrag={vi.fn()}
        placement={placement}
        position={placement.position}
        product={product}
        selectedId={null}
        transform={{ scale: 1, offsetX: 0, offsetY: 0, roomWidth: 400, roomHeight: 320 }}
      />
    </svg>,
  );
}

describe("EquipmentEntity top views", () => {
  it.each([0, 90, 180, 270] as const)("rotates the canonical Arc view for %s degrees", (rotation) => {
    const view = renderEquipment("product_arc_adjustable_bench", rotation);
    const image = view.container.querySelector(".creator-equipment-top-view");

    expect(image?.getAttribute("href")).toBe("/assets/arc-adjustable-bench-top.svg");
    expect(image?.getAttribute("pointer-events")).toBe("none");
    expect(image?.parentElement?.getAttribute("transform")).toBe(transforms[rotation]);
    expect(view.container.querySelector(".creator-equipment-outline")).toBeTruthy();
  });

  it("keeps the labeled rectangle fallback for an unmapped product", () => {
    const view = renderEquipment("product_northstar_half_rack");
    expect(view.container.querySelector(".creator-equipment-top-view")).toBeNull();
    expect(view.container.querySelector(".creator-equipment-footprint")).toBeTruthy();
    expect(view.container.querySelector(".creator-equipment-label")?.textContent).toBe("Northstar Half Rack");
  });

  it("uses the accepted Current Fold Bike top view", () => {
    const view = renderEquipment("product_current_fold_bike");
    const image = view.container.querySelector(".creator-equipment-top-view");

    expect(image?.getAttribute("href")).toBe("/assets/current-fold-bike-top.svg");
    expect(view.container.querySelector(".creator-equipment-label")).toBeNull();
    expect(view.container.querySelector(".creator-equipment-outline")).toBeTruthy();
  });

  it("uses a warned state instead of an error for use-zone overlap", () => {
    const product = findProductById("product_arc_adjustable_bench");
    if (!product) throw new Error("Missing test product");
    const placement: Placement = {
      id: "placement_test",
      productId: product.id,
      position: { xCm: 20, zCm: 30 },
      rotation: 0,
    };
    const view = render(
      <svg>
        <EquipmentEntity
          interactive
          issues={[{
            entityIds: ["placement_test"],
            severity: "warning",
          }]}
          onBeginDrag={vi.fn()}
          onCancelDrag={vi.fn()}
          onFinishDrag={vi.fn()}
          onKeySelect={vi.fn()}
          onMoveDrag={vi.fn()}
          placement={placement}
          position={placement.position}
          product={product}
          selectedId={null}
          transform={{ scale: 1, offsetX: 0, offsetY: 0, roomWidth: 400, roomHeight: 320 }}
        />
      </svg>,
    );
    const entity = view.container.querySelector(".creator-plan-equipment");

    expect(entity?.classList.contains("is-warned")).toBe(true);
    expect(entity?.classList.contains("is-invalid")).toBe(false);
    expect(entity?.getAttribute("aria-label")).toContain("has layout warning");
    expect(entity?.getAttribute("aria-label")).not.toContain("has layout error");
  });

  it("uses the combined strength-station top view", () => {
    const view = renderEquipment("product_summit_strength_station");
    const image = view.container.querySelector(".creator-equipment-top-view");

    expect(image?.getAttribute("href")).toBe("/assets/strength-station-composition-top.svg");
    expect(view.container.querySelector(".creator-equipment-label")).toBeNull();
    expect(view.container.querySelector(".creator-equipment-outline")).toBeTruthy();
  });
});
