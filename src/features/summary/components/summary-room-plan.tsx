"use client";

import { useId } from "react";
import { EquipmentEntity } from "@/features/creator/components/equipment-entity";
import { ObstacleEntity, WallElementEntity } from "@/features/creator/components/room-plan-entities";
import { createPlanTransform } from "@/features/creator/plan/plan-transform";
import { productForPlacement } from "@/features/creator/placement-product";
import type { SceneContentsProps } from "@/features/creator/scene/scene-contents";

const VIEWPORT = { width: 800, height: 500 };
const ignoreInteraction = () => undefined;
const noDrag = {
  onBeginDrag: ignoreInteraction,
  onMoveDrag: ignoreInteraction,
  onFinishDrag: ignoreInteraction,
  onCancelDrag: ignoreInteraction,
  onKeySelect: ignoreInteraction,
};

/** Presentation only: no store, commands, selection, or editing controllers. */
export function SummaryRoomPlan({ project, issues }: Omit<SceneContentsProps, "selectedId">) {
  const gridId = useId();
  const transform = createPlanTransform(project.room, VIEWPORT, 45);
  const shared = { interactive: false, selectedId: null, issues, transform } as const;
  return <div role="img" aria-label="Read-only top-down room plan">
    <div inert>
    <svg aria-hidden="true" className="summary-plan"
    viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
    <title>Finished room layout. Equipment and validation details are listed below.</title>
    <defs>
      <pattern id={gridId} width={50 * transform.scale} height={50 * transform.scale}
        patternUnits="userSpaceOnUse" x={transform.offsetX} y={transform.offsetY}>
        <rect className="creator-grid-background" width="100%" height="100%" />
        <path className="creator-grid-line" d={`M ${50 * transform.scale} 0 L 0 0 0 ${50 * transform.scale}`} fill="none" />
      </pattern>
    </defs>
    <rect className="creator-room" fill={`url(#${gridId})`} x={transform.offsetX} y={transform.offsetY}
      width={transform.roomWidth} height={transform.roomHeight} />
    {project.placements.map((placement) => {
      const product = productForPlacement(project, placement);
      return product ? <EquipmentEntity key={placement.id} {...shared} {...noDrag}
        placement={placement} position={placement.position} product={product} /> : null;
    })}
    {project.obstacles.map((obstacle) => <ObstacleEntity key={obstacle.id} {...shared} {...noDrag}
      obstacle={obstacle} position={obstacle.position} />)}
    {project.wallElements.map((element) => <WallElementEntity key={element.id} {...shared}
      element={element} onSelect={ignoreInteraction} onKeySelect={ignoreInteraction} />)}
  </svg>
  </div>
  </div>;
}
