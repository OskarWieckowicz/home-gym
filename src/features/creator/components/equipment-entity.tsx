"use client";

import type { KeyboardEvent, PointerEvent } from "react";

import { getEffectiveMounting } from "@/features/catalog/queries";
import type { Product } from "@/features/catalog/schemas";
import { createEquipmentFootprints } from "@/features/geometry/equipment-footprints";
import type { RectangleFootprint } from "@/features/geometry/rectangles";
import type { Placement } from "@/features/project/schemas/project";
import { getVisualAsset } from "@/features/creator/scene/visual-assets";

import type { PlanTransform } from "../plan/plan-transform";
import {
  entityIssueAriaSuffix,
  entityIssueClassName,
  entityIssueState,
  type PlanIssueRef,
} from "../plan/entity-issue-state";

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
  readonly issues: readonly PlanIssueRef[];
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
  const useZone = toPlanRectangle(footprints.useZone, transform);
  const selected = placement.id === selectedId;
  const issueState = entityIssueState(placement.id, issues);
  const topViewSrc = getVisualAsset(product.id)?.topViewSrc;
  const wallMounted = getEffectiveMounting(product).kind === "wall";
  const canonicalWidth = product.dimensions.widthCm * transform.scale;
  const canonicalHeight = product.dimensions.depthCm * transform.scale;

  return (
    <g
      aria-label={`${product.name}, ${wallMounted ? "wall-mounted equipment" : "equipment"}, ${placement.rotation} degrees${entityIssueAriaSuffix(issueState)}`}
      aria-pressed={selected}
      className={["creator-plan-equipment", wallMounted && "is-wall-mounted", topViewSrc && "has-top-view", selected && "is-selected", entityIssueClassName(issueState), !interactive && "is-placement-disabled"].filter(Boolean).join(" ")}
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
        className="creator-equipment-use-zone"
        height={useZone.height}
        width={useZone.width}
        x={useZone.x}
        y={useZone.y}
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
      {issueState ? (
        <text aria-hidden="true" className="creator-entity-mark" x={physical.x + physical.width - 15} y={physical.y + physical.height - 7}>!</text>
      ) : null}
    </g>
  );
}
