"use client";

import { findProductById } from "@/features/catalog/queries/catalog";
import { findPlacementForItem } from "@/features/project/project-lookups";
import type { ProjectItem } from "@/features/project/schemas/project";

import { useProjectStore } from "../store/project-store-context";
import { EquipmentCatalogThumb } from "./equipment-catalog-thumb";

export function ProjectItemsList({
  activeProjectItemId,
  selectedId,
  onSelect,
  onPlaceItem,
}: {
  readonly activeProjectItemId: string | null;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly onPlaceItem: (projectItemId: string) => void;
}) {
  const project = useProjectStore((state) => state.project);
  const dispatch = useProjectStore((state) => state.dispatch);

  function removeItem(item: ProjectItem, name: string, placed: boolean) {
    const confirmed = !placed || globalThis.confirm(
      `Removing ${name} will also remove it from the floor plan.`,
    );
    if (!confirmed) return;
    dispatch({
      type: "PROJECT_ITEM_REMOVED",
      payload: { projectItemId: item.id },
    });
  }

  return (
    <div className="creator-element-list creator-project-items">
      <h3>Project equipment</h3>
      {project.projectItems.length === 0 ? <p>No equipment in the project yet.</p> : (
        <ul>
          {project.projectItems.map((item) => {
            const product = findProductById(item.productId);
            const placement = findPlacementForItem(project, item.id);
            const name = product?.name ?? "Unavailable product";
            const selected = selectedId === item.id || selectedId === placement?.id;
            const canPlace = product?.placementMode === "floor" && !placement;
            return (
              <li key={item.id}>
                <button
                  aria-current={selected ? "true" : undefined}
                  onClick={() => onSelect(placement?.id ?? item.id)}
                  type="button"
                >
                  <EquipmentCatalogThumb productId={item.productId} />
                  <span>
                    <strong>{name}</strong>
                    <small>{placement ? `Placed · ${placement.rotation}°` : "Unplaced"}</small>
                  </span>
                </button>
                <div className="creator-item-actions">
                  {canPlace ? (
                    <button
                      aria-label={`${activeProjectItemId === item.id ? "Cancel placing" : "Place"} ${name}`}
                      aria-pressed={activeProjectItemId === item.id}
                      onClick={() => onPlaceItem(item.id)}
                      type="button"
                    >
                      {activeProjectItemId === item.id ? "Cancel" : "Place"}
                    </button>
                  ) : null}
                  {placement ? (
                    <button
                      aria-label={`Unplace ${name}`}
                      onClick={() => dispatch({
                        type: "PLACEMENT_REMOVED",
                        payload: { placementId: placement.id },
                      })}
                      type="button"
                    >
                      Unplace
                    </button>
                  ) : null}
                  <button
                    aria-label={`Remove ${name} from project`}
                    onClick={() => removeItem(item, name, placement !== undefined)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
