import type { Product } from "@/features/catalog/schemas";
import { createRectangleFootprint } from "@/features/geometry/rectangles";
import { measureSelectionDistances } from "@/features/geometry/selection-distances";
import type { Placement } from "@/features/project/schemas/project";
import { useProjectStore } from "../store/project-store-context";

const WALL_NAMES = { top: "Top wall", right: "Right wall", bottom: "Bottom wall", left: "Left wall" } as const;

function distanceLabel(value: number) {
  if (value < 0) return `${Math.abs(value)} cm outside`;
  return `${value} cm`;
}

/** These are floor-plan measurements, not exercise or access clearance checks. */
export function SelectionDistances({ placement, product }: {
  readonly placement: Placement;
  readonly product: Pick<Product, "dimensions">;
}) {
  const project = useProjectStore((state) => state.project);
  const footprint = createRectangleFootprint(placement.position, product.dimensions, placement.rotation);
  const physicalObstacles = project.obstacles.filter((obstacle) => obstacle.kind === "obstacle").map((obstacle) => ({
    id: obstacle.id, name: obstacle.name,
    bounds: createRectangleFootprint(obstacle.position, obstacle.dimensions, obstacle.rotation),
  }));
  const { wallsCm, nearestObstacle } = measureSelectionDistances(footprint, project.room, physicalObstacles);
  const obstacleDistance = nearestObstacle?.status === "overlapping" ? "Overlapping footprints"
    : nearestObstacle?.status === "touching" ? "0 cm · Touching footprints"
      : nearestObstacle ? `${Number(nearestObstacle.distanceCm.toFixed(1))} cm` : null;

  return <section className="creator-selection-distances" aria-labelledby="selection-distances-title">
    <h3 id="selection-distances-title">Distances to surroundings</h3>
    <dl>
      {Object.entries(WALL_NAMES).map(([wall, label]) => <div key={wall}>
        <dt>{label}</dt><dd>{distanceLabel(wallsCm[wall as keyof typeof WALL_NAMES])}</dd>
      </div>)}
    </dl>
    {nearestObstacle ? <p>Nearest obstacle: <strong>{nearestObstacle.name}</strong><br />{obstacleDistance}</p>
      : <p>No physical obstacles in the room.</p>}
    <p className="creator-help">Floor-plan edges, not safety clearances.</p>
    <details className="creator-distance-method"><summary>How distances are measured</summary>
      <p className="creator-help">Wall names follow the 2D plan. Heights, use zones and unavailable zones are excluded.</p>
    </details>
  </section>;
}
