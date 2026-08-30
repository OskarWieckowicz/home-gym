// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultProject } from "@/features/project/defaults";
import type { GymProject } from "@/features/project/schemas/project";
import { ProjectFileActions } from "../components/project-file-actions";
import { ProjectStoreProvider, useProjectStore } from "../store/project-store-context";
import { SIGNAL_BANDS_RECONCILIATION_NOTICE } from "../store/reconcile-catalog-project";
import { createLocalProjectStorage } from "./local-project-storage";
import { ProjectPersistenceBoundary, useProjectPersistence } from "./project-persistence-boundary";

afterEach(cleanup);

function legacyProject(): GymProject {
  return {
    ...createDefaultProject(), budget: 12_345,
    projectItems: [{ id: "project-item_bands", productId: "product_signal_resistance_bands" }],
    placements: [{ id: "placement_bands", projectItemId: "project-item_bands", position: { xCm: 100, zCm: 100 }, rotation: 0 }],
  };
}

function Probe() {
  const state = useProjectStore((value) => value);
  const persistence = useProjectPersistence();
  return <>
    <output data-testid="project">{JSON.stringify(state.project)}</output>
    <output data-testid="history">{`${state.revision}:${state.canUndo}`}</output>
    <output data-testid="persistence">{persistence?.status.message}</output>
    <button onClick={() => state.dispatch({ type: "PROJECT_ITEM_ADDED", payload: { productId: "product_groundwork_foam_roller" } })}>Add roller</button>
  </>;
}

describe("legacy Signal bands session compatibility", () => {
  it("restores the shopping list without fallback or an initialization storage write", async () => {
    const legacy = legacyProject();
    const storage = {
      getItem: vi.fn(() => JSON.stringify(legacy)), setItem: vi.fn(), removeItem: vi.fn(),
    };
    render(<ProjectPersistenceBoundary storage={createLocalProjectStorage(storage)}><Probe /></ProjectPersistenceBoundary>);
    expect(await screen.findByText(SIGNAL_BANDS_RECONCILIATION_NOTICE)).toBeTruthy();
    expect(JSON.parse(screen.getByTestId("project").textContent!)).toEqual({ ...legacy, placements: [] });
    expect(screen.getByTestId("history").textContent).toBe("0:false");
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Add roller" }));
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    const saved = JSON.parse(storage.setItem.mock.calls[0][1]);
    expect(saved.projectItems).toHaveLength(2);
    expect(saved.projectItems[0]).toEqual(legacy.projectItems[0]);
    expect(saved.placements).toEqual([]);
  });

  it("reports compatibility after importing while keeping the purchased bands", async () => {
    const legacy = legacyProject();
    render(<ProjectStoreProvider><ProjectFileActions /><Probe /></ProjectStoreProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Project" }));
    fireEvent.change(screen.getByLabelText("Choose project JSON to import"), {
      target: { files: [{ name: "bands.json", size: 200, text: async () => JSON.stringify(legacy) }] },
    });
    expect(await screen.findByText(SIGNAL_BANDS_RECONCILIATION_NOTICE)).toBeTruthy();
    expect(JSON.parse(screen.getByTestId("project").textContent!)).toEqual({ ...legacy, placements: [] });
    expect(screen.getByTestId("history").textContent).toBe("1:true");
  });
});
