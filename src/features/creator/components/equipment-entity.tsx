"use client";

import type { KeyboardEvent, PointerEvent } from "react";

import type { Product } from "@/features/catalog/schemas";
import { createEquipmentFootprints } from "@/features/geometry/equipment-footprints";
import type { RectangleFootprint } from "@/features/geometry/rectangles";
import type { Placement } from "@/features/project/schemas/project";
import { getVisualAsset } from "@/features/creator/scene/visual-assets";

import type { PlanTransform } from "../plan/plan-transform";

function toPlanRectangle(footprint: RectangleFootprint, transform: PlanTransform) {
  return {
    x: transform.offsetX + footprint.minX * transform.scale,
    y: transform.offsetY + footprint.minZ * transform.scale,
    width: footprint.widthCm * transform.scale,
    height: footprint.depthCm * transform.scale,
  };
}

function topViewTransform(rotation: Placement["rotation"], physical: ReturnType<typeof toPlanRectangle>) {
  switch (rotation) {
    case 0: return `translate(${physical.x} ${physical.y})`;
    case 90: return `translate(${physical.x} ${physical.y + physical.height}) rotate(-90)`;
    case 180: return `translate(${physical.x + physical.width} ${physical.y + physical.height}) rotate(-180)`;
    case 270: return `translate(${physical.x + physical.width} ${physical.y}) rotate(-270)`;
  }
}

export function EquipmentEntity({
  interactive,
  issues,
  placement,
  position,
  product,
  selectedId,
  transform,
  onBeginDrag,
  onCancelDrag,
  onFinishDrag,
  onKeySelect,
  onMoveDrag,
}: {
  readonly interactive: boolean;
  readonly issues: readonly { readonly entityIds: readonly string[] }[];
  readonly placement: Placement;
  readonly position: Placement["position"];
  readonly product: Product;
  readonly selectedId: string | null;
  readonly transform: PlanTransform;
  readonly onBeginDrag: (event: PointerEvent<SVGGElement>, placement: Placement) => void;
  readonly onCancelDrag: () => void;
  readonly onFinishDrag: (event: PointerEvent<SVGGElement>) => void;
  readonly onKeySelect: (event: KeyboardEvent<SVGGElement>, id: string) => void;
  readonly onMoveDrag: (event: PointerEvent<SVGGElement>) => void;
}) {
  const footprints = createEquipmentFootprints({ ...placement, position }, product);
  const physical = toPlanRectangle(footprints.physical, transform);
  const clearance = toPlanRectangle(footprints.clearance, transform);
  const selected = placement.id === selectedId;
  const invalid = issues.some((issue) => issue.entityIds.includes(placement.id));
  const topViewSrc = getVisualAsset(product.id)?.topViewSrc;
  const canonicalWidth = product.dimensions.widthCm * transform.scale;
  const canonicalHeight = product.dimensions.depthCm * transform.scale;

  return (
    <g
      aria-label={`${product.name}, equipment, ${placement.rotation} degrees${invalid ? ", has layout issue" : ""}`}
      aria-pressed={selected}
      className={["creator-plan-equipment", topViewSrc && "has-top-view", selected && "is-selected", invalid && "is-invalid", !interactive && "is-placement-disabled"].filter(Boolean).join(" ")}
      onKeyDown={(event) => onKeySelect(event, placement.id)}
      onLostPointerCapture={onCancelDrag}
      onPointerCancel={onCancelDrag}
      onPointerDown={(event) => onBeginDrag(event, placement)}
      onPointerMove={onMoveDrag}
      onPointerUp={onFinishDrag}
      role="button"
      tabIndex={interactive ? 0 : -1}
    >
      <rect
        aria-hidden="true"
        className="creator-equipment-clearance"
        height={clearance.height}
        width={clearance.width}
        x={clearance.x}
        y={clearance.y}
      />
      <rect
        className="creator-equipment-footprint"
        height={physical.height}
        width={physical.width}
        x={physical.x}
        y={physical.y}
      />
      {topViewSrc ? (
        <>
          <g aria-hidden="true" transform={topViewTransform(placement.rotation, physical)}>
            <image
              className="creator-equipment-top-view"
              height={canonicalHeight}
              href={topViewSrc}
              pointerEvents="none"
              preserveAspectRatio="none"
              width={canonicalWidth}
            />
          </g>
          <rect
            aria-hidden="true"
            className="creator-equipment-outline"
            height={physical.height}
            width={physical.width}
            x={physical.x}
            y={physical.y}
          />
        </>
      ) : (
        <text
          aria-hidden="true"
          className="creator-equipment-label"
          x={physical.x + physical.width / 2}
          y={physical.y + physical.height / 2}
        >
          {product.name}
        </text>
      )}
      {invalid ? (
        <text aria-hidden="true" className="creator-entity-mark" x={physical.x + physical.width - 15} y={physical.y + physical.height - 7}>!</text>
      ) : null}
    </g>
  );
}
