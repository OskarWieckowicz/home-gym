// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { findProductById } from "@/features/catalog/queries";
import { createDefaultProject } from "@/features/project/defaults";
import { toProjectItemsAndPlacements } from "@/features/project/validation/test-placed-equipment";
import { type ProjectStore } from "../store/project-store";
import { ProjectStoreProvider, useProjectStore, useProjectStoreApi } from "../store/project-store-context";
import { SelectionDistances } from "./selection-distances";

afterEach(cleanup);
const product = findProductById("product_arc_adjustable_bench")!;
function Host({ capture }: { capture: (store: ProjectStore) => void }) {
  capture(useProjectStoreApi());
  const placement = useProjectStore((state) => state.project.placements[0]);
  return <SelectionDistances placement={placement} product={product} />;
}

describe("selected equipment distances", () => {
  it("uses rotated physical bounds, ignores unavailable zones and refreshes with shared changes and undo", () => {
    const project = { ...createDefaultProject(),
      ...toProjectItemsAndPlacements([{ id: "placement_bench", productId: product.id,
        position: { xCm: 100, zCm: 100 }, rotation: 90 }]),
    };
    project.obstacles = [
      { id: "obstacle_zone", kind: "unavailable-zone", name: "Zone", position: { xCm: 100, zCm: 100 },
        dimensions: { widthCm: 100, depthCm: 100 }, rotation: 0, locked: false },
      { id: "obstacle_cabinet", kind: "obstacle", name: "Cabinet", position: { xCm: 252, zCm: 100 },
        dimensions: { widthCm: 40, depthCm: 40, heightCm: 100 }, rotation: 0, locked: false },
    ];
    let store!: ProjectStore;
    render(<ProjectStoreProvider initialProject={project}><Host capture={(value) => { store = value; }} /></ProjectStoreProvider>);
    const section = screen.getByRole("region", { name: "Distances to surroundings" });
    expect(within(section).getByText("Cabinet")).toBeTruthy();
    expect(section.textContent).toContain("10 cm");
    expect(within(section).getByText(`${project.room.widthCm - 242} cm`)).toBeTruthy();
    act(() => { store.getState().dispatch({ type: "PLACEMENT_UPDATED", payload: {
      placementId: "placement_bench", patch: { position: { xCm: 110, zCm: 100 } },
    } }); });
    expect(section.textContent).toContain("0 cm · Touching footprints");
    act(() => { store.getState().undo(); });
    expect(section.textContent).toContain("10 cm");
    expect(section.textContent).not.toContain("Touching");
    expect(section.textContent).toContain("not safety clearances");
  });
});
