// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findProjectProductById as findProductById } from "@/features/catalog/queries/project-products";
import type { Placement } from "@/features/project/schemas/project";
import { EquipmentEntity } from "./equipment-entity";

const transforms = {
  0: "translate(86 172) rotate(-180)",
  90: "translate(20 96) rotate(-90)",
  180: "translate(20 30)",
  270: "translate(162 30) rotate(-270)",
} as const;

afterEach(cleanup);

function renderEquipment(productId: string, rotation: Placement["rotation"] = 0) {
  const product = findProductById(productId);
  if (!product) throw new Error(`Missing test product: ${productId}`);
  const placement: Placement = { locked: false,
    id: "placement_test",
    projectItemId: "project-item_test",
    position: { xCm: 20, zCm: 30 },
    rotation,
  };
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

describe("Surge treadmill top view", () => {
  it.each([
    [0, "translate(98 192) rotate(-180)", ["-10", "-50", "138", "267"]],
    [90, "translate(20 108) rotate(-90)", ["-5", "0", "267", "138"]],
    [180, "translate(20 30)", ["-10", "5", "138", "267"]],
    [270, "translate(182 30) rotate(-270)", ["-60", "0", "267", "138"]],
  ] as const)("preserves the 80 cm rear clearance at %s degrees", (rotation, pose, bounds) => {
    const view = renderEquipment("product_surge_compact_treadmill", rotation);
    const image = view.container.querySelector(".creator-equipment-top-view");
    const zone = view.container.querySelector(".creator-equipment-use-zone");
    expect(image?.getAttribute("href")).toBe("/assets/surge-compact-treadmill-top.svg");
    expect(["width", "height", "pointer-events"].map((attribute) => image?.getAttribute(attribute)))
      .toEqual(["78", "162", "none"]);
    expect(image?.parentElement?.getAttribute("transform")).toBe(pose);
    expect(view.container.querySelector(".creator-equipment-outline")).toBeTruthy();
    expect(["x", "y", "width", "height"].map((attribute) => zone?.getAttribute(attribute))).toEqual(bounds);
  });
});

describe("EquipmentEntity top views", () => {
  it.each([
    [0, "translate(68 84) rotate(-180)", ["-20", "20", "128", "104"]],
    [90, "translate(20 78) rotate(-90)", ["-20", "-10", "104", "128"]],
    [180, "translate(20 30)", ["-20", "-10", "128", "104"]],
    [270, "translate(74 30) rotate(-270)", ["10", "-10", "104", "128"]],
  ] as const)("aligns Range dumbbells with the 40 cm front zone at %s degrees", (rotation, pose, bounds) => {
    const view = renderEquipment("product_range_adjustable_dumbbells", rotation);
    const image = view.container.querySelector(".creator-equipment-top-view");
    const zone = view.container.querySelector(".creator-equipment-use-zone");
    expect(image?.getAttribute("href")).toBe("/assets/range-adjustable-dumbbells-top.svg");
    expect(["width", "height", "pointer-events"].map((attribute) => image?.getAttribute(attribute)))
      .toEqual(["48", "54", "none"]);
    expect(image?.parentElement?.getAttribute("transform")).toBe(pose);
    expect(view.container.querySelector(".creator-equipment-outline")).toBeTruthy();
    expect(["x", "y", "width", "height"].map((attribute) => zone?.getAttribute(attribute))).toEqual(bounds);
  });

  it.each([
    [0, "translate(78 154) rotate(-180)", ["-20", "10", "138", "164"]],
    [90, "translate(20 88) rotate(-90)", ["0", "-10", "164", "138"]],
    [180, "translate(20 30)", ["-20", "10", "138", "164"]],
    [270, "translate(144 30) rotate(-270)", ["0", "-10", "164", "138"]],
  ] as const)("renders Pivot within its footprint and use zone at %s degrees", (rotation, pose, bounds) => {
    const view = renderEquipment("product_pivot_flat_bench", rotation);
    const image = view.container.querySelector(".creator-equipment-top-view");
    const zone = view.container.querySelector(".creator-equipment-use-zone");
    expect(image?.getAttribute("href")).toBe("/assets/pivot-flat-bench-top.svg");
    expect(image?.getAttribute("width")).toBe("58");
    expect(image?.getAttribute("height")).toBe("124");
    expect(image?.getAttribute("pointer-events")).toBe("none");
    expect(image?.parentElement?.getAttribute("transform")).toBe(pose);
    expect(view.container.querySelector(".creator-equipment-outline")).toBeTruthy();
    expect(["x", "y", "width", "height"].map((attribute) => zone?.getAttribute(attribute))).toEqual(bounds);
  });

  it.each([0, 90, 180, 270] as const)("rotates the canonical Arc view for %s degrees", (rotation) => {
    const view = renderEquipment("product_arc_adjustable_bench", rotation);
    const image = view.container.querySelector(".creator-equipment-top-view");

    expect(image?.getAttribute("href")).toBe("/assets/arc-adjustable-bench-top.svg");
    expect(image?.getAttribute("pointer-events")).toBe("none");
    expect(image?.parentElement?.getAttribute("transform")).toBe(transforms[rotation]);
    expect(view.container.querySelector(".creator-equipment-outline")).toBeTruthy();
  });

  it("keeps the labeled rectangle fallback for an unmapped product", () => {
    const view = renderEquipment("product_foundry_wall_rack");
    expect(view.container.querySelector(".creator-equipment-top-view")).toBeNull();
    expect(view.container.querySelector(".creator-equipment-footprint")).toBeTruthy();
    expect(view.container.querySelector(".creator-equipment-label")?.textContent).toBe("Foundry Folding Wall Rack");
  });

  it("renders the Northstar top view inside its catalog footprint", () => {
    const view = renderEquipment("product_northstar_half_rack");
    const image = view.container.querySelector(".creator-equipment-top-view");
    expect(image?.getAttribute("href")).toBe("/assets/northstar-half-rack-top.svg?v=4");
    expect(image?.getAttribute("width")).toBe("122");
    expect(image?.getAttribute("height")).toBe("130");
    expect(image?.getAttribute("pointer-events")).toBe("none");
    expect(view.container.querySelector(".creator-equipment-outline")).toBeTruthy();
  });

  it.each([
    [0, "translate(142 160) rotate(-180)", ["-15", "25", "192", "205"]],
    [90, "translate(20 152) rotate(-90)", ["-50", "-5", "205", "192"]],
    [180, "translate(20 30)", ["-15", "-40", "192", "205"]],
    [270, "translate(150 30) rotate(-270)", ["15", "-5", "205", "192"]],
  ] as const)("aligns the Northstar SVG and 70 cm front zone at %s degrees", (rotation, pose, bounds) => {
    const view = renderEquipment("product_northstar_half_rack", rotation);
    const image = view.container.querySelector(".creator-equipment-top-view");
    const zone = view.container.querySelector(".creator-equipment-use-zone");
    expect(image?.parentElement?.getAttribute("transform")).toBe(pose);
    expect(["x", "y", "width", "height"].map((attribute) => zone?.getAttribute(attribute)))
      .toEqual(bounds);
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
    const placement: Placement = { locked: false,
      id: "placement_test",
      projectItemId: "project-item_test",
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
