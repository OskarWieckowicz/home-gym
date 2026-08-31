"use client";

import { useRef } from "react";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import { isRetiredProductId } from "@/data/products/retired-products";
import { findPlacementForItem } from "@/features/project/project-lookups";
import type { Placement, ProjectItem } from "@/features/project/schemas/project";

import { useProjectStore } from "../store/project-store-context";
import { EquipmentCatalogThumb } from "./equipment-catalog-thumb";
import { EquipmentUnplaceAction } from "./equipment-unplace-action";
import { PendingPlacementNotice } from "./pending-placement-notice";
import { useProjectShopping } from "../store/use-project-shopping";
import type { ShoppingItem } from "@/features/project/summary/project-shopping";

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
  const shopping = useProjectShopping();
  const shoppingItems = new Map(shopping.items.map((item) => [item.id, item]));

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
      <PendingPlacementNotice pending={shopping.pending} />
      {project.projectItems.length === 0 ? <p>No equipment in the project yet.</p> : (
        <ul>
          {project.projectItems.map((item) => {
            const placement = findPlacementForItem(project, item.id);
            const selected = selectedId === item.id || selectedId === placement?.id;
            return <ProjectEquipmentRow key={item.id} item={item} placement={placement}
              shoppingItem={shoppingItems.get(item.id)} selected={selected}
              active={activeProjectItemId === item.id} onSelect={onSelect} onPlaceItem={onPlaceItem}
              onRemove={removeItem} />;
          })}
        </ul>
      )}
    </div>
  );
}

function ProjectEquipmentRow({ item, placement, shoppingItem, selected, active, onSelect, onPlaceItem, onRemove }: {
  readonly item: ProjectItem;
  readonly placement: Placement | undefined;
  readonly shoppingItem: ShoppingItem | undefined;
  readonly selected: boolean;
  readonly active: boolean;
  readonly onSelect: (id: string) => void;
  readonly onPlaceItem: (id: string) => void;
  readonly onRemove: (item: ProjectItem, name: string, placed: boolean) => void;
}) {
  const selectButton = useRef<HTMLButtonElement>(null);
  const product = findProjectProductById(item.productId);
  const name = product?.name ?? "Unavailable product";
  const canPlace = product?.placementMode === "floor" && !placement;
  return <li>
    <button ref={selectButton} aria-current={selected ? "true" : undefined}
      onClick={() => onSelect(placement?.id ?? item.id)} type="button">
      <EquipmentCatalogThumb productId={item.productId} />
      <span>
        <strong>{name}</strong>
        <small>{placement ? `Placed · ${placement.rotation}°` : shoppingItem?.placementLabel ?? "Not placed"}</small>
        <small>{shoppingItem?.priceLabel ?? "Price unavailable"}</small>
        {isRetiredProductId(item.productId) ? <small>Retired from catalog</small> : null}
      </span>
    </button>
    <div className="creator-item-actions">
      {canPlace ? <button aria-label={`${active ? "Cancel placing" : "Place"} ${name}`}
        aria-pressed={active} onClick={() => onPlaceItem(item.id)} type="button">
        {active ? "Cancel" : "Place"}
      </button> : null}
      <button aria-label={`Remove ${name} from project`}
        onClick={() => onRemove(item, name, placement !== undefined)} type="button">Remove from project</button>
      {placement ? <EquipmentUnplaceAction placementId={placement.id} name={name} onUnplaced={() => {
        selectButton.current?.focus({ preventScroll: true });
        onSelect(item.id);
      }} /> : null}
    </div>
  </li>;
}
