// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PhysicalObstacle } from "@/features/project/schemas/project";

import { createPlanTransform } from "../plan/plan-transform";
import type { PlanIssueRef } from "../plan/entity-issue-state";
import { ObstacleEntity } from "./room-plan-entities";

const obstacle: PhysicalObstacle = {
  id: "obstacle_wardrobe",
  kind: "obstacle",
  name: "Wardrobe",
  position: { xCm: 20, zCm: 30 },
  dimensions: { widthCm: 100, depthCm: 50, heightCm: 200 },
  functionalClearance: { frontCm: 60, backCm: 0, leftCm: 0, rightCm: 0 },
  rotation: 0,
  locked: false,
};
const transform = createPlanTransform(
  { widthCm: 400, depthCm: 320 },
  { width: 760, height: 560 },
  48,
);
const handlers = {
  onBeginDrag: vi.fn(),
  onMoveDrag: vi.fn(),
  onFinishDrag: vi.fn(),
  onCancelDrag: vi.fn(),
  onKeySelect: vi.fn(),
};

function renderObstacle({
  selectedId = null,
  showAllUseZones = false,
  issues = [],
}: {
  readonly selectedId?: string | null;
  readonly showAllUseZones?: boolean;
  readonly issues?: readonly PlanIssueRef[];
} = {}) {
  const view = render(
    <svg>
      <ObstacleEntity
        {...handlers}
        interactive
        issues={issues}
        obstacle={obstacle}
        position={obstacle.position}
        selectedId={selectedId}
        showAllUseZones={showAllUseZones}
        transform={transform}
      />
    </svg>,
  );
  return view.container.querySelector(".creator-functional-clearance-zone");
}

afterEach(cleanup);

describe("2D furniture functional clearance", () => {
  it("shows the zone for selected, flagged, or show-all obstacles", () => {
    expect(renderObstacle()).toBeNull();
    cleanup();
    expect(renderObstacle({ selectedId: obstacle.id })).toBeTruthy();
    cleanup();
    expect(renderObstacle({ showAllUseZones: true })).toBeTruthy();
    cleanup();
    expect(renderObstacle({
      issues: [{
        severity: "warning",
        entityIds: [obstacle.id, "placement_bench"],
      }],
    })).toBeTruthy();
  });

  it("does not draw an undeclared zero-margin zone", () => {
    const zeroObstacle = {
      ...obstacle,
      functionalClearance: { frontCm: 0, backCm: 0, leftCm: 0, rightCm: 0 },
    };
    const view = render(
      <svg>
        <ObstacleEntity
          {...handlers}
          interactive
          issues={[]}
          obstacle={zeroObstacle}
          position={zeroObstacle.position}
          selectedId={zeroObstacle.id}
          showAllUseZones
          transform={transform}
        />
      </svg>,
    );
    expect(view.container.querySelector(".creator-functional-clearance-zone")).toBeNull();
  });
});
